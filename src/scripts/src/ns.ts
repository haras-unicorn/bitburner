import type NS from "bitripper-ns/ns";

export async function main(ns: NS) {
  const key = ns.args[0];
  const rest = ns.args.slice(1);

  if (typeof key !== "string") {
    ns.tprint("please provide a string for the first argument");
    return;
  }

  const keyExists = (key: string): key is keyof NS => key in ns;
  if (!keyExists(key)) {
    ns.tprint("function", key, "doesn't exist");
    return;
  }

  const func = ns[key];
  if (typeof func !== "function") {
    ns.tprint(key, "isn't a function");
    return;
  }

  ns.tprint("executing ns.", key, " with ", rest.join(" "));

  // @ts-expect-error
  const maybePromise = func(...rest);

  const result = await Promise.resolve(maybePromise);

  ns.tprint(result);
}
