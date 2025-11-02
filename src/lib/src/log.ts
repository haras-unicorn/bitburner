import { adding } from "bitripper-lib/decor";
import type NS from "bitripper-ns/ns";

export type LogArg = number | string | boolean | object;

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
    log: (...logArgs: LogArg[]) =>
      log({ ns: ctx.ns, logFile, host }, false, ...logArgs),
    logMultiline: (...logArgs: LogArg[]) =>
      log({ ns: ctx.ns, logFile, host }, true, ...logArgs),
  };
});

const log = (
  ctx: { ns: NS; logFile: string; host?: string },
  multiline: boolean,
  ...logArgs: LogArg[]
) => {
  const now = new Date(Date.now()).toISOString();
  const logSeparator = multiline ? "\n" : " ";
  const logString =
    logSeparator +
    logArgs
      .map((arg) =>
        typeof arg === "object"
          ? JSON.stringify(arg, undefined, multiline ? 2 : undefined)
          : arg.toString().trim(),
      )
      .join(logSeparator);
  const msg = ctx.host
    ? `[${now}] <${ctx.host}>:${logString}`
    : `[${now}]:${logString}`;
  ctx.ns.print(msg);
  ctx.ns.write(ctx.logFile, `${msg}\n`, "a");
};

export const dedent = (str: string, amount: number = 0) => {
  const spaces = Array.from(Array(amount).keys())
    .map((_) => " ")
    .join("");
  return str
    .split("\n")
    .map(
      amount > 0
        ? (line) =>
            line.startsWith(spaces) ? line.slice(amount, -1) : line.trimStart()
        : (line) => line.trimStart(),
    )
    .join("\n");
};

export const indent = (str: string, amount: number) => {
  const spaces = Array.from(Array(amount).keys())
    .map((_) => " ")
    .join("");
  return str
    .split("\n")
    .map((line) => `${spaces}${line}`)
    .join("\n");
};
