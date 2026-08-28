# ADR-0003 — Two content collections (`writing`, `projects`), not three

**Date:** 2026-08-25
**Status:** Accepted (corrects an earlier three-collection proposal made
before DESIGN_SYSTEM.md existed)

## Decision

Exactly two Astro Content Collections: `writing` and `projects`. CTF
writeups are `writing` entries tagged `#ctf` / `#security`, not a separate
collection (see OD-02).

## Reasoning

DESIGN_SYSTEM.md §19 defines exactly seven page types; there is no CTF page
type. §7.1 defines three nav destinations (Writing, Projects, About) — a
fourth destination for CTF content isn't in the system. §19.9 states article
numbering is site-wide and monotonic (001–038 as one sequence, doubling as
the permalink) — a separate collection would need its own numbering or its
own index page, breaking that invariant. The counted-tag filter row already
specified in §19.2 (`#infrastructure 11`, `#security 9`, …) is already the
correct browsing mechanism for a CTF sub-audience.

## Rules out

- A `ctf` collection.
- A fourth top-level nav link, unless OD-02 is explicitly revisited.

## References

IMPLEMENTATION_PLAN.md AD-03, OD-02.
