# ADR-0006 — Diagrams as authored/inline SVG, not Mermaid

**Date:** 2026-08-25
**Status:** Accepted (corrects an earlier Mermaid recommendation made before
DESIGN_SYSTEM.md existed)

## Decision

Author diagrams as SVG (hand-drawn or Excalidraw export with a locked style)
and inline them using `currentColor` and the site's CSS custom properties.
Mermaid is not shipped.

## Reasoning

Mermaid renders rounded boxes, its own font stack, its own arrowheads and its
own palette — §14.1 requires square corners, hairline frames and the
publication's own type, and §1.8 explicitly rejects anything that looks
"pasted in." §2.2 deviation 6 requires diagrams (but not screenshots) to dim
to ~92% in dark mode — a per-figure distinction Mermaid has no concept of.
Re-theming Mermaid to satisfy §2.3 and §14.1 is more total work than drawing
the diagram directly, and stays fragile across Mermaid version bumps.
Token-driven inline SVG themes itself automatically, stays crisp at any
zoom, is diffable in git, and needs no dimming hack since it's drawn in the
site's palette from the start.

## Rules out

- Mermaid (or any diagramming library) in the shipped site.
- Rounded-corner or externally-styled diagram embeds of any kind.

## Allowed

Mermaid for throwaway thinking/drafting only — never shipped.

## References

IMPLEMENTATION_PLAN.md AD-06.
