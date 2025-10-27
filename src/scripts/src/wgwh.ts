import { createContext, withLog, withStringArg } from "bitripper-lib/ctxs";
import type NS from "bitripper-lib/ns";

export async function main(ns: NS) {
  const ctx = createContext(ns)
    .decorate(withLog)
    .decorate(withStringArg(0, "server"));

  while (true) {
    const weakened = await ns.weaken(ctx.server);
    ctx.log("weakened", weakened);
    const grown = await ns.grow(ctx.server);
    ctx.log("grown", grown);
    const weakenedSecond = await ns.weaken(ctx.server);
    ctx.log("weakened", weakenedSecond);
    const hacked = await ns.hack(ctx.server);
    ctx.log("hacked", hacked);
  }
}
