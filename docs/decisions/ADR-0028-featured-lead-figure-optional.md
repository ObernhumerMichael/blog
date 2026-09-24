# ADR-0028 — The featured entry's lead figure is optional, never a placeholder

**Date:** 2026-09-24
**Status:** Accepted (corrects IMPLEMENTATION_PLAN.md 6.4 point 3's
placeholder reading of §9.5)

## Decision

Add `leadFigure: { src, alt }` as an optional field on `writingSchema`.
`FeaturedEntry.astro` renders it in the §9.5 figure slot, framed by a
hairline and sized by role (170px on the homepage, 200px on the index).
An entry without one renders **no figure**: the 135° hatch placeholder
labelled `[ lead figure ] 200px` is gone from the live site.

## Reasoning

§9.5 says the featured entry is "paired with a hairline-framed lead
figure", and 6.4 read that as a required pairing. With no schema field
behind it, the result was that the §14.1 design-mockup placeholder shipped
on the homepage and blog index. §1.8 is explicit that "the alternative to
an image is not a decorative graphic; it is no image", and §1149/§1697 say
the same for articles. A mockup label on the live site is the worst of
both. A single universal image would satisfy §9.5 literally but is exactly
the decorative graphic §1.8 rules out, and would say nothing about which
article is featured. The permanent title underline and the larger title
(§9.5) still mark the entry as featured when there is no figure.

## Consequences

- Article 001 uses its existing backup-chain diagram
  (`/figures/001-backup-chain.svg`) as its lead figure.
- The lead figure is dimmed in dark mode by the same `exceptions`-layer
  rule as the portraits (`blocks.css`), since `filter` is only allowed
  there.
- The specimen visual baseline changes, since its FeaturedEntry section
  now renders article 001's real figure.

## Rules out

- A site-wide default or generic lead image.
- Shipping the §14.1 hatch placeholder outside `/dev/` pages.

## References

DESIGN_SYSTEM.md §1.8, §9.5, §14.1.
IMPLEMENTATION_PLAN.md 6.4 point 3.
