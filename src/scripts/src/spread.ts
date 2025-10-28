import { withStringArg } from "bitripper-lib/args/simple";
import {
  createContext,
  withHackingLevel,
  withHostname,
  withPortAttacks,
} from "bitripper-lib/ctxs";
import { withLog } from "bitripper-lib/log";
import type NS from "bitripper-lib/ns";

export async function main(ns: NS) {
  const ctx = createContext(ns)
    .decorate(withHackingLevel)
    .decorate(withStringArg(0, "script"))
    .decorate(withPortAttacks)
    .decorate(withHostname)
    .decorate(withLog);
  type SpreadCtx = typeof ctx;

  while (true) {
    spreadOnce(ctx);
    await ctx.ns.sleep(1000);
  }

  function spreadOnce(ctx: SpreadCtx) {
    const { ns } = ctx;

    const servers = root(ctx);
    servers.sort((a, b) => {
      const scoreA = ns.getServerMaxMoney(a) / ns.getWeakenTime(a);
      const scoreB = ns.getServerMaxMoney(b) / ns.getWeakenTime(b);
      return scoreB - scoreA;
    });

    for (const server of servers) {
      const serverRam = ns.getServerMaxRam(server);
      for (const client of servers) {
        const serverUsedRam = ns.getServerUsedRam(server);
        const scriptRam = ns.getScriptRam(ctx.script);
        if (scriptRam > serverRam - serverUsedRam + 0.0001) {
          break;
        }

        const requiredHackingLevel = ns.getServerRequiredHackingLevel(client);
        if (ctx.hackingLevel < requiredHackingLevel) {
          continue;
        }

        start({ ...ctx, server, client });
      }
    }
  }

  function root({ ns, log, portAttacks }: SpreadCtx) {
    let toVisit = ns.scan("home");
    const visited = ["home"];
    const result = [];

    do {
      const server = toVisit[0];
      toVisit = toVisit.slice(1);
      visited.push(server);

      const moreToVisit = ns
        .scan(server)
        .filter((server) => visited.indexOf(server) === -1);
      toVisit = toVisit.concat(moreToVisit);

      if (!ns.hasRootAccess(server)) {
        const portsRequired = ns.getServerNumPortsRequired(server);
        let portsWeCanOpen = 0;

        for (const portAttack of portAttacks) {
          if (ns.fileExists(portAttack.exe, "home")) {
            let successful = false;
            try {
              successful = portAttack.func(server);
              portsWeCanOpen++;
            } catch {
              successful = false;
            }
            if (successful) {
              log(portAttack.exe, "succeeded on", server);
            } else {
              log(portAttack.exe, "failed on", server);
            }
          }
        }

        if (portsWeCanOpen < portsRequired) {
          continue;
        }

        let nuked = false;
        try {
          nuked = ns.nuke(server);
        } catch {
          nuked = false;
        }
        if (nuked) {
          log("nuking", server, "succeeded");
        } else {
          log("nuking", server, "failed");
          continue;
        }

        log("root acquired for", server);
      }

      if (!ns.fileExists("ns.js", server)) {
        const copied = ns.scp("ns.js", server);
        if (!copied) {
          log("failed copying ns.js on", server);
        } else {
          log("script ns.js copied to", server);
        }
      }

      result.push(server);
    } while (toVisit.length > 0);

    return result;
  }

  function start({
    script,
    ns,
    log,
    server,
    client,
  }: SpreadCtx & { server: string; client: string }) {
    const copied = ns.scp(script, server);
    if (!copied) {
      log("failed copying", script, "on", server);
      return;
    }
    log("script", script, "copied to", server);

    const id = ns.exec(script, server, undefined, client);
    if (id === 0) {
      log("failed starting", script, "on", server, "with", client);
      return;
    }

    log("started", script, "on", server, "with", client);
  }
}
