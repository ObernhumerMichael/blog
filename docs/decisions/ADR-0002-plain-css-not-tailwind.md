# ADR-0002 — Plain CSS with cascade layers and custom properties, not Tailwind

**Date:** 2026-08-25
**Status:** Accepted (corrects an earlier recommendation made before
DESIGN_SYSTEM.md existed)

## Decision

Style with plain CSS: `@layer` cascade layers, custom properties, container
queries, `:has()`. No Tailwind, no CSS-in-JS, no preprocessor.

## Reasoning

1. DESIGN_SYSTEM.md's type tokens are compound (`--t-body` = serif 400 /
   18.5px / 1.72 / `--c-text` as one unit, §2.5). In utility-class form that
   token decomposes into four independently-editable classes and stops being
   a token — §22.4 forbids exactly this kind of drift.
2. The article body — the single highest-value page (§19.3: "the reference
   implementation of the entire design") — is generated from Markdown.
   Markdown output cannot carry utility classes. The most important surface
   in the system would be styled by a descendant stylesheet regardless, which
   is what plain CSS already is.
3. `@tailwindcss/typography` ships its own scale, spacing and code styling;
   §10, §11, §13, §15 replace essentially all of it — a dependency carried
   only to be overridden.
4. The design's value is restriction (one border weight, one radius, no
   shadows, one accent budgeted at three per viewport — §22). Tailwind's
   value is a large, fast-to-compose utility vocabulary. The tool and the
   goal point in opposite directions.
5. §24.1 already specifies the dark-theme override as "one wholesale block" —
   a two-rule CSS structure, not something a config layer adds value to.

## Rules out

- `@tailwindcss/typography` and any Tailwind config.
- Any CSS-in-JS solution.
- Introducing type or spacing values via a JS config file rather than
  `tokens.css` directly.

## Cost, stated honestly

More CSS written by hand; Tailwind's consistency pressure is replaced by the
stylelint rules in IMPLEMENTATION_PLAN.md §8 (T2), which are stricter than
Tailwind's own guardrails.

## References

IMPLEMENTATION_PLAN.md AD-02.
