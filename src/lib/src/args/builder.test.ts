import { describe, expect, it } from "vitest";
import { createArgumentsBuilder } from "./builder";

describe("ArgumentsBuilder", () => {
  it("builds an empty list by default", () => {
    const b = createArgumentsBuilder();
    expect(b.build()).toEqual({ requests: [] });
  });

  it("adds a non-number arg and chains", () => {
    const b = createArgumentsBuilder()
      .arg("name", "string") // runtime test, no types enforced here
      .default("default")
      .positional()
      .arg("verbose", "boolean")
      .description("verbose")
      .nonPositional();

    const built = b.build();
    expect(built).toEqual({
      requests: [
        { key: "name", type: "string", default: "default", positional: true },
        {
          key: "verbose",
          type: "boolean",
          positional: false,
          description: "verbose",
        },
      ],
    });
  });

  it("creates number arg builder when type is number and sets min", () => {
    const b = createArgumentsBuilder().arg("count", "number").min(2).default(5);

    const built = b.build();
    expect(built).toEqual({
      requests: [{ key: "count", type: "number", min: 2, default: 5 }],
    });
  });

  it("supports chaining multiple number and non-number args", () => {
    const b = createArgumentsBuilder()
      .arg("count", "number")
      .min(1)
      .default(3)
      .nonPositional()
      .arg("mode", "string")
      .default("eco")
      .positional()
      .arg("dryRun", "boolean");

    const built = b.build();
    expect(built).toEqual({
      requests: [
        { key: "count", type: "number", min: 1, default: 3, positional: false },
        { key: "mode", type: "string", default: "eco", positional: true },
        { key: "dryRun", type: "boolean" },
      ],
    });
  });

  it("does not mutate previous builders when chaining", () => {
    const base = createArgumentsBuilder();
    const a = base.arg("a", "string");
    const b = a.arg("b", "number").min(0);

    expect(base.build()).toEqual({ requests: [] });
    expect(a.build()).toEqual({ requests: [{ key: "a", type: "string" }] });
    expect(b.build()).toEqual({
      requests: [
        { key: "a", type: "string" },
        { key: "b", type: "number", min: 0 },
      ],
    });
  });
});
