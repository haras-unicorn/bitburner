set windows-shell := ["nu.exe", "-c"]
set shell := ["nu", "-c"]

root := absolute_path('')

default:
    @just --choose

format:
    cd '{{ root }}'; just --unstable --fmt
    nixfmt ...(fd '.*.nix$' '{{ root }}' | lines)
    prettier --write '{{ root }}'
    biome check --write '{{ root }}'

lint:
    cd '{{ root }}'; just --unstable --fmt --check
    nixfmt --check ...(fd '.*.nix$' '{{ root }}' | lines)
    prettier --check '{{ root }}'
    cspell lint '{{ root }}' --no-progress
    markdownlint --ignore-path .gitignore '{{ root }}'
    if (markdown-link-check \
      --config '{{ root }}/.markdown-link-check.json' \
      ...(fd '^.*.md$' '{{ root }}' | lines) \
      | rg -q error \
      | complete \
      | get exit_code) == 0 { exit 1 }
    biome lint '{{ root }}'
    cd '{{ root }}'; tsc --noEmit

start:
    concurrently \
      --names tsup,bitburner-filesync,bitburner \
      `nu -c "cd '{{ root }}/src/scripts'; exec tsup --watch"` \
      `nu -c "mkdir cd '{{ root }}/src/scripts/dist'; cd '{{ root }}/src/scripts/dist'; exec bitburner-filesync"` \
      `nu -c "steam-run ~/.steam/steam/steamapps/common/Bitburner/bitburner"`
