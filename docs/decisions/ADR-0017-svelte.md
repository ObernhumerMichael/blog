# ADR-0017 — Svelte replaces the vanilla-JS-only island constraint

**Date:** 2026-09-05
**Status:** Accepted — supersedes ADR-0011

## Context

ADR-0011 committed the project to three vanilla-JS islands under 4KB total,
reasoning that nothing in the design needed component state or a UI
framework runtime. That held for the _original_ three behaviours (theme,
TOC+progress, copy control), each written and tested as standalone scripts.

In practice the constraint fought the reason Astro was chosen in the first
place: islands architecture exists specifically so a framework component can
be dropped into otherwise-static HTML and hydrated independently, at whatever
granularity the page needs, without paying a global runtime cost. Ruling out
every framework meant re-deriving component-shaped problems (synced state
between the masthead theme control and the mobile-panel theme control,
scroll-spy state for the TOC, disclosure state) in hand-written imperative
DOM code — solvable, but strictly harder to keep correct than the same logic
in five small typed components.

## Decision

Adopt `@astrojs/svelte`. Client-side interactivity is authored as Svelte
components, one behaviour per component, each hydrated with the narrowest
directive that behaviour needs (`client:idle`, `client:visible`, or
`client:media` — never a bare `client:load` by default).

**Component split:**

| Behaviour                                    | Component                | Hydration        | Notes                                                                                                                                                                                                                                                    |
| -------------------------------------------- | ------------------------ | ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Theme _toggle_ (click handling, persistence) | `ThemeToggle.svelte`     | `client:idle`    | The pre-paint theme _application_ stays a blocking inline vanilla script (`?raw` + `is:inline`) in `<head>` — unchanged from the current verified implementation. Svelte owns only the button's post-paint interaction.                                  |
| TOC active-item tracking                     | `TocSpy.svelte`          | `client:visible` | IntersectionObserver → active section id as component state → spine tick.                                                                                                                                                                                |
| Reading progress bar                         | `ReadingProgress.svelte` | `client:visible` | Scroll-derived percentage; below 1100 renders the 2px header bar variant, no separate implementation.                                                                                                                                                    |
| Code-copy control                            | `CopyButton.svelte`      | `client:visible` | Local `copied` boolean + timeout; label swap, no toast — behaviour unchanged from ADR-0011, just componentized.                                                                                                                                          |
| Mobile menu / TOC disclosure                 | _(unchanged)_            | —                | Stays a native `<details>`/`<summary>` element per §7.5/§12.1. It needs no JS at all today; do not convert it to a Svelte component without a concrete reason, per the "prefer changing the page over adding a component" rule (DESIGN_SYSTEM.md §22.6). |

## Reasoning

Svelte compiles each component to near-vanilla imperative DOM code with no
shared virtual-DOM runtime, so the _marginal_ cost of each island stays close
to what ADR-0011 already budgeted for hand-written scripts, while gaining:
real typed props/state (TypeScript strict, per the project's existing
decision), independent hydration per island (a scroll-spy component on an
article page never ships to the homepage), and component boundaries that
match the "one behaviour, one job" shape the rest of the component inventory
already uses.

## Rules out

- React, Vue, SolidJS, Alpine.js, or any other framework integration —
  Svelte is the only client-side framework in the project.
- Scoped `<style>` blocks inside `.svelte` files. All styling continues
  through the existing cascade-layer system
  (`tokens → reset → base → layout → components → exceptions`) in plain
  `.css`. A Svelte component contributes markup and behaviour only; giving
  it its own scoped stylesheet would create a second, parallel styling
  system, which is exactly what the plain-CSS decision was meant to avoid.
- `client:load` as a default hydration directive. Each component's
  directive must be justified by when it actually needs to be interactive.
- Global client state (stores, nanostores, or otherwise) shared _between_
  islands. Each island stays independent, per the restraint principle
  (§22.18) — if two islands genuinely need to share state, that is a design
  question first, not a wiring problem.
- Converting the mobile menu or TOC disclosure to Svelte by default — they
  work with zero JS today via native `<details>`; only convert if a specific
  behaviour (e.g. an animated height transition beyond what `<details>`
  gives you) requires it, and record that as its own ADR.

## Enforcement

Replace the flat "under 4KB total" check with a bundle-size budget in CI:
**total compiled island JS (all Svelte components + the unchanged inline
theme script) stays under 10KB gzip.** This is checked via a bundle-analysis
step alongside the existing Lighthouse CI JS-budget check
(IMPLEMENTATION_PLAN.md §8, T5). A budget violation is still treated as a
design question ("does this really need to be interactive, or this granular
a hydration directive?"), not routed around by raising the number.

Add `svelte-check` to the toolchain (`pnpm add -D svelte-check
@astrojs/svelte svelte`) and run it alongside `astro check` in CI, so
`.svelte` files get the same TypeScript-strict enforcement as `.ts`/`.astro`
files.

## References

Supersedes ADR-0011. DESIGN_SYSTEM.md §7.5 (mobile menu), §12.1 (interactive
controls), §16 (states), §17 (motion), §22.6 (prefer existing component over
new variant). IMPLEMENTATION_PLAN.md AD-11 (to be updated — see companion
patch), §8/T5 (Lighthouse budget).
