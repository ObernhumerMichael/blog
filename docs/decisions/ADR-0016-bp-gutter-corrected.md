# ADR-0016 — `--bp-gutter` corrected from 1100px to 1280px

**Date:** 2026-09-01
**Status:** Accepted (OD-08)

## Decision

The gutter breakpoint — the width at which the three-track article shape
(gutter / measure / aside) appears — moves from **1100px to 1280px**. No
token value in DESIGN_SYSTEM.md §2.7 changes: the gutter stays 148px, the
measure 680px, the aside 200px, the grid gap 44px.

## Reasoning

DESIGN_SYSTEM.md §4.1 justifies the 1100px breakpoint as _"the width at
which `148 + 44 + 680 + 44 + 200 = 1016` plus 2 × 32 margins can be
honoured."_

**That sum is wrong.** The correct total is 1116, not 1016 — an off-by-100
typo. Verified by computation during Phase 2 planning, before any layout
code was written:

| Quantity                                                | Value                   |
| ------------------------------------------------------- | ----------------------- |
| Three-track content width (`148 + 44 + 680 + 44 + 200`) | **1116px**              |
| Margin mandated by §3.3 at desktop                      | 56px per side           |
| Minimum viewport required                               | 1116 + 112 = **1228px** |
| Actually available at a 1100px viewport                 | 1100 − 112 = **988px**  |
| Result at the stated breakpoint                         | **overflows by 128px**  |

At exactly 1100px the three-track shape cannot be honoured. The only way to
make it fit would be to narrow the measure — which §4.1's own next sentence
forbids ("the measure is never negotiable") and §22.10 repeats as a
consistency rule.

**The reasoning in §4.1 is correct; only its number is wrong.** The stated
logic — "the width at which the tracks plus margins can be honoured" —
points at 1228, not 1100. So the fix is to correct the number, not to
renegotiate the tokens: shrinking the gutter or aside to accommodate a
typo would be backwards.

## Why 1280 and not 1228 or 1240

| Candidate | Slack after 56px margins | Verdict                                                                                                                                                                                    |
| --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1228      | 0px                      | The exact minimum. Zero tolerance for sub-pixel or scrollbar variance. Rejected.                                                                                                           |
| 1240      | 12px                     | The obvious "minimum, rounded up" choice, and wrong: **thinner than a classic Windows scrollbar** (~15–17px). The layout could engage at a width where it does not actually fit. Rejected. |
| **1280**  | **52px**                 | Comfortable tolerance. **Chosen.**                                                                                                                                                         |

1280 is a device-ish number, which sits awkwardly against §4.3's "prefer
available space over device names." The justification here is still
structural rather than device-based: it is the nearest round number that
clears the computed 1228 minimum with enough tolerance to survive a
scrollbar. It is not "the width of a laptop."

## Consequences

- `tokens.css`: `@media (min-width: 1100px)` → `1280px`; the comment
  repeating the erroneous 1016 arithmetic (propagated there during Phase 1)
  replaced with the corrected derivation.
- `.stylelintrc.json`: media-query allow-list `760px|1100px` →
  `760px|1280px`. The T2 rule set will hard-fail any file that misses this,
  which is the enforcement system doing its job.
- The tablet range widens from 760–1099 to 760–1279. No component behaviour
  changes; that range is already fully specified, it simply applies over
  more widths.
- The desktop **type** scale moves with the layout breakpoint, deliberately.
  §4.1 states that everything changing at a threshold is a consequence of
  that threshold's structural fact, so the desktop type steps apply exactly
  where the desktop layout applies. Decoupling them would introduce a third
  breakpoint, which §22.13 forbids.

## Open follow-up — DESIGN_SYSTEM.md itself

DESIGN_SYSTEM.md is the authoritative document (§24) and contains **19
references to 1100**, including the incorrect sum in §4.1. It should be
corrected at source rather than silently diverged from — otherwise every
future reader re-derives the same wrong number, and the implementation
appears to contradict the spec for no visible reason.

Sections requiring the change: §2.5 (desktop values header), §2.7 (gutter,
aside, masthead-height rows), §2.14 (`--bp-gutter` row), §3.1, §3.3, §3.4,
§3.5, §3.6 (all "≥1100" column headers), §4.1 (**the row containing the
arithmetic error itself**), §4.3, §5.2, §6/09 (progress), §6/15 (TOC),
§7.3, §7.6, §10.8, §14.3.

## Rules out

- Narrowing the measure, gutter, or aside to fit a 1100px viewport.
- A third breakpoint separating type from layout.

## References

DESIGN_SYSTEM.md §2.7, §3.3, §4.1, §4.3, §22.10, §22.13;
IMPLEMENTATION_PLAN.md Phase 2.0 / OD-08.
