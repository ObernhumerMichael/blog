# ADR-0010 — Permalinks: `/w/<number>`, with a human-readable slug redirect

**Date:** 2026-08-25
**Status:** Accepted

## Decision

The canonical permalink for an article is `/w/<zero-padded-number>` (e.g.
`/w/038`), per §9's own statement that the article number _is_ the
permalink. A slug alias at `/writing/<slug>` issues a 301 to the canonical
`/w/<num>` URL. Canonical `<link>` tags always point at `/w/<num>`.

## Reasoning

§9's metadata-row spec states the article number "doubles as the permalink,"
and §19.9 states numbering is site-wide and monotonic — an unusual choice,
but a genuinely stable one: it never needs to change even if a title is
edited. The slug alias exists purely for human-readable shared links and SEO
snippet text, without creating two canonical identities for the same
article.

## Rules out

- Slug-only permalinks (`/writing/my-post-title`) as canonical.
- Date-based permalinks (`/2026/08/25/my-post`).
- Renumbering a published article for any reason — the number is permanent
  once assigned (§21.2).

## References

IMPLEMENTATION_PLAN.md AD-10; DESIGN_SYSTEM.md §9, §19.9, §21.2.
