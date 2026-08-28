# ADR-0007 — Self-hosted variable fonts, subset, with two verified corrections

**Date:** 2026-08-25 (verified against real font files same day)
**Status:** Accepted

## Decision

Self-host three families: Source Serif 4 (variable, Roman + Italic),
IBM Plex Sans (variable, Roman + Italic), IBM Plex Mono (variable, Roman +
Italic). Subset to Latin + German + the confirmed-present glyph set. No
runtime third-party font requests.

## Reasoning

All three are libre and self-hostable (§2.4). Source Serif's `opsz` axis is
load-bearing: §2.4 relies on it so the 42px title tightens while 18.5px body
stays open.

## Verified findings (2026-08-25)

Real font files were pulled from `adobe-fonts/source-serif` and `IBM/plex`
on GitHub and inspected with fontTools — not assumed from memory or generic
font documentation.

- **IBM Plex Mono has a variable release** (`plex-mono-variable`, `wght
100–700`). An earlier draft of this decision assumed no variable release
  existed and planned two static cuts; that was wrong and is corrected here.
  Ship the variable file.
- **Three glyphs are absent from every one of the six files**: `●` (U+25CF),
  `○` (U+25CB), `◐` (U+25D0). See ADR-0007a for the resolution.
- Source Serif and Plex Sans variable-axis ranges match the original
  assumption exactly (`wght 200–900`/`opsz 8–60` and `wght 100–700`
  respectively).

Full table: `docs/reference/glyph-coverage.md`.

## Rules out

- Static Plex Mono cuts.
- Any runtime Google Fonts / third-party font CDN request.
- Assuming glyph coverage without checking real font files for any future
  font swap.

## References

IMPLEMENTATION_PLAN.md AD-07; docs/reference/glyph-coverage.md.
