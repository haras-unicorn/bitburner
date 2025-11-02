export type UnionToIntersection<U> = (
  U extends unknown
    ? (x: U) => void
    : never
) extends (x: infer I) => void
  ? I
  : never;

export type ArrayType<A extends readonly unknown[]> =
  A extends readonly (infer T)[] ? T : never;

export type Head<A extends readonly unknown[]> = A extends readonly [
  infer T,
  ...(readonly unknown[]),
]
  ? T
  : never;

export type Tail<A extends readonly unknown[]> = A extends readonly [
  unknown,
  ...infer T extends readonly unknown[],
]
  ? T
  : never;

export type Append<A extends readonly unknown[], T> = A extends []
  ? [T]
  : [...A, T];

export type Split<S extends string, D extends string> = string extends S
  ? string[]
  : S extends ""
    ? []
    : S extends `${infer T}${D}${infer U}`
      ? [T, ...Split<U, D>]
      : [S];

export type Join<T extends PropertyKey[], D extends string> = T extends []
  ? ""
  : T extends [infer Head, ...infer Tail]
    ? Head extends string
      ? `${Head}${D}${Join<Tail extends string[] ? Tail : [], D>}`
      : never
    : never;
