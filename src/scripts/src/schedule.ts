import { withArgs } from "bitripper-lib/args/parsed";
import { type ScheduleBatchRequest, scheduleBatch } from "bitripper-lib/batch";
import { createContext } from "bitripper-lib/ctxs";
import { withLog } from "bitripper-lib/log";
import type NS from "bitripper-ns/ns";

export async function main(_ns: NS) {
  const {
    ns,
    logMultiline,
    args: {
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
  } = createContext(_ns)
    .decorate(withLog)
    .decorate(
      withArgs("schedule", (args) =>
        args
          .arg("hosts", "string")
          .arg("weaken", "string")
          .arg("grow", "string")
          .arg("hack", "string")
          .arg("startDelayMillis", "number")
          .default(500)
          .arg("stepDelayMillis", "number")
          .default(100)
          .arg("minStepMillis", "number")
          .default(500)
          .arg("abortDelayMillis", "number")
          .default(1000)
          .arg("moneyPercentThreshold", "number")
          .default(0.8)
          .arg("securityMultiplierThreshold", "number")
          .default(1.2)
          .arg("thresholdTolerance", "number")
          .default(0.1)
          .arg("leftoverRam", "number")
          .default(2)
          .build(),
      ),
    );

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
