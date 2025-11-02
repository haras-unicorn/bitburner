import type {
  ArgumentParseRequest,
  ArgumentsParseRequest,
} from "bitripper-lib/args/parser";

export function createArgumentsHelp(
  name: string,
  request: ArgumentsParseRequest,
): string {
  const requests = request.requests as ArgumentParseRequest[];

  const positionals = requests
    .filter((x) => x.positional)
    .reduce(
      (acc, next) =>
        `${acc} ${next.default === undefined ? `<${next.key}>` : `[${next.key}]`}`,
      "",
    )
    .trim();

  const args = requests.filter((x) => !!x.positional).map(createArgumentHelp);
  const options = requests.filter((x) => !x.positional).map(createArgumentHelp);

  const argsBlock = args.length ? args.map((l) => `  ${l}`).join("\n") : "";
  const optionsBlock = options.length
    ? options.map((l) => `  ${l}`).join("\n")
    : "";

  return [
    `Usage: ${name} ${positionals} [OPTIONS]`,
    "",
    "Arguments:",
    ...(argsBlock === "" ? [] : [argsBlock]),
    "",
    "Options:",
    ...(optionsBlock === "" ? [] : [optionsBlock]),
  ]
    .join("\n")
    .trim();
}

function createArgumentHelp(request: ArgumentParseRequest) {
  const description =
    request.description === undefined ? "" : ` ${request.description}`;
  const defult = request.default === undefined ? "" : ` (${request.default})`;
  const key = request.positional
    ? request.default === undefined
      ? `<${request.key}>`
      : `[${request.key}]`
    : `--${request.key}`;
  return `${key}:${request.type}${description}${defult}`;
}
