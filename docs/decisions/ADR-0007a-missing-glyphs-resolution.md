# ADR-0007a — Resolution for the three missing glyphs (●, ○, ◐)

**Date:** 2026-08-25
**Status:** Accepted

## Decision

- **Status dots (`●`/`○`)**: implement as a plain element with
  `border-radius: 50%`, not as rendered font glyphs — filled background for
  live, 1px border with transparent fill for archived.
- **Theme control (`◐`)**: implement as a single inline SVG half-circle using
  `currentColor`, sized to match surrounding text.

## Reasoning

Confirmed absent from Source Serif, Plex Sans, and Plex Mono (Roman and
Italic, all six files) via real cmap inspection — see ADR-0007.

For the status dots, §2.9 already specifies them as a 6px, `radius: 50%`
element rather than running text, so drawing them directly is not a
workaround but arguably the more correct implementation regardless of glyph
availability: exact 6px sizing independent of any font's em-box or baseline,
and no risk of a fallback font rendering a visibly different dot size next
to the "live" one.

For the theme control, no self-hosted font in the stack has `◐`, and adding
a symbol font for one character costs more (an extra font request or a
larger subset) than a single small inline SVG.

## Explicit tension acknowledged

§2.11 frames the glyph set as "a closed set of typographic glyphs, set in
the surrounding font at the surrounding size" — implying rendered text
characters, not drawn shapes. This decision is a deliberate, narrow
exception to that framing, made because no available self-hosted font
satisfies it, not a silent substitution. It is explicitly **not** the
icon-library pattern §1.12 forbids: one bespoke shape per case, not an
imported set, and both continue to use `currentColor` so they behave
identically to a text glyph with respect to theming.

## Rules out

- Any icon font or icon library as a broader fallback strategy.
- A `unicode-range`-scoped fallback font import for these three characters
  (considered and rejected as strictly worse than the above).

## References

ADR-0007; DESIGN_SYSTEM.md §2.9, §2.11, §1.12.
