import { withStringArg } from "bitripper-lib/args/pos";
import { createContext } from "bitripper-lib/ctxs";
import { withLog } from "bitripper-lib/log";
import type NS from "bitripper-ns/ns";

export async function main(ns: NS) {
  const ctx = createContext(ns)
    .decorate(withLog)
    .decorate(withStringArg(0, "server"));

  const grown = await ctx.ns.grow(ctx.server);
  ctx.log("grown", grown);
}
