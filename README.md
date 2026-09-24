# Blog

Personal technical blog — Astro static site, built to the Ledger design system
(`DESIGN_SYSTEM.md`) per the plan in `IMPLEMENTATION_PLAN.md`. Live at
<https://obernhumer.com>; every push to `main` that passes CI deploys
(ADR-0029).

## License

Code: MIT (see `LICENSE`).
Article content, images and diagrams under `src/content/`: © Michael
Obernhumer, all rights reserved, unless an article states otherwise.

## Requirements

- Node **24.x** (see `.nvmrc`)
- pnpm **11+** (`corepack enable` picks up the version pinned in
  `package.json`'s `packageManager` field)
- Nix, for `pnpm verify`: `nix develop` provides the pinned Chromium and
  fontconfig the visual baselines were captured with, plus `lychee`.

## Setup

```sh
corepack enable
pnpm install
pnpm dev
```

## Scripts

| Script               | Does                                                                    |
| -------------------- | ----------------------------------------------------------------------- |
| `pnpm dev`           | Local dev server                                                        |
| `pnpm build`         | Static build to `dist/`                                                 |
| `pnpm preview`       | Serve the built output locally                                          |
| `pnpm format`        | Prettier, write                                                         |
| `pnpm check:format`  | Prettier, check-only                                                    |
| `pnpm check:astro`   | Type-check `.astro` and TS files                                        |
| `pnpm check:svelte`  | Type-check `.svelte` files                                              |
| `pnpm check:css`     | Stylelint — token-only, no literal values (`IMPLEMENTATION_PLAN.md` §8) |
| `pnpm check:tokens`  | Every `var(--x)` is declared; only the six declared `@layer`s are used  |
| `pnpm check:fonts`   | Font preloads and `@font-face` URLs match files in `public/fonts/`      |
| `pnpm check:content` | Frontmatter schemas and cross-entry invariants (`tests/invariants/`)    |
| `pnpm check:e2e`     | Playwright: pages, a11y, visual baselines                               |
| `pnpm check:links`   | lychee over `dist/` (run after `build`)                                 |
| `pnpm verify`        | Every check except `check:links`, in the order CI runs them             |

## Why these tools

Short version — full reasoning is in `IMPLEMENTATION_PLAN.md` and
`docs/decisions/`:

- **Astro, static output** — no dynamic surface exists anywhere in the design
  (no forms, no auth, no comments); a server runtime would be capability never
  exercised but still requiring patching and monitoring (AD-01).
- **pnpm, not npm** — strict, non-hoisted `node_modules` catches a dependency
  used-but-not-declared at install time instead of as a mystery CI failure.
- **Plain CSS with cascade layers and custom properties, not Tailwind** — the
  design system's type tokens are compound (family + size + line-height +
  tracking as one unit) and the article body is Markdown-generated, so the
  highest-value surface in the site can't take utility classes at all
  (AD-02).
- **No CMS** — content is Markdown in this repo, versioned with the code.
  One system, diffable, works offline.

## Documents

- `DESIGN_SYSTEM.md` — authoritative appearance/structure/behaviour spec.
- `IMPLEMENTATION_PLAN.md` — how it was built, in what order, how compliance
  is proven. §3 has the annotated repository tree.
- `ARTICLE_GUIDE.md` / `MARKDOWN_SYNTAX.md` — voice, and the markdown
  constructs the pipeline understands, for writing articles.
- `CHECKLIST.md` — the manual pre-merge judgment calls CI can't make.
- `docs/decisions/` — one ADR per architectural decision.
- `docs/reference/` — design screenshots and glyph-coverage findings used as
  the source of truth for visual checks.
