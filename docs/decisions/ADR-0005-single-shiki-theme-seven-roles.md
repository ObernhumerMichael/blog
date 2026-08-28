# ADR-0005 — Single custom Shiki theme, seven syntax roles

**Date:** 2026-08-25
**Status:** Accepted

## Decision

Author one custom Shiki theme (not a stock theme) mapping TextMate scopes
onto exactly the seven roles in §2.3, using Shiki's CSS-variables output
mode so colours live in `tokens.css` with everything else.

## Reasoning

§2.3 and E2 state the code ground is identical in both themes — so unlike a
typical two-theme Shiki setup, this needs only **one** theme, a genuine
simplification. No off-the-shelf Shiki theme uses only seven colours held at
0.78–0.82 lightness (§25.4 corrects the spec's stated "five" roles to the
actual seven used in the built frames); using a stock theme would silently
violate §2.3's restraint.

## Rules out

- Any stock/off-the-shelf Shiki theme (github-dark, one-dark-pro, etc.)
- Per-theme (light/dark) Shiki configuration.

## Consequence

The CSS colour lint (T2, IMPLEMENTATION_PLAN.md §8) must exempt Shiki's
inline `style="color:#…"` output, or use the CSS-variables mode specifically
to avoid that exemption.

## References

IMPLEMENTATION_PLAN.md AD-05.
