## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: <https://docs.astro.build>

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Project-specific sources of truth

This is a from-scratch build against a written spec, not a green-field
playground — read the relevant section of these before implementing
anything, they win over assumptions:

- `IMPLEMENTATION_PLAN.md` — the phased ledger. Each numbered sub-phase
  (e.g. "5.11") states its own scope, its exit criteria, and any findings
  that corrected an earlier assumption. Check `git log` for `docs: planed
phase N` / `feat: ...` commits to see which sub-phases are already done
  before starting one.
- `DESIGN_SYSTEM.md` — the actual design spec (§ numbers referenced
  throughout the codebase's own comments).
- `docs/decisions/ADR-*.md` — one file per architecture decision. Several
  correct an earlier plan assumption after real implementation surfaced a
  problem (e.g. ADR-0016 corrects the `--bp-gutter` arithmetic, ADR-0019
  corrects an E6 container claim) — the ADR is the current truth, not the
  plan prose it corrects.
- `docs/reference/` — captured design screenshots per page type, and
  `glyph-coverage.md` for font-coverage findings.

## Architecture constraints (do not reintroduce)

- **Static output, no adapter** (AD-01). No SSR, no server-rendered
  redirects. `Astro.redirect(url, 301)` under this config emits a
  meta-refresh, not a real 301 — see `src/pages/writing/[slug].astro`'s
  own comment.
- **No `ViewTransitions`/`ClientRouter`, ever** — `BaseLayout.astro` has a
  standing warning against it; navigation is a full document load by
  design.
- **Plain CSS, tokens only** — no Tailwind, no literal colour/spacing
  values in component styles (`check:css` / stylelint enforces this).

## Content and cross-entry checks

- `astro:content` is a virtual module — it doesn't exist outside Astro's
  Vite pipeline. `tests/invariants/*.test.ts` therefore reads the
  Markdown files directly with `gray-matter` and validates against the
  Zod schemas imported straight from `content.config.ts`, run via plain
  `node --test` (`pnpm check:content`), not Vitest.
- `src/pages/dev/` (no underscore, see ADR-0014) holds real, routable dev
  pages — `specimen.astro` (design-token/component reference),
  `layout-check`, `fixtures/*`. They're stripped from the deployed output
  by a `rm -rf dist/dev` step at deploy time, not by Astro routing, so
  they build and render like any other page locally. `specimen.astro` is
  extended at the end of most phases to give new components a home
  outside a full article render — follow that precedent rather than
  writing a one-off test page elsewhere.

## Nix devShell / Playwright

`flake.nix` provides `pkgs.chromium` and exports
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` to its path — `playwright.config.ts`
already reads that var into `launchOptions.executablePath` for
`check:e2e`. Playwright's own `chromium.launch()` does **not** read that
var itself; it defaults to a separately-downloaded browser binary, which
fails in this sandbox (missing shared libs, no sudo). Any ad-hoc
Playwright script (e.g. a one-off screenshot check) must pass
`executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE` explicitly —
don't add packages to the flake to work around forgetting this.
