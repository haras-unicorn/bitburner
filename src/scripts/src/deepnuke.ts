import {
  createContext,
  withHackingLevel,
  withHostname,
  withLog,
  withPortAttacks,
  withStringArg,
} from "bitripper-lib/ctxs";
import type NS from "bitripper-lib/ns";

export async function main(_ns: NS) {
  const { ns, log, portAttacks, output } = createContext(_ns)
    .decorate(withHackingLevel)
    .decorate(withPortAttacks)
    .decorate(withHostname)
    .decorate(withStringArg(0, "output"))
    .decorate(withLog);

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

    result.push(server);
  } while (toVisit.length > 0);

  ns.write(`${output}.txt`, JSON.stringify(result), "w");
}
