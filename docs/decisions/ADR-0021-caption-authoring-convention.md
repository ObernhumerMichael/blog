# ADR-0021 — Captions are the paragraph after the block, authored numbers (OD-13)

**Date:** 2026-09-10
**Status:** Accepted (OD-13)

## Decision

A code block, figure or table's caption (§13.2, §14.2, §15.1 — `Listing n
—`, `Fig. n —`, `Table n —`) is **the plain paragraph immediately following
the block**, recognised by its prefix and promoted into the block's caption
slot by a remark plugin (`remark-captions.ts`, Phase 4.8). The numbers are
**authored in the source, not generated** from block order, and validated
for per-kind contiguity from 1 — the same trade-off OD-10 already made for
section numbers, decided the same way and for the same three reasons.
Terminal blocks share the **code** counter (`Listing n`), not a separate one.

Figures are the one exception in shape: their caption sits **inside** the
`:::figure` directive (it already has nowhere else to go, since the
directive's own body is the image), so the plugin branches on block kind —
extract-from-following-paragraph for code and tables, extract-from-directive-
body for figures. Two code paths, not two mechanisms: the same numbering
counters, the same validator, the same output shape.

## Reasoning

Markdown has no caption syntax for any of the three components. GFM tables
have no caption element at all; a fenced code block's meta string cannot
hold four lines of prose (§14.2: "no length limit ... may run four lines").
The Phase 3 fixture had already improvised the convention this ADR
formalises — a `Table 1 — …` paragraph directly after the block — without
it being decided anywhere, which is exactly the kind of implicit contract
this document exists to make explicit before more content depends on it.

**Authored numbers, not generated**, for the same reasons OD-10 gave for
section numbers (ADR-0018), reapplied here:

1. One authoring model for both kinds of number in an article, rather than
   sections generated and captions authored (or vice versa) — the split
   most likely to drift unnoticed.
2. Renumbering is visible in the diff. A generated number silently
   retargets every "see Listing 3" in the prose around it with no signal
   that it happened.
3. Prose that says "see Listing 3" stays true because the author wrote
   both the reference and the number — a generated scheme can't guarantee
   the two stay in sync if a block is reordered without the prose being
   reread.

The alternative — `:::figure{caption="…"}` and a `caption=` fence-meta
attribute for code — puts unquotable prose (footnote references, inline
code, a possible em dash) inside an attribute string, and gives GFM tables
nowhere to attach a caption attribute to at all. The paragraph-prefix
convention needs no new syntax and matches how the fixture was already
being written by hand.

**Terminal shares the code counter.** The only two reference frames that
caption a terminal output either use `Listing n` directly or give no
counter-scoping evidence either way; §14.2 assigns `Listing n —` to "code"
as a content category (verbatim machine output), not to component 19
specifically, and §23.4 already treats code and terminal as siblings that
differ in ground and chrome, not in what kind of thing they are to the
reader. A fourth counter for one component would need its own textual
label anyway (`Listing` reads correctly for both) and nothing in the spec
calls for one.

## Consequences

- `remark-captions.ts` (Phase 4.8) runs after `remark-directives.ts` (so
  `:::figure` nodes already exist) and before `remark-code-meta.ts`
  consumes fence nodes, and maintains three independent counters: code+
  terminal, figure, table.
- Build fails on: a caption paragraph immediately following something that
  isn't captionable (stray `Table 1 —` text), a gap or duplicate in a
  counter's sequence, and a captionable block with no caption following it.
- Caption prose keeps its own emphasis markers stripped — `_Table 1 — …_`
  in source renders as plain `--t-caption`, not italic, since the caption
  has its own type treatment (§14.2) and does not inherit inline emphasis.
- Implements §5.5's caption rule for real: the caption stays inside the 20px
  text margin while the block itself goes full-bleed, via caption-outside-
  the-bleed-wrapper markup rather than padding on the block.

## Rules out

- `caption=` / `caption="…"` fence-meta or directive attributes for the
  caption text.
- Generating caption numbers from block order.
- A separate counter for terminal blocks.

## References

DESIGN_SYSTEM.md §5.5, §13.2, §14.2, §15.1. ADR-0018 (the OD-10 precedent
this follows). IMPLEMENTATION_PLAN.md Phase 4.0 (OD-13), Phase 4.8.
