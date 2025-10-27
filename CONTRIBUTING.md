# Contributing to Bitripper

The project mainly uses web languages for source code and nix for environment
setup.

## Structure

Generated via `^eza --tree --git-ignore` and trimmed:

```text
├── biome.json
├── CHANGELOG.md
├── CRUSH.md
├── cspell.yaml
├── flake.lock
├── flake.nix
├── justfile
├── LICENSE.md
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
├── scripts
│   └── flake
│       ├── dev.nix
│       └── ...
├── src
│   ├── lib
│   │   ├── cspell.yaml
│   │   ├── package.json
│   │   ├── src
│   │   │   └── ...
│   │   └── tsconfig.json
│   └── scripts
│       ├── cspell.yaml
│       ├── package.json
│       ├── src
│       │   └── ...
│       └── tsconfig.json
└── tsconfig.json
```

## Tooling

Important tooling that is not language-specific:

- [just](https://github.com/casey/just) is used as a command runner
- [nushell](https://github.com/nushell/nushell) is used as a shell and for
  helper scripts
- [nix](https://github.com/NixOS/nixpkgs) is used for reproducible environments
- [crush](https://github.com/charmbracelet/crush) is used for AI-assisted coding
- [prettier](https://github.com/prettier/prettier) is used for formatting
  miscellaneous files
- [cspell](https://github.com/streetsidesoftware/cspell) is used for
  spell-checking
- [trufflehog](https://github.com/trufflesecurity/trufflehog) is used for
  checking for leaked secrets

Important tooling that is javascript-specific:

- [nodejs](https://github.com/nodejs/node) version 24 is used as the runtime
- [pnpm](https://github.com/pnpm/pnpm) version 9 is used as the package manager
- [biome](https://github.com/biomejs/biome) is used to format, lint and provide
  LSP functionality for javascript-related files
- [typescript](https://github.com/microsoft/TypeScript) is used for
  type-checking and LSP functionality
- [tsx](https://github.com/privatenumber/tsx) is used as a REPL

## Libraries

Important libraries that are javascript-specific:

- [NetscriptDefinitions.d.ts](https://github.com/bitburner-official/bitburner-src/blob/v2.8.1/src/ScriptEditor/NetscriptDefinitions.d.ts)
  types that were copied over to the repo because an official package doesn't
  exist
- [bitburner-filesync](https://github.com/bitburner-official/bitburner-filesync)
  official remote API server
