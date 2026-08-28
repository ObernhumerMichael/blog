# ADR-0008 — No search in v1

**Date:** 2026-08-25 (OD-01, resolved)
**Status:** Accepted

## Decision

Ship without a search feature. Navigation relies on the counted-tag filter
row (§19.2), archive-by-year, and browser find-in-page.

## Reasoning

Direct conflict between the two source documents: the content brief lists
search as a blog UI requirement, while DESIGN_SYSTEM.md §12 states plainly
"there is no search field" and §25.5 lists it among deliberate absences
confirmed by the design's own audit. Per the design system's own
reconciliation rule (§25.4: the later, more specific source wins when the
two disagree), DESIGN_SYSTEM.md governs. At launch scale (a handful of
articles, ceiling ~38 in the spec's own reference numbers) the tag/archive
mechanism is sufficient.

## Rules out

- Pagefind (or any search integration) at launch.

## Revisit when

Article count approaches ~80, per IMPLEMENTATION_PLAN.md's "Designed-in
leeway" table. If added, it must be derived from §12.2's existing form rules
(label, focus, error states) and go through the extension protocol
(IMPLEMENTATION_PLAN.md §12) as component #21, not be bolted on ad hoc.

## References

IMPLEMENTATION_PLAN.md OD-01, AD-08.
