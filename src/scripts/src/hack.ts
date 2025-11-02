import { withStringArg } from "bitripper-lib/args/pos";
import { createContext } from "bitripper-lib/ctxs";
import { withLog } from "bitripper-lib/log";
import type NS from "bitripper-ns/ns";

export async function main(ns: NS) {
  const ctx = createContext(ns)
    .decorate(withLog)
    .decorate(withStringArg(0, "server"));

  const hacked = await ctx.ns.hack(ctx.server);
  ctx.log("hacked", hacked);
}
