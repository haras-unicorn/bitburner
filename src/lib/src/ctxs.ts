import type { Builder, BuildTypeSymbol } from "bitripper-lib/build";
import {
  adding,
  type DecorationTypeSymbol,
  type Decorator,
} from "bitripper-lib/decor";
import type { NS } from "bitripper-ns/ns";

export type ContextBase = { ns: NS };

export type SyncContext<T extends object> = ContextBase &
  T & {
    decorate: <R extends object, D extends Decorator<R>>(
      decorator: D,
    ) => SyncContext<T & D[typeof DecorationTypeSymbol]>;
    design: <R, B extends Builder<R>>(
      builder: B,
    ) => AsyncContext<T, NonNullable<B[typeof BuildTypeSymbol]>>;
  };

export type AsyncContext<T extends object, O extends object> = ContextBase &
  T & {
    decorate: <R extends object, D extends Decorator<R>>(
      decorator: D,
    ) => AsyncContext<T & D[typeof DecorationTypeSymbol], O>;
    design: <R, B extends Builder<R>>(
      builder: B,
    ) => AsyncContext<T, O & B[typeof BuildTypeSymbol]>;
    build: () => PromiseLike<T & O>;
  };

export type Context<T extends object, O extends object = object> = ContextBase &
  T &
  (never extends keyof O ? SyncContext<T> : AsyncContext<T, O>);

export const createContext = (ns: NS): Context<{ ns: NS }> => {
  const lift = <T extends object, O extends object, C extends Context<T, O>>(
    initial: C,
  ): C => {
    const context = {
      ...initial,
      decorate: <R extends object, D extends Decorator<R>>(
        decorator: D,
      ): Context<T & D[typeof DecorationTypeSymbol], O> => {
        const data = { ...context };
        // @ts-expect-error
        delete data.decorate;
        // @ts-expect-error
        delete data.design;
        // @ts-expect-error
        delete data.build;
        const decoration = decorator(data);
        return lift({ ...data, ...decoration });
      },
      design: <R, B extends Builder<R>>(
        builder: B,
      ): Context<T, O & B[typeof BuildTypeSymbol]> => {
        let lastBuild: undefined | AsyncContext<T, object>["build"];
        if ("build" in context) {
          lastBuild = context.build as AsyncContext<T, object>["build"];
        }
        const newBuild = async () => {
          const data = { ...context };
          // @ts-expect-error
          delete data.decorate;
          // @ts-expect-error
          delete data.design;
          // @ts-expect-error
          delete data.build;
          const newBuild = lastBuild
            ? await builder({ ...data, ...(await lastBuild()) })
            : await builder(data);
          return { ...data, ...newBuild };
        };
        return lift({ ...context, build: newBuild });
      },
    };
    return context;
  };

  return lift({
    ns,
    // biome-ignore lint/style/noNonNullAssertion: it gets set in lift
    decorate: null!,
    // biome-ignore lint/style/noNonNullAssertion: it gets set in lift
    design: null!,
  });
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
