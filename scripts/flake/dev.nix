{ self, pkgs, ... }:

{
  seal.defaults.devShell = "dev";
  integrate.devShell.nixpkgs.config.allowUnfree = true;
  integrate.devShell.devShell = pkgs.mkShell {
    inputsFrom = [
      (self.lib.javascript.mkDevShell pkgs)
    ];

    packages = with pkgs; [
      git
      just
      nushell
      nil
      nixfmt-rfc-style
      marksman
      markdownlint-cli
      nodePackages.markdown-link-check
      fd
      nodePackages.prettier
      nodePackages.yaml-language-server
      nodePackages.vscode-langservers-extracted
      taplo
      nodePackages.cspell
      mdbook
    ];
  };
}
