import { building } from "bitripper-lib/build";
import type NS from "bitripper-lib/ns";
import type Yargs from "yargs";
import type { Argv } from "yargs";
import _yargs from "yargs/browser";

const yargs = _yargs as typeof Yargs;

type YargsTransform<Out> = (parser: Argv) => Argv<Out>;

export const withYargs = <Out>(name: string, transform?: YargsTransform<Out>) =>
  building(async (ctx) => {
    const base = yargs(ctx.ns.args as string[])
      .scriptName(name)
      .exitProcess(false)
      .showHelpOnFail(false)
      .strict();

    const parser = transform ? transform(base) : base;

    try {
      const parsed = await parser.parseAsync();
      return { yargs: parsed } as { yargs: Out };
    } catch (e: unknown) {
      const help = await parser.getHelp();
      const message =
        e &&
        typeof e === "object" &&
        "message" in e &&
        e.message &&
        typeof e.message === "string"
          ? e.message
          : "yargs parse error";
      throw new Error(`${message}\n${help}`);
    }
  });

export const coerceJsonFile =
  <R>(ns: NS, validate: (x: unknown) => x is R) =>
  (arg: unknown) => {
    if (typeof arg !== "string") {
      throw new Error(`${arg} is not a string`);
    }

    const read = ns.read(arg);
    if (read === "") {
      throw new Error(`${arg} is not an existing file`);
    }

    let parsed: object | null = null;
    try {
      parsed = JSON.parse(read);
    } catch {
      throw new Error(`${arg} doesn't contain valid json`);
    }

    if (parsed === null || typeof parsed !== "object") {
      throw new Error(`${arg} doesn't contain an object`);
    }

    if (!validate(parsed)) {
      throw new Error(`${arg} doesn't contain an object of the specified type`);
    }

    return parsed;
  };

export const coerceJsonArrayArg =
  <R>(ns: NS, validate: (x: unknown) => x is R) =>
  (arg: unknown) => {
    if (typeof arg !== "string") {
      throw new Error(`${arg} is not a string`);
    }

    const read = ns.read(arg);
    if (read === "") {
      throw new Error(`${arg} is not an existing file`);
    }

    let parsed: object | null = null;
    try {
      parsed = JSON.parse(read);
    } catch {
      throw new Error(`${arg} doesn't contain valid json`);
    }

    if (!Array.isArray(parsed)) {
      throw new Error(`${arg} doesn't contain an array`);
    }

    if (!parsed.every(validate)) {
      throw new Error(`${arg} doesn't contain an array of specified objects`);
    }

    return parsed;
  };
