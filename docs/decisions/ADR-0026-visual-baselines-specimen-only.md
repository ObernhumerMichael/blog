# ADR-0026 — Visual baselines: specimen page only

**Date:** 2026-09-24
**Status:** Accepted — narrows IMPLEMENTATION_PLAN.md §8.3's 7×3×2 = 42-image
matrix

## Decision

`tests/e2e/visual.spec.ts` screenshots only `/dev/specimen` (its `:hover`
and `:focus` baselines, desktop, both themes). The per-page-type baselines
(`home`, `article`, `article/index`, `projects`, `projects/index`, `about`,
`404`) are deleted. Verification runs inside the flake's devShell in CI
(`nix develop --command pnpm verify`), with a pinned fontconfig, so the
remaining baselines render identically locally and on the runner.

## Reasoning

The real-page baselines tracked content, not design: replacing the demo
entries, publishing a second article, or editing one paragraph of `/w/001`
each invalidated them, and an article page's full-page capture was also
sensitive to lazy images and late-arriving dev-server modules. None of their
failures was a design regression. `dev/specimen.astro` renders every
component with fixed content, so a diff there is the design change §8 wants
surfaced as a reviewable baseline update. Page-level layout stays covered by
`chrome.spec.ts`/`prose.spec.ts` invariants, stylelint's tokens-only rule,
`check:tokens`, and Lighthouse's CLS budget.

## Rules out

- Screenshot baselines of content-bearing pages (anything under
  `src/content/`-driven routes). A new visual check for a component belongs
  on `dev/specimen.astro`, per its existing extend-each-phase precedent.
- Regenerating baselines outside the devShell — Playwright's downloaded
  browser and the host's system fonts produce different pixels.
