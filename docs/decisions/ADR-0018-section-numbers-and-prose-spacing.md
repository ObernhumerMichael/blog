# ADR-0018 — Section numbers authored in Markdown; three prose-spacing corrections

**Date:** 2026-09-08
**Status:** Accepted (OD-10, OD-11)

## Decision

1. **Section numbers (`01`, `2.1`) are authored directly in Markdown
   headings** — `## 01 · Title` — not generated from heading order. A
   remark plugin (`remark-section-numbers.ts`, IMPLEMENTATION_PLAN.md 3.3)
   splits the `NN · ` prefix into the mono accent span, validates `h2`
   contiguity from `01`, and validates that any `h3` opening `n.m` matches
   its parent's `n` — build fails otherwise.
2. **Paragraph → `h3` spacing**, absent from DESIGN_SYSTEM.md entirely, is
   **32px at desktop and tablet, 26px at mobile**.
3. **Two source corrections**, each because a later, more specific
   statement disagreed with an earlier, more general one:
   - §6·06's section-heading gap below the number is **16 tablet / 14
     mobile**, not a flat 16 — matching §10.9's mobile table.
   - §10.5's references block sits **96px** after the body, not 56 —
     matching §10.3 and §5.3's independent statements of the same gap.

## Reasoning

**Section numbers (OD-10).** Two ways to keep the rendered heading, its
anchor `id`, and the TOC entry in agreement: author the number in the
Markdown, or generate it from heading order.

1. §6·06 already forces half of it — `h3` subsections are numbered `n.m`
   "in the text itself" no matter which option is chosen, so generating
   only the `h2` numbers would leave one level authored and one generated,
   the split most likely to drift.
2. The anchor and the TOC come free: Astro's Markdown pipeline slugs
   headings and exposes them from `render()`; with the number in the
   heading text, the slug already contains it and the TOC key is the same
   string the reader sees.
3. Renumbering is visible in the diff under this option. Under the
   generated option it's invisible, and every shared link into the article
   silently retargets.

The cost is that authored numbers can go wrong — mitigated by the
contiguity/parent-match validator in `remark-section-numbers.ts` (same
invariant shape as T1's article-number contiguity check).

**Paragraph → h3 spacing (OD-11).** No source states this value. 32
(desktop/tablet), 26 (mobile) mirrors `--sp-prose-block`, the token the
system already uses for a break of this weight, and introduces no number
outside the existing 4px scale.

`docs/reference/article/1320-light-full.png` was opened during planning to
check this visually. Its only `h3` ("2.1 · What the drift was hiding")
follows a code-block caption, not a bare paragraph — the fixture doesn't
actually contain the relationship being decided. 32/26 is adopted as a
working value on structural-consistency grounds, not a confirmed pixel
reading; revisit once a real published article gives a genuine
paragraph-then-h3 case to check against.

**The two source corrections.** §6·06's "below" value gets a mobile
breakdown because its own "above" value already has one in the same
sentence — leaving "below" flat was an internal inconsistency, not just an
abbreviation. §5.3 and §10.3's citations of the same h2→paragraph
relationship were left untouched: both already follow an established
desktop-only-citation convention shared by every other relationship in
their tables (confirmed against their existing "Paragraph → paragraph"
rows, which stay flat even though §3.3 gives that relationship a full
`24/24/20–22` breakdown), so they weren't actually wrong, just abbreviated
like their neighbours. §10.5's 56 is outnumbered two independent
statements to one, and a references-block gap that changes size depending
on whether an article happens to have footnotes is a worse property than
being one source out of step.

## Consequences

- DESIGN_SYSTEM.md edited at six points: §3.3 (two new rows — `h2` →
  paragraph, paragraph → `h3`), §5.3 (rhythm sentence), §6·06, §10.3 (one
  new row), §10.5.
- §25.4 gains three new "Behavioural findings" rows recording all of the
  above, per that section's own existing audit-trail convention.
- IMPLEMENTATION_PLAN.md 3.2 adds `--sp-para-h3` (26/32) and the other
  prose-spacing tokens against these now-decided values — not done here.
- `remark-section-numbers.ts` (IMPLEMENTATION_PLAN.md 3.3) is now
  implementing a decided, specific requirement rather than an open
  question.

## Rules out

- Generating section numbers from heading order.
- A conditional apparatus gap that varies with whether an article has
  footnotes.

## References

DESIGN_SYSTEM.md §3.3, §5.3, §6·06, §10.3, §10.5, §10.9, §25.4.
IMPLEMENTATION_PLAN.md Phase 3.0 (OD-10, OD-11, Findings A/B/C), 3.2, 3.3.
