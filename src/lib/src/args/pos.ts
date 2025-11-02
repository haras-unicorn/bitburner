import { adding } from "bitripper-lib/decor";

export const withArg = <T extends string>(pos: number, name: T) =>
  adding((ctx) => {
    const arg = ctx.ns.args[pos];
    if (!arg) {
      throw new Error(`please set ${name} as args[${pos}]`);
    }

    return { [name]: arg } as Record<T, typeof arg>;
  });

export const withStringArg = <T extends string>(pos: number, name: T) =>
  adding((ctx) => {
    const arg = ctx.ns.args[pos];
    if (!arg) {
      throw new Error(`please set ${name} as args[${pos}]`);
    }

    return { [name]: arg.toString() } as Record<T, string>;
  });

export const withFileJsonArg =
  <R>(validate: (x: unknown) => x is R) =>
  <T extends string>(pos: number, name: T) =>
    adding((ctx) => {
      const arg = ctx.ns.args[pos];
      if (!arg) {
        throw new Error(`please set ${name} as args[${pos}]`);
      }

      if (typeof arg !== "string") {
        throw new Error(`${arg} is not a string`);
      }

      const read = ctx.ns.read(arg);
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
        throw new Error(
          `${arg} doesn't contain an object of the specified type`,
        );
      }

      return { [name]: parsed } as Record<T, R>;
    });

export const withFileJsonArrayArg =
  <R>(validate: (x: unknown) => x is R) =>
  <T extends string>(pos: number, name: T) =>
    adding((ctx) => {
      const arg = ctx.ns.args[pos];
      if (!arg) {
        throw new Error(`please set ${name} as args[${pos}]`);
      }

      if (typeof arg !== "string") {
        throw new Error(`${arg} is not a string`);
      }

      const read = ctx.ns.read(arg);
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

      return { [name]: parsed } as Record<T, R[]>;
    });
