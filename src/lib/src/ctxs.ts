import { adding, decorable } from "./decor";
import type { NS, ScriptArg } from "./ns";

export const createContext = (ns: NS) => {
  return decorable({ ns });
};

export const withScriptArg = <T extends string>(pos: number, name: T) =>
  adding((ctx) => {
    const arg = ctx.ns.args[pos];
    if (!arg) {
      throw new Error(`please set ${name} as args[${pos}]`);
    }

    return { [name]: arg } as Record<T, typeof arg>;
  });

export const withStringArg = <T extends string>(pos: number, name: T) =>
  adding((ctx) => {
    const arg = ctx.ns.args[pos];
    if (!arg) {
      throw new Error(`please set ${name} as args[${pos}]`);
    }

    return { [name]: arg.toString() } as Record<T, string>;
  });

export const withHostname = adding((ctx) => ({
  host: ctx.ns.getHostname(),
}));

export const withLog = adding((ctx) => {
  const script = ctx.ns.getScriptName().replace(/[^a-zA-Z0-9]/g, "-");
  const scriptArgs = ctx.ns.args
    .map((arg) => String(arg).replace(/[^a-zA-Z0-9]/g, "-"))
    .join("-");

  const logFile = `${script}-${scriptArgs}.txt`;

  ctx.ns.write(logFile, "", "w");
  ctx.ns.disableLog("ALL");

  let host: string | undefined;
  if ("host" in ctx && typeof ctx.host === "string") {
    host = ctx.host;
  }

  return {
    logFile,
    log: (...logArgs: ScriptArg[]) =>
      log({ ns: ctx.ns, logFile, host }, ...logArgs),
  };
});

export const withPortAttacks = adding((ctx) => ({
  portAttacks: [
    { exe: "BruteSSH.exe", func: ctx.ns.brutessh },
    { exe: "FTPCrack.exe", func: ctx.ns.ftpcrack },
  ],
}));

export const withHackingLevel = adding((ctx) => ({
  hackingLevel: ctx.ns.getHackingLevel(),
}));

const log = (
  ctx: { ns: NS; logFile: string; host?: string },
  ...logArgs: ScriptArg[]
) => {
  const now = new Date(Date.now()).toISOString();
  const msg = ctx.host
    ? `[${now}] <${ctx.host}>: ${logArgs.join(" ")}`
    : `[${now}]: ${logArgs.join(" ")}`;
  ctx.ns.print(msg);
  ctx.ns.write(ctx.logFile, `${msg}\n`, "a");
};
