import type { NS } from "./ns";

type DecorableBase = { ns: NS };

// NOTE: has to be exported because it is a symbol
export const DecorationTypeSymbol = Symbol();

type Functor<T> = <C extends DecorableBase>(ctx: C) => T;

type DecoratorFunction<T> = <C extends DecorableBase>(ctx: C) => C & T;

// NOTE: has to be exported because it is a symbol
export type Decorator<T> = DecoratorFunction<T> & {
  [DecorationTypeSymbol]?: T;
};

type Decorate<C extends DecorableBase> = <R, D extends Decorator<R>>(
  decorator: D,
) => Decorable<C & D[typeof DecorationTypeSymbol]>;

type Decorable<T = object> = T &
  DecorableBase & { decorate: Decorate<T & DecorableBase> };

export const decorable = <T extends DecorableBase>(
  initial: T,
): Decorable<T> => {
  const decorable: Decorable<T> = {
    ...initial,
    decorate: (decorator) => decorator(decorable),
  };
  return decorable;
};

export const adding =
  <T>(decorator: Functor<T>): Decorator<T> =>
  (ctx) =>
    decorable({ ...ctx, ...decorator(ctx) });
