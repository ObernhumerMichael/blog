# Architecture Decision Records

One short record per architectural decision: what was decided, why, and what
it rules out. These exist so a decision doesn't need to be re-litigated from
memory eighteen months from now — DESIGN_SYSTEM.md itself doesn't record
implementation reasoning by design (§24), so this is where that reasoning
lives.

| ADR                                                       | Decision                                                         |
| --------------------------------------------------------- | ---------------------------------------------------------------- |
| [0001](./ADR-0001-astro-static-output.md)                 | Astro, static output, no adapter                                 |
| [0002](./ADR-0002-plain-css-not-tailwind.md)              | Plain CSS with cascade layers, not Tailwind                      |
| [0003](./ADR-0003-two-content-collections.md)             | Two content collections, not three                               |
| [0004](./ADR-0004-markdown-directives-not-mdx-default.md) | Markdown + remark directives; MDX by exception                   |
| [0005](./ADR-0005-single-shiki-theme-seven-roles.md)      | Single custom Shiki theme, seven syntax roles                    |
| [0006](./ADR-0006-inline-svg-diagrams-not-mermaid.md)     | Inline SVG diagrams, not Mermaid                                 |
| [0007](./ADR-0007-self-hosted-variable-fonts.md)          | Self-hosted variable fonts, subset — verified against real files |
| [0007a](./ADR-0007a-missing-glyphs-resolution.md)         | Resolution for the three missing glyphs (●, ○, ◐)                |
| [0008](./ADR-0008-no-search-v1.md)                        | No search in v1 (OD-01)                                          |
| [0009](./ADR-0009-no-comments.md)                         | No comments system                                               |
| [0010](./ADR-0010-permalinks.md)                          | Permalinks: `/w/<number>`                                        |
| [0011](./ADR-0011-three-vanilla-islands.md)               | Three vanilla-JS islands, no UI framework                        |
| [0012](./ADR-0012-now-panel-build-time-fetch.md)          | Now-panel: build-time fetch, committed fallback                  |
| [0013](./ADR-0013-self-hosted-cookieless-analytics.md)    | Self-hosted, cookieless analytics                                |

## Format

Each ADR states: **Decision**, **Reasoning** (2–4 sentences, pointing at
specific DESIGN_SYSTEM.md / IMPLEMENTATION_PLAN.md sections), and **Rules
out** (what this decision forecloses, so a future PR proposing the ruled-out
option can point back here instead of re-arguing it).

## Adding a new one

Next number is 0014. Follow the existing format. If a decision corrects an
earlier one, say so explicitly in the new ADR's Status line — don't silently
edit the old one, since the "why we changed our mind" is itself worth
keeping.
