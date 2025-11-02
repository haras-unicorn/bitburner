import { describe, expect, it } from "vitest";
import { parseArguments } from "./parser";

describe("argument parser", () => {
  it("parses --key value pairs and returns all values", () => {
    const res = parseArguments(["--foo", "a", "--bar", "1", "--baz", "true"], {
      requests: [
        { key: "foo", type: "string" },
        { key: "bar", type: "number" },
        { key: "baz", type: "boolean" },
        { key: "kar", type: "string", default: "default" },
      ],
    } as const);
    expect(res).toEqual({ foo: "a", bar: 1, baz: true, kar: "default" });
  });

  it("parses positionals and returns all values", () => {
    const res = parseArguments(["a", "1", "true"], {
      requests: [
        { key: "foo", type: "string", positional: true },
        { key: "bar", type: "number", positional: true },
        { key: "baz", type: "boolean", positional: true },
        { key: "kar", type: "string", positional: true, default: "default" },
      ],
    } as const);
    expect(res).toEqual({ foo: "a", bar: 1, baz: true, kar: "default" });
  });

  it("parses mixed and returns all values", () => {
    const res = parseArguments(["a", "--kar", "1", "--bar", "1", "true"], {
      requests: [
        { key: "foo", type: "string", positional: true },
        { key: "bar", type: "number" },
        { key: "baz", type: "boolean", positional: true },
        { key: "kar", type: "number" },
        { key: "dar", type: "number", default: 10, positional: true },
      ],
    } as const);
    expect(res).toEqual({ foo: "a", bar: 1, kar: 1, baz: true, dar: 10 });
  });

  it("throws on duplicate arguments", () => {
    expect(() =>
      parseArguments(["--foo", "a"], {
        requests: [
          { key: "foo", type: "string" },
          { key: "foo", type: "number" },
        ],
      } as const),
    ).toThrowError(/duplicate argument/);
  });

  it("throws number above max", () => {
    expect(() =>
      parseArguments(["--foo", "100"], {
        requests: [{ key: "foo", type: "number", max: 10 }],
      } as const),
    ).toThrowError(/is above max/);
  });

  it("throws number below min", () => {
    expect(() =>
      parseArguments(["--foo", "100"], {
        requests: [{ key: "foo", type: "number", min: 1000 }],
      } as const),
    ).toThrowError(/is below min/);
  });

  it("throws when arg is expected to be positional", () => {
    expect(() =>
      parseArguments(["positional", "--foo", "a"], {
        requests: [{ key: "foo", type: "string", positional: true }],
      } as const),
    ).toThrowError(/is positional - expected at place/);
  });

  it("throws when too many positional", () => {
    expect(() =>
      parseArguments(["positional", "--foo", "a"], {
        requests: [{ key: "foo", type: "string" }],
      } as const),
    ).toThrowError(/too many positional/);
  });

  it("throws on unknown flag", () => {
    expect(() =>
      parseArguments(["--nope", "x"], {
        requests: [{ key: "foo", type: "string" }],
      } as const),
    ).toThrowError(/not found in arguments/);
  });

  it("throws on missing value for a flag", () => {
    expect(() =>
      parseArguments(["--foo"], {
        requests: [
          { key: "foo", type: "string" },
          { key: "bar", type: "string", default: "default" },
        ],
      } as const),
    ).toThrowError(/missing value/);

    expect(() =>
      parseArguments(["--foo", "--bar", "x"], {
        requests: [
          { key: "foo", type: "string" },
          { key: "bar", type: "number" },
          { key: "kar", type: "string", default: "default" },
        ],
      } as const),
    ).toThrowError(/missing value/);
  });

  it("throws when some required args are missing", () => {
    expect(() =>
      parseArguments(["--foo", "a"], {
        requests: [
          { key: "foo", type: "string" },
          { key: "bar", type: "number" },
          { key: "kar", type: "number", positional: true },
          { key: "dar", type: "string", default: "default" },
        ],
      } as const),
    ).toThrowError(/missing args: bar/);
  });
});
