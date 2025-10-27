{ self, pkgs, ... }:

{
  integrate.devShell.nixpkgs.config.allowUnfree = true;
  integrate.devShell.devShell = pkgs.mkShell {
    inputsFrom = [
      (self.lib.javascript.mkDevShell pkgs)
    ];
    packages = with pkgs; [
      git
      just
      nushell
      nixpkgs-fmt
      markdownlint-cli
      nodePackages.markdown-link-check
      fd
      nodePackages.prettier
      nodePackages.cspell
    ];
  };
}
