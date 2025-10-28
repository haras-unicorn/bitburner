import { coerceJsonArrayArg, withYargs } from "bitripper-lib/args/yargs";
import { type ScheduleBatchRequest, scheduleBatch } from "bitripper-lib/batch";
import { createContext } from "bitripper-lib/ctxs";
import { withLog } from "bitripper-lib/log";
import type NS from "bitripper-lib/ns";

export async function main(_ns: NS) {
  const {
    ns,
    logMultiline,
    yargs: {
      hosts,
      weaken,
      grow,
      hack,
      startDelayMillis,
      stepDelayMillis,
      minStepMillis,
      abortDelayMillis,
      moneyPercentThreshold,
      securityMultiplierThreshold,
      thresholdTolerance,
      leftoverRam,
    },
  } = await createContext(_ns)
    .decorate(withLog)
    .design(
      withYargs("schedule", (yargs) =>
        yargs
          .positional("hosts", {
            type: "string",
            demandOption: true,
            coerce: coerceJsonArrayArg(_ns, (x) => typeof x === "string"),
          })
          .positional("weaken", { type: "string", demandOption: true })
          .positional("hack", { type: "string", demandOption: true })
          .positional("grow", { type: "string", demandOption: true })
          .option("startDelayMillis", { type: "number", default: 500 })
          .option("stepDelayMillis", { type: "number", default: 100 })
          .option("minStepMillis", { type: "number", default: 500 })
          .option("abortDelayMillis", { type: "number", default: 1000 })
          .option("moneyPercentThreshold", { type: "number", default: 0.8 })
          .option("securityMultiplierThreshold", {
            type: "number",
            default: 1.2,
          })
          .option("thresholdTolerance", { type: "number", default: 0.1 })
          .option("leftoverRam", { type: "number", default: 2 }),
      ),
    )
    .build();

  if (hosts.length < 1) {
    throw new Error("expected at least one host");
  }

  const target = hosts.sort(
    (l, r) => ns.getServerMaxMoney(r) - ns.getServerMaxMoney(l),
  )[0];

  const scheduleBatchRequestBase: ScheduleBatchRequest = {
    ns,
    hosts,
    target,
    cycle: [],
    hack,
    grow,
    weaken,
    startDelayMillis,
    stepDelayMillis,
    minStepMillis,
    leftoverRam,
  };

  const makeChecks = () => {
    const moneyAvailable = ns.getServerMoneyAvailable(target);
    const maxMoney = ns.getServerMaxMoney(target);
    const moneyPercentage = moneyAvailable / maxMoney;
    const securityLevel = ns.getServerSecurityLevel(target);
    const minSecurityLevel = ns.getServerMinSecurityLevel(target);
    const securityMultiplier = securityLevel / minSecurityLevel;
    return {
      moneyAvailable,
      maxMoney,
      moneyPercentage,
      securityLevel,
      minSecurityLevel,
      securityMultiplier,
    };
  };

  while (true) {
    let checks = makeChecks();
    while (
      checks.moneyPercentage < moneyPercentThreshold ||
      checks.securityMultiplier > securityMultiplierThreshold
    ) {
      logMultiline(checks);
      const response = await scheduleBatch({
        ...scheduleBatchRequestBase,
        cycle: ["weaken", "weaken", "grow"],
      });
      if (!response.success) {
        await ns.sleep(abortDelayMillis);
      }
      checks = makeChecks();
    }

    while (
      moneyPercentThreshold - checks.moneyPercentage < thresholdTolerance &&
      checks.securityMultiplier - securityMultiplierThreshold <
        thresholdTolerance
    ) {
      logMultiline(checks);
      const response = await scheduleBatch({
        ...scheduleBatchRequestBase,
        cycle: ["weaken", "weaken", "grow", "hack"],
      });
      if (!response.success) {
        await ns.sleep(abortDelayMillis);
      }
      checks = makeChecks();
    }
  }
}
