import { expectAssignable } from "tsd";
import { parseArguments } from "./parser";

{
  const res = parseArguments([], {
    requests: [
      { key: "foo", type: "number" },
      { key: "bar", type: "string" },
      { key: "baz", type: "boolean" },
      { key: "kar", type: "string", default: "default" },
    ],
  } as const);
  expectAssignable<{
    foo: number;
    bar: string;
    baz: boolean;
    kar: string;
  }>(res);
}
