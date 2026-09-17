# ADR-0023 — `projectsSchema` gains `draft`, default `false`

**Date:** 2026-09-17
**Status:** Accepted (OD-15)

## Decision

Add `draft: z.boolean().default(false)` to `projectsSchema`, mirroring
`writing`'s field for field except the default. `writing.draft` defaults
`true` (OD-03: "drafts exempt, fail closed" — a forgotten flag must not
silently publish unready prose). `projects.draft` defaults **`false`**: a
forgotten flag on a project entry would silently _withhold_ one that was
actually fine to ship, the opposite risk, because every project after the
one confidential entry is non-confidential from the moment it's written.

## Reasoning

`src/content/projects/` held nothing but a `.gitkeep` going into Phase 6,
and the one project most worth stress-testing structurally — client work
with no public source (5.0's inherited T4 fixture) — is also the one
project still legally blocked from real prose: OD-04's publication boundary
for the industrial testing platform hasn't been countersigned (Phase 0.5's
own exit note still lists it as carried forward, and no
`docs/*boundary*.md` exists on disk).

`draft` resolves both problems as one field: the industrial platform is
authored now as `draft: true` with the facts already safe to state
(`maintained`, `2025`, `client work · no source`, the stack line,
`sourceAbsence`) and honest placeholder prose standing in for the
Technical-decisions table and Results section, while the three
non-confidential projects ship as real, non-draft content. A draft project
is excluded from the production build exactly as a draft article already
is, so nothing confidential ships, but `astro dev` renders it — which is
enough to prove the "project with no source" fixture structurally without
a separate throwaway entry.

## Consequences

- Four real project entries exist (6.2): `001-self-hosted-homelab.md`,
  `002-ctf-writeups.md`, `003-evolutionary-svg.md` (all `draft: false`),
  `004-industrial-testing-platform.md` (`draft: true`).
- `getStaticPaths()` for `/projects/[slug]` (6.9) and the count feeding
  `/projects` and the mobile-menu nav link (6.8, `NAV_LINKS`) both filter on
  `draft` under `import.meta.env.PROD`, the same shape `writing` already
  uses.
- Phase 10 flips the industrial entry's `draft` to `false` and replaces its
  placeholder sections once the publication boundary is signed — nothing
  here forecloses that.

## Rules out

- Gating the industrial platform's existence on a separate out-of-band
  mechanism (an env var, a build flag) instead of the same content-schema
  field `writing` already uses for exactly this shape of problem.
- Leaving `src/content/projects/` empty until the boundary is signed, which
  would leave the projects index and detail pages (6.8/6.9) with nothing to
  render against or prove structurally.

## References

DESIGN_SYSTEM.md §11.1, §11.2.
IMPLEMENTATION_PLAN.md Phase 0.5 (OD-04), Phase 6.0 (Finding F, OD-15), 6.1,
6.2, 6.10.
