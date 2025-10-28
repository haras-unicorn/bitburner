import type { ContextBase } from "bitripper-lib/ctxs";

// NOTE: has to be exported because it is a symbol
export const BuildTypeSymbol = Symbol();

type BuildFunction<T> = <C extends ContextBase>(ctx: C) => PromiseLike<T>;

// NOTE: has to be exported because it is a symbol
export type Builder<T> = BuildFunction<T> & {
  [BuildTypeSymbol]?: T;
};

export type Design<C extends ContextBase> = <R, B extends Builder<R>>(
  builder: B,
) => C & B[typeof BuildTypeSymbol];

export type Build<T extends ContextBase> = () => PromiseLike<T>;

export const building =
  <T>(builder: BuildFunction<T>): Builder<T> =>
  async (initial) =>
    await builder(initial);
