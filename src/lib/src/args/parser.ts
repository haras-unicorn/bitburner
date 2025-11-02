import type {
  ArrayType,
  Head,
  Tail,
  UnionToIntersection,
} from "bitripper-lib/type";

export type ArgumentKind = "string" | "number" | "boolean";

export type ArgumentType = string | number | boolean;

export type ArgumentKindToType<T extends ArgumentKind> = T extends "string"
  ? string
  : T extends "number"
    ? number
    : T extends "boolean"
      ? boolean
      : never;

export type ArgumentKindExtra<T extends ArgumentKind> = T extends "number"
  ? {
      min?: number;
      max?: number;
    }
  : // biome-ignore lint/complexity/noBannedTypes: literally need this
    {};

export type ArgumentsParseRequest<
  R extends ArgumentParseRequest[] = ArgumentParseRequest[],
> = {
  requests: R;
};

export type ArgumentParseRequest<T extends ArgumentKind = ArgumentKind> = {
  key: string;
  type: T;
  positional?: boolean;
  description?: string;
  default?: ArgumentKindToType<T>;
} & ArgumentKindExtra<T>;

export type ArgumentRequestToResult<TRequest extends ArgumentParseRequest> = {
  [k in TRequest["key"]]: ArgumentKindToType<TRequest["type"]>;
};

export type ArgumentRequestsToResult<
  TRequests extends readonly ArgumentParseRequest[],
> = Tail<TRequests> extends []
  ? // @ts-expect-error
    [ArgumentRequestToResult<Head<TRequests>>]
  : [
      // @ts-expect-error
      ArgumentRequestToResult<Head<TRequests>>,
      // @ts-expect-error
      ...ArgumentRequestsToResult<Tail<TRequests>>,
    ];

export type ArgumentsParseResult<TRequest extends ArgumentsParseRequest> = {
  args: UnionToIntersection<
    ArrayType<ArgumentRequestsToResult<TRequest["requests"]>>
  >;
};

export function parseArguments<
  const TRequest extends ArgumentsParseRequest<ArgumentParseRequest[]>,
>(args: string[], request: TRequest): ArgumentsParseResult<TRequest> {
  const requests = request.requests as ArgumentParseRequest[];
  const keys = requests.map((x) => x.key);
  const types = requests.map((x) => x.type);
  const positionalRequests = requests.filter((x) => x.positional);
  const positionalKeys = positionalRequests.map((x) => x.key);
  const positionalTypes = requests
    .filter((x) => x.positional)
    .map((x) => x.type);

  const sortedKeys = [...keys].sort();
  for (let i = 1; i < sortedKeys.length; i++) {
    if (sortedKeys[i] === sortedKeys[i - 1]) {
      throw new Error(`duplicate argument ${sortedKeys[i]}`);
    }
  }

  const result = {} as UnionToIntersection<
    ArrayType<ArgumentRequestsToResult<TRequest["requests"]>>
  >;

  let positionalIndex = 0;
  for (let i = 0; i < args.length; i++) {
    const token = args[i];

    if (token.startsWith("--")) {
      const key = token.slice(2);
      const pi = positionalKeys.indexOf(key);
      if (pi !== -1) {
        throw new Error(
          `flag "${token}" is positional - expected at place ${pi + 1}`,
        );
      }

      const ki = keys.indexOf(key);
      if (ki === -1) {
        throw new Error(`flag "${token}" not found in arguments`);
      }

      const type = types[ki];

      const value = args[i + 1];
      const hasValue = value !== undefined && !value.startsWith("-");
      if (!hasValue && type !== "boolean") {
        throw new Error(`missing value for flag "${token}"`);
      }

      lintValue(requests[ki], value);

      applyKeyTypeValue(result, key, type, value);

      if (hasValue) {
        i++;
      }
    } else {
      if (positionalIndex >= positionalKeys.length) {
        throw new Error(
          `too many positional arguments - expected ${positionalKeys.length}`,
        );
      }

      const request = positionalRequests[positionalIndex];

      const key = positionalKeys[positionalIndex];

      const type = positionalTypes[positionalIndex];

      const value = token;

      lintValue(request, value);

      applyKeyTypeValue(result, key, type, value);

      positionalIndex++;
    }
  }

  const resultKeys = Object.keys(result as object);
  const missingRequests = requests.filter(
    ({ key }) => resultKeys.indexOf(key) === -1,
  );
  const missingRequestsWithDefault = missingRequests.filter(
    (missing) => missing.default != null && missing.default !== undefined,
  );
  if (missingRequests.length !== missingRequestsWithDefault.length) {
    const missingKeys = missingRequests
      .filter(
        (missing) => missing.default === undefined || missing.default == null,
      )
      .map((missing) => missing.key);
    throw new Error(`missing args: ${missingKeys}`);
  }

  for (const missingRequestWithDefault of missingRequestsWithDefault) {
    const key = missingRequestWithDefault.key;
    const type = missingRequestWithDefault.type;
    // biome-ignore lint/style/noNonNullAssertion: fileterd prior to this
    const value = missingRequestWithDefault.default!;
    applyKeyTypeValue(result, key, type, value);
  }

  return { args: result };
}

function lintValue(request: ArgumentParseRequest, value: string) {
  const isNumberRequest = (
    request: ArgumentParseRequest,
  ): request is ArgumentParseRequest<"number"> => request.type === "number";
  if (
    isNumberRequest(request) &&
    request.max !== undefined &&
    Number(value) > request.max
  ) {
    throw new Error(
      `value ${value} for ${request.key} is above max ${request.max}`,
    );
  }

  if (
    isNumberRequest(request) &&
    request.min !== undefined &&
    Number(value) < request.min
  ) {
    throw new Error(
      `value ${value} for ${request.key} is below min ${request.min}`,
    );
  }
}

function applyKeyTypeValue(
  // biome-ignore lint/suspicious/noExplicitAny: gotta apply it somehow
  record: any,
  key: string,
  type: ArgumentKind,
  value: ArgumentType,
) {
  record[key] =
    type === "number"
      ? Number(value)
      : type === "boolean"
        ? value === undefined ||
          (typeof value === "string" && value.startsWith("-"))
          ? true
          : Boolean(value)
        : value;
}
