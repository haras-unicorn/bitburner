import { createContext, withLog, withStringArg } from "bitripper-lib/ctxs";
import type NS from "bitripper-lib/ns";

export async function main(ns: NS) {
  const ctx = createContext(ns)
    .decorate(withLog)
    .decorate(withStringArg(0, "server"));

  const grown = await ctx.ns.grow(ctx.server);
  ctx.log("grown", grown);
}
