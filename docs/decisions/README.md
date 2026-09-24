# Architecture Decision Records

One short record per architectural decision: what was decided, why, and what
it rules out. These exist so a decision doesn't need to be re-litigated from
memory eighteen months from now — DESIGN_SYSTEM.md itself doesn't record
implementation reasoning by design (§24), so this is where that reasoning
lives.

| ADR                                                        | Decision                                                                       |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [0001](./ADR-0001-astro-static-output.md)                  | Astro, static output, no adapter                                               |
| [0002](./ADR-0002-plain-css-not-tailwind.md)               | Plain CSS with cascade layers, not Tailwind                                    |
| [0003](./ADR-0003-two-content-collections.md)              | Two content collections, not three                                             |
| [0004](./ADR-0004-markdown-directives-not-mdx-default.md)  | Markdown + remark directives; MDX by exception                                 |
| [0005](./ADR-0005-single-shiki-theme-seven-roles.md)       | Single custom Shiki theme, seven syntax roles                                  |
| [0006](./ADR-0006-inline-svg-diagrams-not-mermaid.md)      | Inline SVG diagrams, not Mermaid                                               |
| [0007](./ADR-0007-self-hosted-variable-fonts.md)           | Self-hosted variable fonts, subset — verified against real files               |
| [0007a](./ADR-0007a-missing-glyphs-resolution.md)          | Resolution for the three missing glyphs (●, ○, ◐)                              |
| [0008](./ADR-0008-no-search-v1.md)                         | No search in v1 (OD-01)                                                        |
| [0009](./ADR-0009-no-comments.md)                          | No comments system                                                             |
| [0010](./ADR-0010-permalinks.md)                           | Permalinks: `/w/<number>`                                                      |
| [0011](./ADR-0011-three-vanilla-islands.md)                | Three vanilla-JS islands, no UI framework                                      |
| [0012](./ADR-0012-now-panel-build-time-fetch.md)           | Now-panel: build-time fetch, committed fallback                                |
| [0013](./ADR-0013-self-hosted-cookieless-analytics.md)     | Self-hosted, cookieless analytics                                              |
| 0014                                                       | _(never allocated — skipped; do not reuse)_                                    |
| [0015](./ADR-0015-accent-hi-and-nav-dark-values.md)        | Dark-theme `--c-accent-hi` / `--c-nav` provisionals resolved                   |
| [0016](./ADR-0016-bp-gutter-corrected.md)                  | `--bp-gutter` corrected 1100px → 1280px (OD-08)                                |
| [0017](./ADR-0017-svelte.md)                               | Svelte replaces the vanilla-JS-only island constraint                          |
| [0018](./ADR-0018-section-numbers-and-prose-spacing.md)    | Section numbers authored in Markdown; prose-spacing corrections (OD-10, OD-11) |
| [0019](./ADR-0019-e6-container-context-corrected.md)       | E6's container context moved from `.layout-measure` to `.band`                 |
| [0020](./ADR-0020-code-copy-island-strategy.md)            | One delegating `CodeCopy` island, not one per block (OD-12)                    |
| [0021](./ADR-0021-caption-authoring-convention.md)         | Captions are the paragraph after the block, authored numbers (OD-13)           |
| [0022](./ADR-0022-project-link-kinds-and-primary-label.md) | `links.demo`/`links.primaryLabel` added; `links.article` is not a URL (OD-14)  |
| [0023](./ADR-0023-projects-draft-field.md)                 | `projectsSchema` gains `draft`, default `false` (OD-15)                        |
| [0024](./ADR-0024-projects-featured-field.md)              | `projectsSchema` gains `featured`, capped at three (OD-16)                     |
| [0025](./ADR-0025-now-panel-placeholder-endpoint.md)       | Now-panel placeholder endpoint and fallback wiring (OD-17)                     |
| [0026](./ADR-0026-visual-baselines-specimen-only.md)       | Visual baselines narrowed to `/dev/specimen`; real pages dropped               |
| [0027](./ADR-0027-lighthouse-budgets-relaxed.md)           | Lighthouse CI budgets relaxed to measured reality                              |
| [0028](./ADR-0028-featured-lead-figure-optional.md)        | Featured entry lead figure is optional, never a placeholder                    |
| [0029](./ADR-0029-deploy-pipeline.md)                      | Deploy: rsync releases + symlink swap into Dockerised Caddy                    |
| [0030](./ADR-0030-article-bundles.md)                      | Each article is a folder bundling its own images                               |

## Format

Each ADR states: **Decision**, **Reasoning** (2–4 sentences, pointing at
specific DESIGN_SYSTEM.md / IMPLEMENTATION_PLAN.md sections), and **Rules
out** (what this decision forecloses, so a future PR proposing the ruled-out
option can point back here instead of re-arguing it).

## Adding a new one

Next number is 0031. Follow the existing format. If a decision corrects an
earlier one, say so explicitly in the new ADR's Status line — don't silently
edit the old one, since the "why we changed our mind" is itself worth
keeping.
