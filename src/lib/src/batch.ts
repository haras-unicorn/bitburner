import type NS from "bitripper-lib/ns";
import { DateTime, Duration } from "luxon";

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
    Duration.fromMillis(
      script === hack
        ? ns.getHackTime(target)
        : script === weaken
          ? ns.getWeakenTime(target)
          : ns.getGrowTime(target),
    ),
  );
  const maxDuration = Duration.fromMillis(
    Math.max(...durations.map((duration) => duration.milliseconds)),
  );
  const stepDuration = Duration.fromMillis(
    Math.max(
      maxDuration.milliseconds / workers + stepDelayMillis,
      minStepMillis,
    ),
  );

  const start = DateTime.utc()
    .plus({ milliseconds: startDelayMillis })
    .plus(maxDuration);
  const end = start.plus(maxDuration.plus(maxDuration));

  const tasks = Array.from(
    Array(Math.ceil(end.diff(start).milliseconds / stepDuration.milliseconds)),
  ).map((i) => {
    const script = scripts[i % scripts.length];
    const duration = durations[i % durations.length];
    const end = start.plus({ milliseconds: stepDuration.milliseconds * i });
    return {
      script: script,
      start: end.minus(duration),
      end: end,
    };
  });
  tasks.sort((l, r) => l.start.diff(r.start).milliseconds);

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
    const duration = Duration.fromMillis(
      script === hack
        ? ns.getHackTime(target)
        : script === weaken
          ? ns.getWeakenTime(target)
          : ns.getGrowTime(target),
    );

    const start = task.end.minus(duration);
    const waitMillis = start.diff(DateTime.utc()).milliseconds;
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
