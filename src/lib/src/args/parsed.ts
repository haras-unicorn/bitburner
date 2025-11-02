import { createArgumentsBuilder } from "bitripper-lib/args/builder";
import {
  type ArgumentsParseRequest,
  type ArgumentsParseResult,
  parseArguments,
} from "bitripper-lib/args/parser";
import { adding } from "bitripper-lib/decor";
import { createArgumentsHelp } from "./helper";

export const withArgs = <
  C extends (
    builder: ReturnType<typeof createArgumentsBuilder>,
  ) => ArgumentsParseRequest,
>(
  name: string,
  config: C,
) =>
  adding((ctx): ArgumentsParseResult<ReturnType<C>> => {
    const request = config(createArgumentsBuilder());
    try {
      return parseArguments(
        ctx.ns.args.map((x) => x.toString()),
        request,
      );
    } catch (error: unknown) {
      const help = createArgumentsHelp(name, request);
      const hasMessage = (error: unknown): error is { message: string } =>
        error != null &&
        typeof error === "object" &&
        "message" in error &&
        error.message !== undefined;
      ctx.ns.tprint(
        hasMessage(error) ? `Error: ${error.message}\n\n${help}` : help,
      );
      throw error;
    }
  });
