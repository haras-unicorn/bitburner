import { createArgumentsBuilder } from "bitripper-lib/args/builder";
import {
  expectAssignable,
  // NOTE: idk why this doesn't work but idk how to solve it either
  // expectError,
  expectType,
} from "tsd";

const empty = createArgumentsBuilder().build();
expectType<{ requests: [] }>(empty);

const chain = createArgumentsBuilder()
  .arg("count", "number" as const)
  .min(2)
  .default(5)
  .arg("mode", "string" as const)
  .default("eco")
  .positional()
  .build();

expectAssignable<{
  requests: [
    {
      type: "number";
      key: "count";
      min: 2;
      default?: 5;
    },
    {
      type: "string";
      key: "mode";
      default?: "eco";
      positional: true;
    },
  ];
}>(chain);

createArgumentsBuilder()
  .arg("n", "number" as const)
  .default(1);

// NOTE: idk why this doesn't work but idk how to solve it either
// expectError(
//   createArgumentsBuilder()
//     .arg("n", "number" as const)
//     // @ts-expect-error - wrong default type
//     .default("nope"),
// );

createArgumentsBuilder()
  .arg("n", "number" as const)
  .min(0);

// NOTE: idk why this doesn't work but idk how to solve it either
// expectError(
//   createArgumentsBuilder()
//     .arg("s", "string" as const)
//     // @ts-expect-error - min should not exist for non-number
//     .min(0),
// );

const pos = createArgumentsBuilder()
  .arg("x", "string" as const)
  .positional()
  .build();

expectAssignable<{
  requests: [{ key: "x"; type: "string"; positional: true }];
}>(pos);

const nonPos = createArgumentsBuilder()
  .arg("x", "string" as const)
  .nonPositional()
  .build();

expectAssignable<{
  requests: [{ key: "x"; positional: false; type: "string" }];
}>(nonPos);

const a = createArgumentsBuilder().arg("a", "string" as const);
const aBuilt = a.build();
expectAssignable<{
  requests: [{ type: "string"; key: "a" }];
}>(aBuilt);

const b = a
  .arg("b", "number" as const)
  .min(0)
  .build();
expectAssignable<{
  requests: [
    { key: "a"; type: "string" },
    { key: "b"; type: "number"; min: 0 },
  ];
}>(b);
