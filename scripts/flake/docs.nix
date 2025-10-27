{ pkgs, ... }:

{
  integrate.devShell.nixpkgs.config.allowUnfree = true;
  integrate.devShell.devShell = pkgs.mkShell {
    packages = with pkgs; [
      git
      just
      nushell
      mdbook
    ];
  };
}
