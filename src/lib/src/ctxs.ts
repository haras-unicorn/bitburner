import type { Builder, BuildTypeSymbol } from "bitripper-lib/build";
import {
  adding,
  type DecorationTypeSymbol,
  type Decorator,
} from "bitripper-lib/decor";
import type { NS } from "bitripper-lib/ns";

export type ContextBase = { ns: NS };

export type Context<T extends object, O extends object = object> = ContextBase &
  T & {
    decorate: <R extends object, D extends Decorator<R>>(
      decorator: D,
    ) => Context<T & D[typeof DecorationTypeSymbol], O>;
    design: <R, B extends Builder<R>>(
      builder: B,
    ) => Context<T, O & B[typeof BuildTypeSymbol]>;
    build: () => PromiseLike<Context<T & O>>;
  };

export const createContext = (ns: NS) => {
  const context: Context<{ ns: NS }> = {
    ns,
    decorate: (decorator) => {
      const decoration = decorator(context);
      // biome-ignore lint/suspicious/noExplicitAny: mutate by copying keys
      for (const key of Object.keys(decoration as any)) {
        // biome-ignore lint/suspicious/noExplicitAny: need to mutate like this
        (context as any)[key] = (decoration as any)[key];
      }
      // biome-ignore lint/suspicious/noExplicitAny: not the same type but has all properties
      return context as any;
    },
    design: (builder) => {
      const lastBuild = context.build;
      const newBuild = async () => {
        const built = await lastBuild();
        const newBuild = await builder(built);
        // biome-ignore lint/suspicious/noExplicitAny: mutate by copying keys
        for (const key of Object.keys(newBuild as any)) {
          // biome-ignore lint/suspicious/noExplicitAny: need to mutate like this
          (built as any)[key] = (newBuild as any)[key];
        }
        return built;
      };
      context.build = newBuild;

      // biome-ignore lint/suspicious/noExplicitAny: wont be right type but the new build is there
      return context as any;
    },
    build: async () => {
      // biome-ignore lint/suspicious/noExplicitAny: its the same type
      return context as any;
    },
  };
  return context;
};

export const withHostname = adding((ctx) => ({
  host: ctx.ns.getHostname(),
}));

export const withPortAttacks = adding((ctx) => ({
  portAttacks: [
    { exe: "BruteSSH.exe", func: ctx.ns.brutessh },
    { exe: "FTPCrack.exe", func: ctx.ns.ftpcrack },
  ],
}));

export const withHackingLevel = adding((ctx) => ({
  hackingLevel: ctx.ns.getHackingLevel(),
}));
