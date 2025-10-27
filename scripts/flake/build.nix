{ self, pkgs, ... }:

{
  integrate.devShell.nixpkgs.config.allowUnfree = true;
  integrate.devShell.devShell = pkgs.mkShell {
    inputsFrom = [
      (self.lib.javascript.mkDevShell pkgs)
    ];
  };
}
