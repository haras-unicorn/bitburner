import type { ContextBase } from "bitripper-lib/ctxs";

// NOTE: has to be exported because it is a symbol
export const DecorationTypeSymbol = Symbol();

type DecoratorFunction<T extends object> = <C extends ContextBase>(ctx: C) => T;

// NOTE: has to be exported because it is a symbol
export type Decorator<T extends object> = DecoratorFunction<T> & {
  [DecorationTypeSymbol]?: T;
};

export const adding =
  <T extends object>(decorator: DecoratorFunction<T>): Decorator<T> =>
  (ctx) =>
    decorator(ctx);
