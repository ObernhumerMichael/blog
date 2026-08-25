# Blog

Personal technical blog — Astro static site, built to the Ledger design system
(`DESIGN_SYSTEM.md`) per the plan in `IMPLEMENTATION_PLAN.md`.

## Status

Phase 0 — repository and tooling bootstrap. Not yet buildable as a real site.

## License

Code: MIT (see `LICENSE`).
Article content, images and diagrams under `src/content/`: © Michael
Obernhumer, all rights reserved, unless an article states otherwise.

## Requirements

- Node **24.x** (Active LTS as of August 2026 — see `.nvmrc`; verify at
  <https://nodejs.org> if this drifts)
- pnpm **9+** (`corepack enable` will pick up the pinned version in
  `package.json`'s `packageManager` field)

## Setup

```sh
corepack enable
pnpm install
pnpm dev
```

## Scripts

| Script              | Does                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| `pnpm dev`          | Local dev server                                                                                        |
| `pnpm build`        | Static build to `dist/`                                                                                 |
| `pnpm preview`      | Serve the built output locally                                                                          |
| `pnpm check:astro`  | Type-check `.astro` files                                                                               |
| `pnpm check:css`    | Stylelint — enforces the token-only, no-literal-values rules from `IMPLEMENTATION_PLAN.md` §8 (Phase 1) |
| `pnpm check:format` | Prettier, check-only                                                                                    |
| `pnpm format`       | Prettier, write                                                                                         |
| `pnpm verify`       | Everything above, in the order CI runs it                                                               |

`check:content` and `check:links` are stubs until Phase 5 / Phase 8 — see
`IMPLEMENTATION_PLAN.md` for what they'll cover.

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
- **No CMS** — content is Markdown/MDX in this repo, versioned with the code.
  One system, diffable, works offline (see content brief).

## Repository map

See `IMPLEMENTATION_PLAN.md` §3 for the full annotated tree and the reasoning
behind each directory split.

## Documents

- `DESIGN_SYSTEM.md` — authoritative appearance/structure/behaviour spec.
- `IMPLEMENTATION_PLAN.md` — how it gets built, in what order, how compliance
  is proven.
- `PUBLICATION_BOUNDARY.md` — sign-off boundary for the industrial case study
  (OD-04).
- `docs/decisions/` — one ADR per architectural decision (AD-01…AD-13).
- `docs/reference/` — design screenshots and glyph-coverage findings used as
  the source of truth for visual checks.
