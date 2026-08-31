# ADR-0015 — Dark `--c-accent-hi` and `--c-nav`: adopted the reasoned values, source was inconsistent

**Date:** 2026-08-31
**Status:** Accepted

## Decision

`--c-accent-hi` (dark) = `oklch(0.80 0.13 45)` and `--c-nav` (dark) =
`oklch(0.75 0.012 75)` are final, not provisional. No further verification
against Claude Design output is planned for these two values.

## Reasoning

Both tokens were flagged as spec gaps during Phase 1 (`DESIGN_SYSTEM.md`
§2.2's dark table omits both; §18.1 and §16.1 require them to exist). The
plan was to resolve them by reading the correct values off the Phase 0.3
Claude Design reference screenshots.

That didn't produce a clean answer: the Claude Design source material was
**inconsistent across frames** for these two values — different exports
showed different treatments rather than one value to read off confidently.
Rather than pick one inconsistent frame arbitrarily and call it "measured,"
the original reasoned derivation is adopted as the actual decision:

- `--c-accent-hi`: light moves 0.08 lightness toward higher contrast against
  its own ground (0.55 → 0.47) and gains 0.01 chroma for the hover step;
  dark mirrors that same relationship in the other direction (0.72 → 0.80).
- `--c-nav`: light `--c-nav` sits at a fixed relative position between
  `--c-text` and `--c-muted` (stronger than muted, weaker than text); dark
  holds the same relative position.

Both are internally consistent with every other light/dark pair in
`tokens.css`, which independently follow this pattern of decisions moving
by mirrored offsets rather than fixed absolute shifts.

## Rules out

- Further attempts to "measure" these two values from Claude Design frames
  — the source doesn't have one consistent answer to extract.
- Treating a single inconsistent frame as ground truth by picking it
  arbitrarily.

## Revisit when

If real components in a real browser (Phase 2 onward) make either value
look visibly wrong against actual dark-mode content, adjust then — that's
a stronger signal than a screenshot was going to be anyway.

## References

`tokens.css` §1 (colour tokens); `DESIGN_SYSTEM.md` §2.2, §16.1, §18.1.
