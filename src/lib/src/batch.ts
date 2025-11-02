import type NS from "bitripper-ns/ns";

export type ScheduleBatchRequest = {
  ns: NS;
  hosts: string[];
  target: string;
  cycle: ("hack" | "grow" | "weaken")[];
  hack: string;
  grow: string;
  weaken: string;
  startDelayMillis: number;
  stepDelayMillis: number;
  minStepMillis: number;
  leftoverRam: number;
};

export type ScheduleBatchResponse = {
  success: boolean;
};

export async function scheduleBatch({
  ns,
  hosts,
  target,
  cycle,
  hack,
  grow,
  weaken,
  startDelayMillis,
  stepDelayMillis,
  minStepMillis,
  leftoverRam,
}: ScheduleBatchRequest): Promise<ScheduleBatchResponse> {
  const scripts = cycle.map((script) =>
    script === "hack" ? hack : script === "grow" ? grow : weaken,
  );

  const maxScriptRam = [weaken, grow, hack]
    .map((script) => ns.getScriptRam(script))
    .sort((l, r) => r - l)[0];

  const workers = hosts
    .map((host) => {
      const free = ns.getServerMaxRam(host) - leftoverRam;
      if (free <= 0 || maxScriptRam <= 0) return 0;
      return Math.floor(free / maxScriptRam);
    })
    .reduce((acc, next) => acc + next);

  const durations = scripts.map((script) =>
    script === hack
      ? ns.getHackTime(target)
      : script === weaken
        ? ns.getWeakenTime(target)
        : ns.getGrowTime(target),
  );
  const maxDuration = Math.max(...durations.map((duration) => duration));
  const stepDuration = Math.max(
    maxDuration / workers + stepDelayMillis,
    minStepMillis,
  );

  const start = Date.now() + startDelayMillis + maxDuration;
  const end = start + maxDuration;

  const tasks = Array.from(Array(Math.ceil(end - start / stepDuration))).map(
    (i) => {
      const script = scripts[i % scripts.length];
      const duration = durations[i % durations.length];
      const end = start + stepDuration;
      return {
        script: script,
        start: end - duration,
        end: end,
      };
    },
  );
  tasks.sort((l, r) => l.start - r.start);

  const startedPids = [];

  for (const task of tasks) {
    const taskHosts = hosts
      .slice()
      .filter(
        (host) =>
          ns.getServerMaxRam(host) -
            ns.getServerUsedRam(host) -
            ns.getScriptRam(task.script) >=
          leftoverRam,
      )
      .sort((l, r) => {
        const lr = ns.getServerMaxRam(l) - ns.getServerUsedRam(l);
        const rr = ns.getServerMaxRam(r) - ns.getServerUsedRam(r);
        return rr - lr;
      });
    if (taskHosts.length === 0) {
      for (const p of startedPids) {
        ns.kill(p);
      }
      return {
        success: false,
      };
    }
    const taskHost = taskHosts[0];

    const script = task.script;
    const duration =
      script === hack
        ? ns.getHackTime(target)
        : script === weaken
          ? ns.getWeakenTime(target)
          : ns.getGrowTime(target);

    const start = task.end - duration;
    const waitMillis = start - Date.now();
    if (waitMillis < 0) {
      for (const p of startedPids) {
        ns.kill(p);
      }
      return {
        success: false,
      };
    }
    await ns.sleep(waitMillis);

    const execPid = ns.exec(task.script, taskHost);
    if (execPid === 0) {
      for (const p of startedPids) {
        ns.kill(p);
      }
      return {
        success: false,
      };
    }

    startedPids.push(execPid);
  }

  return {
    success: true,
  };
}
