# ADR-0022 — `projectsSchema.links` gains `demo`/`primaryLabel`; `article` is not a URL

**Date:** 2026-09-17
**Status:** Accepted (OD-14)

## Decision

1. **`projectsSchema.links.demo`** (`z.url().optional()`) — a fourth link
   kind, independent of `article`/`source`. A live demo and a written case
   study are different things a project can have on their own.
2. **`projectsSchema.links.primaryLabel`** (`z.string().optional()`) — the
   project item's primary link text is content, not a template string.
   Component 07's "`case study →`" phrasing is the default, derived when
   `caseStudy && links.article` and `primaryLabel` is absent; when present,
   `primaryLabel` overrides the text, and `links.article` still supplies the
   href regardless of where it points.
3. **`projectsSchema.links.article` changes from `z.url()` to
   `z.string()`.** The reference shows a non-case-study project (CTF
   writeups) whose primary link reads `browse 28 →` and points at
   `/writing/tag/ctf` — an internal route with no scheme, which a real
   `z.url()` rejects (confirmed: `z.url().parse('/writing/tag/ctf')`
   throws). `article` doubles as the primary link's href regardless of
   label, so its type has to admit both an external URL and an internal
   path.

## Reasoning

The reference screenshots (`docs/reference/projects/1320-light.png`,
`.../index/{390,900}-light.png`) show two things the pre-Phase-6 schema
couldn't represent: the industrial-platform detail page's `LINKS` row
carrying `source ↗ · demo ↗` side by side, and the CTF-writeups project
using `browse 28 →` instead of `case study →`, pointing at a tag archive
page rather than a project detail page at all. Neither is speculative —
both are in the reference art component 07's spec was written from, just
undershot when the component's primary-link text was hardcoded and the
schema had no fourth link kind.

`source`/`demo` stay separate rather than one field reused for both: the
homelab project has `source` with no demo-hosting story, so collapsing them
would need a second field back out immediately for the very first real
entry.

## Consequences

- `src/components/list/ProjectItem.astro` (6.7) derives the primary link's
  text from `primaryLabel ?? (caseStudy && links.article ? 'case study →' :
null)`, and its href directly from `links.article` — no slug computation
  inside the component either way.
- The four real project entries (6.2) use this: CTF writeups sets
  `links.article: '/writing/tag/ctf'` and `primaryLabel: 'browse 28'`; the
  other three use the derived `case study →` default.

## Rules out

- A single `links.article` reused as both a URL-typed external link and an
  internal route depending on context with no type change — the type has
  to genuinely admit both shapes, not paper over it with a runtime check.
- Encoding the primary link's label as a computed string keyed off
  `caseStudy` alone.

## References

DESIGN_SYSTEM.md §11.1 (component 07 anatomy), §6·07.
IMPLEMENTATION_PLAN.md Phase 6.0 (Finding E, OD-14), 6.1, 6.7.
