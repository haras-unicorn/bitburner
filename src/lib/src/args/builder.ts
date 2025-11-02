import type { Append } from "bitripper-lib/type";
import type {
  ArgumentKind,
  ArgumentKindToType,
  ArgumentParseRequest,
  ArgumentsParseRequest,
} from "./parser";

export function createArgumentsBuilder(): ArgumentsBuilder<{ requests: [] }> {
  return new ArgumentsBuilder({
    requests: [],
  });
}

class ArgumentsBuilder<R extends ArgumentsParseRequest> {
  request: R;

  constructor(request: R) {
    this.request = request;
  }

  arg<K extends string, T extends ArgumentKind>(
    key: K,
    type: T,
  ): ConcreteArgumentBuilder<R, { key: K; type: T }> {
    return createArgumentBuilder(this, { key, type });
  }

  build(): R {
    return this.request;
  }
}

type ConcreteArgumentBuilder<
  R extends ArgumentsParseRequest,
  T extends ArgumentParseRequest,
> = T extends ArgumentParseRequest<"number">
  ? NumberArgumentBuilder<R, T>
  : ArgumentBuilder<R, T>;

function createArgumentBuilder<
  R extends ArgumentsParseRequest,
  T extends ArgumentParseRequest,
>(args: ArgumentsBuilder<R>, request: T): ConcreteArgumentBuilder<R, T> {
  if (request.type === "number") {
    return new NumberArgumentBuilder(
      args,
      request as ArgumentParseRequest<"number">,
    ) as ConcreteArgumentBuilder<R, T>;
  } else {
    return new ArgumentBuilder(args, request) as ConcreteArgumentBuilder<R, T>;
  }
}

class ArgumentBuilder<
  R extends ArgumentsParseRequest,
  T extends ArgumentParseRequest,
> {
  args: ArgumentsBuilder<R>;
  request: T;

  constructor(args: ArgumentsBuilder<R>, request: T) {
    this.args = args;
    this.request = request;
  }

  arg<K extends string, A extends ArgumentKind>(
    key: K,
    type: A,
  ): ConcreteArgumentBuilder<AppendRequest<R, T>, { key: K; type: A }> {
    const argsBuilder = new ArgumentsBuilder<AppendRequest<R, T>>({
      ...this.args.request,
      requests: [...this.args.request.requests, this.request] as Append<
        R["requests"],
        T
      >,
    });
    return createArgumentBuilder(argsBuilder, { key, type });
  }

  default<V extends ArgumentKindToType<T["type"]>>(
    value?: V,
  ): ConcreteArgumentBuilder<
    R,
    V extends undefined ? Omit<T, "default"> : T & { default: V }
  > {
    let request = { ...this.request };
    if (value === undefined) {
      if (request.default !== undefined) {
        delete request.default;
      }
    } else {
      request = { ...request, default: value };
    }

    return createArgumentBuilder(
      this.args,
      request as V extends undefined ? Omit<T, "default"> : T & { default: V },
    );
  }

  positional(): ConcreteArgumentBuilder<R, T & { positional: true }> {
    return createArgumentBuilder(this.args, {
      ...this.request,
      positional: true,
    });
  }

  nonPositional(): ConcreteArgumentBuilder<R, T & { positional: false }> {
    return createArgumentBuilder(this.args, {
      ...this.request,
      positional: false,
    });
  }

  description<D extends string>(
    description: D,
  ): ConcreteArgumentBuilder<R, T & { description: D }> {
    return createArgumentBuilder(this.args, {
      ...this.request,
      description,
    });
  }

  build(): Build<R, T> {
    return {
      ...this.args.request,
      requests: [...this.args.request.requests, this.request] as Append<
        R["requests"],
        T
      >,
    };
  }
}

class NumberArgumentBuilder<
  R extends ArgumentsParseRequest,
  T extends ArgumentParseRequest<"number">,
> extends ArgumentBuilder<R, T> {
  min<M extends number>(min: M): ConcreteArgumentBuilder<R, T & { min: M }> {
    return createArgumentBuilder(this.args, { ...this.request, min });
  }
  max<M extends number>(max: M): ConcreteArgumentBuilder<R, T & { max: M }> {
    return createArgumentBuilder(this.args, { ...this.request, max });
  }
}

type AppendRequest<
  R extends ArgumentsParseRequest,
  T extends ArgumentParseRequest,
> = Omit<R, "requests"> & { requests: Append<R["requests"], T> };

type Build<R extends ArgumentsParseRequest, T extends ArgumentParseRequest> = {
  [K in keyof Omit<R, "requests">]: R[K];
} & {
  requests: Append<R["requests"], T>;
};
