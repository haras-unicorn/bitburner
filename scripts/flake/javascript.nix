{ root, lib, ... }:

let
  mkNodeLib = pkgs: rec {
    node = pkgs.nodejs_24;
    pnpm = pkgs.pnpm_9;

    pnpmDeps = pnpm.fetchDeps {
      pname = "bitripper";
      version = "0.1.0";
      src = root;
      fetcherVersion = 2;
      hash = builtins.replaceStrings [ "\n" ] [ "" ] (builtins.readFile ./javascript-deps-hash.txt);
    };

    nodeModules = pkgs.stdenv.mkDerivation {
      inherit pnpmDeps;

      pname = "bitripper-node-modules";
      version = "0.1.0";
      src = root;

      nativeBuildInputs = [
        pkgs.autoPatchelfHook
        pkgs.jq
        pnpm.configHook
        pnpm
        node
      ];

      buildInputs = [
        pkgs.stdenv.cc.cc.lib
      ];

      buildPhase = ''
        pnpm install --offline --frozen-lockfile
      '';

      installPhase = ''
        mkdir -p $out/lib
        mkdir -p $out/bin

        pnpm ls -r --depth -1 --json > pkgs.json

        jq -r '.[].path' pkgs.json | while read -r path; do
          rel="''${path#$PWD}"
          mkdir -p "$out/lib/$rel"
          cp -R "$path/node_modules" "$out/lib/$rel"

          for f in $out/lib/$rel/node_modules/.bin/*; do
            [ -e "$f" ] || continue
            name=$(basename "$f")
            cat > $out/bin/$name <<EOF
        #!/usr/bin/env bash
        export NODE_PATH="$out/lib/$rel/node_modules"
        exec "$f" "\$@"
        EOF
            chmod +x $out/bin/$name
          done
        done

        jq \
          --arg root "$PWD" \
          'map(.path |= ltrimstr($root))' \
          pkgs.json > $out/pkgs.json
      '';
    };

    nodeModuleSymlinks = pkgs.writeShellApplication {
      name = "node-module-symlinks";
      runtimeInputs = [ pkgs.jq ];
      text = ''
        root=$(git rev-parse --show-toplevel)
        jq -r '.[].path' '${nodeModules}/pkgs.json' \
          | while read -r path; do
          src="${nodeModules}/lib$path/node_modules"
          dest="$root$path/node_modules"
          rm -fr "$dest"
          ln -s "$src" "$dest"
        done
      '';
    };

    packages = {
      bitripper-lib = pkgs.stdenv.mkDerivation {
        inherit pnpmDeps;

        pname = "bitripper-lib";
        version = "0.1.0";
        src = root;

        nativeBuildInputs = [
          pnpm.configHook
          node
        ];

        meta = {
          description = "My Bitburner playground library";
          homepage = "https://github.com/haras-unicorn/bitripper";
          license = lib.licenses.mit;
        };
      };
      bitripper-scripts = pkgs.stdenv.mkDerivation {
        inherit pnpmDeps;

        pname = "bitripper-scripts";
        version = "0.1.0";
        src = root;

        nativeBuildInputs = [
          pnpm.configHook
          node
        ];

        meta = {
          description = "My Bitburner playground scripts";
          homepage = "https://github.com/haras-unicorn/bitripper";
          license = lib.licenses.mit;
        };
      };
    };

    shellHook = ''
      ${nodeModuleSymlinks}/bin/node-module-symlinks
    '';

    pnpmDirenv = pkgs.writeShellApplication {
      name = "pnpm-direnv";
      runtimeInputs = [
        pnpm
        pkgs.direnv
        pkgs.jq
        pkgs.git
      ];
      text = ''
        root=$(git rev-parse --show-toplevel)
        jq -r '.[].path' '${nodeModules}/pkgs.json' \
          | while read -r path; do
          dest="$root$path/node_modules"
          rm -fr "$dest"
        done
        echo "" > "$root/scripts/flake/javascript-deps-hash.txt"
        pnpm "$@"
        direnv reload .
      '';
    };
  };
in
{
  flake.lib.javascript.mkDevShell =
    pkgs:
    let
      nodeLib = mkNodeLib pkgs;

      shellHook = nodeLib.shellHook;
    in
    pkgs.mkShell {
      inherit shellHook;

      packages = [
        nodeLib.nodeModules
        nodeLib.node
        nodeLib.pnpmDirenv
        nodeLib.pnpm
      ];
    };

  flake.lib.javascript.mkPackage =
    pkgs: package:
    let
      nodeLib = mkNodeLib pkgs;
    in
    nodeLib.packages.${package};
}
