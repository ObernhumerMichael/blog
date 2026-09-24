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
          pkgs.lychee
        ];

        # Pinned font set so fallback glyphs (fonts.css's local() faces,
        # system-ui, anything the webfonts don't cover) render identically on
        # a NixOS laptop and the Ubuntu CI runner — visual.spec.ts baselines
        # are only reproducible if both sides resolve the same system fonts.
        FONTCONFIG_FILE = pkgs.makeFontsConf {
          fontDirectories = [
            pkgs.liberation_ttf
            pkgs.dejavu_fonts
            pkgs.noto-fonts-color-emoji
          ];
        };

        shellHook = ''
          echo "🚀 Blog development environment"
          node --version
          export PLAYWRIGHT_CHROMIUM_EXECUTABLE="${pkgs.chromium}/bin/chromium"
        '';
      };
    };
}
