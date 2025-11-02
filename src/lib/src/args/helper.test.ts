import type { ArgumentsParseRequest } from "bitripper-lib/args/parser";
import { describe, expect, it } from "vitest";
import { createArgumentsHelp } from "./helper";

describe("createArgumentsHelp", () => {
  it("renders mixed positionals and options nicely", () => {
    const req: ArgumentsParseRequest = {
      requests: [
        {
          key: "input",
          type: "string",
          positional: true,
          description: "Input file",
        },
        {
          key: "count",
          type: "number",
          positional: true,
          default: 1,
          description: "How many times",
        },
        {
          key: "verbose",
          type: "boolean",
          positional: false,
          description: "Verbose mode",
        },
        {
          key: "format",
          type: "string",
          positional: false,
          default: "json",
          description: "Output format",
        },
      ],
    };

    const out = createArgumentsHelp("cooltool", req);

    expect(out).toBe(
      `
Usage: cooltool <input> [count] [OPTIONS]

Arguments:
  <input>:string Input file
  [count]:number How many times (1)

Options:
  --verbose:boolean Verbose mode
  --format:string Output format (json)
`.trim(),
    );
  });

  it("renders only positionals", () => {
    const req: ArgumentsParseRequest = {
      requests: [
        { key: "src", type: "string", positional: true },
        {
          key: "dst",
          type: "string",
          positional: true,
          description: "Destination",
        },
      ],
    };

    const out = createArgumentsHelp("mvish", req);

    expect(out).toBe(
      `
Usage: mvish <src> <dst> [OPTIONS]

Arguments:
  <src>:string
  <dst>:string Destination

Options:
`.trim(),
    );
  });

  it("renders only options", () => {
    const req: ArgumentsParseRequest = {
      requests: [
        {
          key: "dry-run",
          type: "boolean",
          positional: false,
          description: "Do not write changes",
        },
        { key: "retries", type: "number", positional: false, default: 3 },
      ],
    };

    const out = createArgumentsHelp("commitish", req);

    expect(out).toBe(
      `
Usage: commitish  [OPTIONS]

Arguments:

Options:
  --dry-run:boolean Do not write changes
  --retries:number (3)
`.trim(),
    );
  });

  it("handles empty request list", () => {
    const req: ArgumentsParseRequest = { requests: [] };

    const out = createArgumentsHelp("empty", req);

    expect(out).toBe(
      `
Usage: empty  [OPTIONS]

Arguments:

Options:
`.trim(),
    );
  });
});
