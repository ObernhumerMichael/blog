{
  description = "Blog development environment";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-26.05";
  };

  outputs =
    { self, nixpkgs }:
    let
      system = "x86_64-linux";

      pkgs = import nixpkgs {
        inherit system;
      };

    in
    {
      devShells.${system}.default = pkgs.mkShell {

        packages = [
          pkgs.nodejs_24
          pkgs.pnpm
          pkgs.chromium
        ];

        shellHook = ''
          echo "🚀 Blog development environment"
          node --version
          export PLAYWRIGHT_CHROMIUM_EXECUTABLE="${pkgs.chromium}/bin/chromium"
        '';
      };
    };
}
