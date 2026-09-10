# ADR-0019 — E6's container context moved from `.layout-measure` to `.band`

**Date:** 2026-09-10
**Status:** Accepted

## Decision

`container-type: inline-size` — the anchor for E6, the system's one
container query (`@container (max-width: 700px)`, used by code blocks,
figures and tables to decide their full-bleed treatment) — moves off
`.layout-measure` and onto `.band` in `layout.css`. No token value changes;
this is a container-context correction, not a design change.

## Reasoning

`.layout-measure` is a fixed 680px from 760px up (§22.10 — the measure
never widens). A 680px container is permanently under the 700px threshold,
so `@container (max-width: 700px)` would have matched **at every viewport**,
not just at mobile — putting every code block, figure and table into their
mobile full-bleed treatment on desktop. §13.5, §14.3 and §15.2 all state
the full-bleed behaviour as a **mobile-only** rule; this would have violated
all three silently, since nothing in T2 or the existing T3 suite exercises
a container query.

Measured directly against the Phase 3 fixture in Chromium 151 (both static
CSS and a live DevTools probe, not derived from reading the layout code):

| Candidate container                     | 390     | 900     | 1320     | `(max-width: 700px)` matches at |
| --------------------------------------- | ------- | ------- | -------- | ------------------------------- |
| `.layout-measure` / `.prose` (original) | 350     | 680     | 680      | **all three widths — wrong**    |
| `.band` content box (after its padding) | **350** | **836** | **1208** | **390 only — correct**          |

`.band`'s content box tracks the real page content width (`--page-margin`
already subtracted via `padding-inline`), which is what the query is
supposed to be reasoning about — not the width of one internal grid track.
Declaring the container on `.band` rather than on `.layout-article`
specifically means every band is a valid E6 container, not just the article
shape, which project detail (also layout A, §5.2) will need too.

**A second, unrelated bug found in the same file while verifying this:**
`ProseLayout.astro`'s comment explaining why `.prose` doesn't carry
`.layout-measure` claimed that adding `container-type: inline-size`
directly to `.prose` "collapsed it to 0 width" — a Chromium containment
quirk. That does not reproduce: tested again, both injected at runtime and
declared statically with a full reload, `.prose` measured identically to
baseline (350/680/680) either way, with a `@container` query correctly
matching inside it. Whatever was observed originally, it was not
containment. Corrected the comment at source rather than let it stand as
false folklore for whoever reaches for a container query next. The real
reason `.prose` was never a candidate is the one this ADR states above —
its width is a fixed value from a breakpoint, not a Chromium bug.

## Consequences

- `layout.css`: `container-type: inline-size` moves from `.layout-measure`
  to `.band`, with the 350/836/1208 arithmetic recorded in a comment there.
- `ProseLayout.astro`'s stale containment-bug comment corrected.
- A known, accepted 5px disagreement window: at a 760–764px viewport,
  `--page-margin` is already 32px (the ≥760 value), so the band content box
  is 696–704px — straddling 700. The container query and the 760px
  media-query breakpoint disagree for those 4px. Not "fixed" with a third
  number: §4.2 states exactly one container breakpoint, and the visible
  effect is full-bleed appearing one page-load early at an
  already-borderline width, not a layout break.
- No markup change was needed in `ProseLayout.astro` or `dev/layout-check.astro`
  — both already nest every `.layout-measure` inside a `.band`, so the
  container context reaches the same descendants either way.
- Verified against the full existing T3 suite (106 tests, 3 widths × 2
  themes × 2 pages) with no regressions, and against a live container-query
  probe confirming the match now occurs at 390 only.

## Rules out

- Declaring E6's container on `.layout-measure` or `.prose` directly.
- A second container-query breakpoint to paper over the 760–764px window.

## References

DESIGN_SYSTEM.md §4.2 (E6), §13.5, §14.3, §15.2, §22.10.
IMPLEMENTATION_PLAN.md Phase 4.0 (Finding A).
