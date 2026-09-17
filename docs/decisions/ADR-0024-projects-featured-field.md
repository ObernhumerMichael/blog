# ADR-0024 — `projectsSchema` gains `featured`, capped at three

**Date:** 2026-09-17
**Status:** Accepted (OD-16)

## Decision

Add `featured: z.boolean().optional()` to `projectsSchema`, mirroring
`writing`'s own field exactly. Unlike `writing`'s invariant (at most **one**
featured entry, matching the blog index's single-slot featured band),
`tests/invariants/featured.test.ts` caps `projects` at **three**, matching
the homepage's three-slot Selected-work band (§19.1: `Selected work / 3 of
6`).

## Reasoning

Neither §19.1 nor component 07's own table (§6·07) states how three of N
projects get chosen for the homepage. Three candidate rules existed:
most-recent by `period.from`, an explicit flag, or reverse project-number
order. Most-recent-by-date was rejected: it would rank the archived
evolutionary-SVG project (`period.from: 2024-02-01`) ahead of the CTF
aggregate (`2023-03-01`, still active) purely by start date — the wrong
axis for "work worth showcasing," and `writing.featured` already solves the
identical editorial-judgement problem with an explicit flag rather than a
derived heuristic.

An explicit flag with `writing`'s exact shape costs nothing new: no second
schema pattern, no second invariant shape, only the cap number differs
(three vs one), because the two UIs it feeds have three slots and one slot
respectively.

## Consequences

- The three real, non-draft project entries (ADR-0023) are all marked
  `featured: true` now — no article-scale selection problem exists yet with
  exactly three non-draft projects and a three-slot band. The cap is
  exercised, not invented ahead of need, the day a fourth non-draft project
  ships.
- `src/pages/index.astro` (7.4) filters `projects` on `featured` for the
  Selected-work band, the same shape `/writing/index.astro` already uses
  for its own featured entry.

## Rules out

- A derived "most recent N" heuristic for the homepage's project selection.
- A single shared `featured` cap function/config for both collections —
  the cap itself (one vs three) is collection-specific, so one small
  duplicated assertion in the invariant test is clearer than a parameterised
  helper for two call sites.

## References

DESIGN_SYSTEM.md §19.1.
IMPLEMENTATION_PLAN.md Phase 7.0 (Finding C, OD-16), 7.1.
