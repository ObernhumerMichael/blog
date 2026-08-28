# ADR-0004 — Markdown + remark directives; MDX only by exception

**Date:** 2026-08-25
**Status:** Accepted

## Decision

Author content as plain `.md` by default. Callouts, figures and terminal
blocks use remark **container directives** (`:::note`, `:::figure`), not
imported MDX components. `.mdx` is permitted but each use requires a written
justification.

## Reasoning

§6 closes the component inventory at twenty; §22.8 states a component used on
exactly one page doesn't belong in the system. MDX makes arbitrary component
injection into prose a one-line action — exactly the pressure that closed
inventory exists to resist. Directives keep content as portable plain text
(survives an engine change) and put the _renderer_, not the author, in
charge of what a `:::note` looks like — one implementation, matching §10's
callout spec exactly.

## Rules out

- Default MDX for all content.
- Ad hoc component imports inside article bodies as the normal authoring
  path.

## Realistic legitimate MDX use

An interactive island inside the evolutionary-SVG article (content brief
§6) — one deliberate exception, not a pattern.

## References

IMPLEMENTATION_PLAN.md AD-04.
