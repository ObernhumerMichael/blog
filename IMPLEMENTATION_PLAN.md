# Implementation Plan — Ledger

Companion to `DESIGN_SYSTEM.md`. That document is authoritative for _appearance, structure and behaviour_; this one is authoritative for _how it gets built, in what order, and how compliance is proven_.

Section references like §2.5 refer to `DESIGN_SYSTEM.md`.

---

## Table of contents

1. [Architecture decisions (with corrections)](#1-architecture-decisions)
2. [Open decisions that need your call](#2-open-decisions)
3. [Repository structure](#3-repository-structure)
4. [The token layer](#4-the-token-layer)
5. [The CSS architecture](#5-the-css-architecture)
6. [The content model](#6-the-content-model)
7. [Code, figures and tables — the hard parts](#7-code-figures-and-tables)
8. [The enforcement system](#8-the-enforcement-system)
9. [Roadmap](#9-roadmap)
10. [Deployment](#10-deployment)
11. [Designed-in leeway](#11-designed-in-leeway)
12. [Extension protocol](#12-extension-protocol)

---

# 1. Architecture decisions

Each decision is stated with its reasoning and, where it overrides earlier advice, an explicit correction note.

## AD-01 · Astro, static output, no adapter — **confirmed**

Static site generation, `output: 'static'`, no SSR adapter.

Reasoning: §16.1 states loading does not exist and navigation is a document load; §17.4 states there are no page transitions. There is no dynamic surface anywhere in the system — no forms (§12), no comments, no auth. A server runtime would be capability you never exercise but must still secure, patch and monitor.

**Hard constraint that follows:** do **not** enable Astro's `ViewTransitions` / `ClientRouter`. It is the default reflex on a modern Astro build and it directly violates §17.4. Add a lint note so future-you doesn't switch it on.

## AD-02 · Plain CSS with custom properties — **corrects my earlier Tailwind recommendation**

I previously recommended Tailwind + `@tailwindcss/typography`. Having read the spec, that is the wrong tool here. Reasons, in order of weight:

1. **The type tokens are compound.** `--t-body` is _serif 400 / 18.5px / 1.72 / 0 tracking / `--c-text`_. §22.4 forbids introducing a size outside the scale. In utility form that token decomposes into four independent classes, and nothing stops a future edit from changing one of them — the token stops being a token. As a CSS custom property set applied by one rule, it stays atomic.
2. **The most important page cannot use utilities at all.** The article body is generated from Markdown. You cannot put classes on those `<p>` and `<h2>` elements. §10 is explicitly the reference implementation of the entire design, so the highest-value surface would be styled by a descendant stylesheet regardless — which is what plain CSS already is.
3. **`@tailwindcss/typography` would be near-totally overridden.** It ships its own scale, spacing, code styling, blockquote treatment and link colours; §10.3, §11, §13, §15 replace essentially all of it. You'd carry a dependency to fight it.
4. **The design's value is restriction, not expressiveness.** One border weight, one radius, no shadows, no card system, one accent with a budget of three. Tailwind's benefit is fast composition from a large vocabulary; this system's benefit is a deliberately tiny vocabulary. The tool and the goal point in opposite directions.
5. **oklch + wholesale theme override.** §24 states tokens are declared once and overridden wholesale in a single block, not per component. That is literally a two-rule CSS file. Nothing is gained by routing it through a config file first.

What you use instead: **`@layer` cascade layers, custom properties, container queries, `:has()`, and Astro's scoped `<style>` blocks.** All are baseline-available. No preprocessor, no CSS-in-JS, no framework. Add `lightningcss` (already Astro's default minifier path) for minification and syntax lowering.

Cost of this decision, stated honestly: you write more CSS by hand, and you lose Tailwind's built-in consistency pressure. §8 of this document replaces that pressure with lint rules that are actually stricter than Tailwind's.

## AD-03 · Two content collections, not three — **corrects my earlier recommendation**

I previously proposed `blog` / `ctf` / `projects`. The spec allows two.

§19 defines exactly seven page types; there is no CTF section. §7.1 defines three destinations (Writing, Projects, About). §19.9 states numbering is site-wide: articles 001–038 as one sequence. A separate CTF collection would need its own index page — an eighth page type — and would break the single monotonic article numbering that doubles as the permalink (§9).

**Correct model:** CTF writeups are articles in `writing` carrying `#ctf` or `#security` and a `section` of `Security`. §19.2's counted-tag filter row is already the browsing mechanism for exactly this. You lose nothing: `/writing` filtered by `#ctf` is the CTF index.

Collections:

| Collection | Type    | Contents                                                                    |
| ---------- | ------- | --------------------------------------------------------------------------- |
| `writing`  | content | All articles including CTF writeups                                         |
| `projects` | content | Project entries; `caseStudy: true` ones also render a detail page           |
| `site`     | data    | Experience rows, Elsewhere links, interests, nav counts, Now-panel fallback |

## AD-04 · Markdown + remark directives, MDX only by exception

Default `.md`. Callouts, figures and terminal blocks are authored as **remark container directives** (`:::note`, `:::figure`), not as imported components.

Reasoning: §6 closes the component inventory at twenty and §22.8 says a component used on one page doesn't belong in the system. MDX makes arbitrary component injection into prose a one-line action, which is precisely the pressure the inventory exists to resist. Directives keep content portable (they're plain text, they survive a future engine change) and mean the _renderer_ decides what a `:::note` looks like — one place, matching §10's callout spec.

Enable MDX as an integration but treat any `.mdx` file as requiring a written justification. Realistic legitimate case: an interactive island inside the evolutionary-SVG article.

## AD-05 · Shiki, single theme, seven roles — **refined**

§2.3 and E2: the code ground is identical in both themes. So you need **one** Shiki theme, not a dual-theme setup — a real simplification over the usual configuration.

You must author a custom Shiki theme JSON that maps TextMate scopes onto exactly the seven roles in §2.3 (comment, keyword/key, string, literal/boolean, number, function/identifier, plus the foreground), all held at 0.78–0.82 lightness. Do not use an off-the-shelf theme; every stock theme uses far more than seven colours and would silently violate §2.3.

Shiki emits `style="color:#..."` inline. Two consequences: (a) your CSS colour lint must exempt Shiki output, and (b) prefer Shiki's CSS-variables output mode so the palette lives in `tokens.css` with everything else. Use `@shikijs/transformers` for line highlighting and diff markers, plus a small rehype plugin for the chrome bar (§13.2).

## AD-06 · Diagrams as authored SVG, not Mermaid — **corrects my earlier recommendation**

I previously suggested Mermaid for flowcharts. Reconsidered:

- Mermaid renders rounded boxes, its own font stack, its own arrowheads and its own colour palette. §14.1 requires square corners, hairline frames and the publication's own type; §1.8 explicitly rejects anything that looks pasted in.
- §2.2 deviation 6 requires diagrams to dim to ~92% in dark mode while screenshots do not — a per-figure distinction Mermaid has no concept of.
- Re-theming Mermaid to satisfy §2.3 and §14.1 is more work than drawing the diagram, and it stays fragile across Mermaid versions.

**Instead:** author diagrams as SVG (Excalidraw export with a locked style, or by hand) and **inline** them, using `currentColor` and your CSS custom properties for strokes and fills. Inlined token-driven SVG themes itself automatically, stays crisp, is diffable in git, and needs no dimming hack because it's drawn in your palette to begin with.

Keep Mermaid available for throwaway thinking; don't ship it.

## AD-07 · Self-hosted variable fonts, subset, preloaded — **corrected against real font files**

Three families (§2.4), all libre and self-hostable. **Verified 2026-08-25** by pulling the actual files from `adobe-fonts/source-serif` and `IBM/plex` on GitHub and inspecting real `cmap`/`fvar` tables with fontTools — not assumed. Two corrections came out of that check; see `docs/reference/glyph-coverage.md` for the full table.

- Source Serif 4 — variable, confirmed `wght 200–900` / `opsz 8–60`, both Roman and Italic files. Matches the original assumption exactly. Ship the variable font, `font-optical-sizing: auto`, no static cuts.
- IBM Plex Sans — variable, confirmed `wght 100–700` (plus an unused `wdth 85–100` axis — ignore it, §2.4 only calls for 400/500/600 at normal width).
- **IBM Plex Mono — corrects the original plan.** I'd written "no variable release, ship two static cuts (400/500)." That was wrong: `IBM/plex`'s `plex-mono-variable` package ships a real variable font, `wght 100–700`, Roman and Italic, ~205 KB each. Ship the variable file instead of two static cuts — one file covers 400 and 500 (and any future weight need) at a comparable total size to two statics, with one fewer `@font-face` block to maintain.

**Real gap found, all three families:** `●` (U+25CF, status: live), `○` (U+25CB, status: archived), and `◐` (U+25D0, theme control) are absent from every font's cmap — Source Serif, Plex Sans, and Plex Mono alike. This is exactly the risk AD-07 flagged in advance, confirmed rather than hypothetical.

**Resolution, not a `unicode-range` fallback:**

- **Status dots (`●`/`○`)** — don't chase a fallback font for these. §2.9 already specifies them as a 6px, `radius: 50%` element, not running text — draw them as a plain `<span>` with `border-radius: 50%` and either a filled background (live) or a 1px border with transparent fill (archived). This is arguably _better_ than a font glyph even where one exists: exact 6px sizing independent of the font's em-box and baseline quirks, and zero risk of a fallback font rendering a visibly different dot size next to the live one.
- **Theme control (`◐`)** — no self-hosted font in the stack has it, and pulling in a symbol font for one character costs more (an extra font request, or a bigger subset) than a single small inline SVG half-circle using `currentColor`, sized to match the surrounding text. This is a deliberate, narrow exception to §2.11's "closed set of typographic glyphs" framing — flagged here explicitly rather than silently substituted, since it's a judgement call worth being able to revisit. It is **not** the icon-library pattern §1.12 forbids: one bespoke shape, not an imported set.

Subset to Latin + German (Ä Ö Ü ä ö ü ß, per OD-05) + the confirmed-present glyphs from §2.11 (`→ ↗ ← · / # + −`). `●`, `○`, `◐` are excluded from the subset entirely since they're never rendered as font glyphs.

Preload the three faces used above the fold (serif Roman 400, sans 600, mono Roman 400). Give every `@font-face` a metric-matched fallback (`size-adjust`, `ascent-override`) against Georgia / system-ui / monospace so `font-display: swap` doesn't reflow the measure.

## AD-08 · No search in v1 — **corrects my earlier Pagefind recommendation**

See §2 below; this is genuinely a conflict between your two source documents and needs your decision. My recommendation is to ship without it.

## AD-09 · No comments — **corrects my earlier giscus suggestion**

§12: no form system. §18 (footer): no newsletter box, no social row, no widgets. The reply path is already specified — `reply by email ↗` in the article aside (§10.8). giscus is out.

## AD-10 · Permalinks

§9 states the article number _is_ the permalink: `/w/038`. Take it. It's unusual, it's stable forever, and it matches the numbering invariant in §19.9.

Add a slug alias `/writing/<slug>` issuing a 301 to `/w/<num>`, so shared links stay human-readable and SEO doesn't suffer from opaque URLs. Canonical tag always points at `/w/<num>`.

Routes: `/`, `/writing`, `/writing/tag/<tag>`, `/w/<num>`, `/projects`, `/projects/<slug>`, `/about`, `/404`, `/rss.xml`, `/sitemap.xml`.

## AD-11 · Islands: three, all vanilla, all tiny

No UI framework. Three pieces of client JS, total budget < 4 KB:

| Island                   | Job                                                                          | Notes                                                             |
| ------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Theme (inline, blocking) | Read stored preference, set `data-theme` before first paint                  | §2.2 requires no flash. Must be inline in `<head>`, not a module. |
| TOC + progress           | IntersectionObserver → active TOC item (§15) and `read n%` / 2px bar (§10.8) | No smooth scroll, no transition on the active state (§15)         |
| Copy control             | Clipboard write, label swap to `copied` for 1.2s, `aria-live="polite"`       | §13.2 — a text change, not a toast                                |

The mobile menu and the TOC disclosure are native `<details>` (§7.5, §12.1) — no JS at all, which is also why §7.5 can say "no focus trap to get wrong."

## AD-12 · Live "Now" panel data

§19.1's Now panel carries live facts (`homelab uptime 214 d`, `11 services ok`, `last deploy 2026-08-19`).

Build-time fetch from a tiny JSON endpoint on your VPS, with a committed fallback file used if the fetch fails or times out (2s). A nightly scheduled GitHub Actions rebuild keeps it current. Never fetch at runtime — that would be the only network dependency on an otherwise fully static page, and it would fail visibly in the masthead band.

This is also a good article in itself, and it exercises the homelab/Ansible work you already want to write about.

## AD-13 · Analytics

Self-hosted Umami on your VPS, cookieless. No consent banner is needed for cookieless first-party analytics, which matters because a banner is a UI element the design has no slot for. Alternative if you'd rather run nothing: Caddy access logs + GoAccess, zero client JS.

---

# 2. Open decisions

**All five resolved, 2026-08-25.**

| #     | Resolution                                                                  | Consequences                                                                                                                                                                                        |
| ----- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OD-01 | **No search in v1.**                                                        | Pagefind dropped. Tag filter row + archive-by-year + find-in-page. Revisit ~80 articles.                                                                                                            |
| OD-02 | **CTF is a tag, not a section.**                                            | Two collections. `section: Security`, tags `#ctf` / `#security` in the registry. Nav stays at three destinations.                                                                                   |
| OD-03 | **Numbering starts at 001.**                                                | Contiguity invariant enforceable from day one (drafts exempt — see §6). Counts read small and honest.                                                                                               |
| OD-04 | **Industrial platform gets a case study, no code and no proprietary data.** | See §7.5. Leans on the Decision/Alternative/Why table and a redrawn architecture diagram; §10.10 explicitly permits an image-free article. Requires a written publication boundary before drafting. |
| OD-05 | **German plausible later, not initially.**                                  | Cheap preparations taken at Phase 1 and 5 (§11). Full i18n routing deferred.                                                                                                                        |

The original framing of each decision follows, for the record.

**Two more surfaced while planning Phase 0** — not architectural, but blocking:

| #     | Decision                                                           | Status                                                                                                     |
| ----- | ------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| OD-06 | Code license (content stays proprietary regardless)                | Recommendation: MIT for code, © all rights reserved for prose/images — confirm before first content commit |
| OD-07 | Domain / `site` URL for Astro config, RSS, sitemap, canonical tags | Placeholder acceptable for Phase 0 exit; must resolve before Phase 5 (RSS)                                 |

### OD-01 · Search — **conflict between your two documents**

Your content brief §11 lists Search as a blog UI requirement. `DESIGN_SYSTEM.md` §12 states: _"There is no search field"_, and §25.5 lists "no search" among deliberate absences confirmed by audit.

The design system is the later, more specific document, and its own reconciliation rule (§25.4) is that the later and more specific source wins.

**Recommendation: ship without search.** At 38 articles, the counted-tag filter row (§19.2) plus archive-by-year plus browser find-in-page covers navigation. Revisit past ~80 articles.

If you decide you want it: Pagefind still works, but the UI must be _derived_, not invented — §12.2 already gives you the field, label, focus and error rules. It would be a new component (#21) and would follow the extension protocol in §12 of this document.

### OD-02 · CTF as a tag — confirm

Per AD-03. Confirm you're happy that CTF writeups live in `/writing` under `#ctf` rather than getting their own section. If you want a separate top-level section, that is an eighth page type and a fourth nav destination — permitted (§21.1 allows four destinations) but it breaks the site-wide single article numbering, so it needs a deliberate decision now, not later.

### OD-03 · Starting article numbers

The spec is written around a mature site (038 articles, 6 projects). You'll launch with maybe 3. Two options:

- **Start at 001 and let the site be visibly young.** Honest, matches the "engineer's notebook" positioning, and every count in the design (`Writing 3`, `Latest writing / 3 total`) simply reads small.
- Backfill numbering to fake maturity — **don't**. Your content brief explicitly forbids inventing metrics, and the numbers are permalinks.

Recommendation: start at 001. Design a launch content minimum instead (see Phase 8).

### OD-04 · Project detail pages for professional work

The industrial testing platform is your strongest professional project but has confidentiality constraints. Decide up front whether it gets a full case study (§11.2) or only a projects-index entry with `client work · no source` (§11.1, already specified for exactly this case). Deciding late means writing content you then can't publish.

### OD-05 · German content

If a German version is ever plausible, say so now. It costs almost nothing to structure for it at Phase 4 (collection paths, `lang` attribute, hreflang) and is expensive to retrofit once 30 articles exist. Default assumption if you don't answer: English only.

---

# 3. Repository structure

Revised from my earlier proposal to match AD-03 and the actual page inventory.

```
.
├── DESIGN_SYSTEM.md              # authoritative design spec
├── IMPLEMENTATION_PLAN.md        # this file
├── docs/
│   ├── decisions/                # ADR-0001-*.md, one per architectural decision
│   └── reference/                # design screenshots at 1320/900/390 × light/dark
│
├── src/
│   ├── content/
│   │   ├── config.ts             # Zod schemas + cross-entry invariants
│   │   ├── writing/
│   │   │   ├── 001-reproducible-homelab.md
│   │   │   └── 004-evolutionary-svg/
│   │   │       ├── index.md
│   │   │       ├── fitness-curve.svg
│   │   │       └── generation-400.png
│   │   ├── projects/
│   │   └── site/                 # experience.yaml, elsewhere.yaml, now.fallback.json
│   │
│   ├── styles/
│   │   ├── tokens.css            # §2 — both themes, wholesale override
│   │   ├── reset.css
│   │   ├── base.css              # element defaults, focus token, motion tokens
│   │   ├── layout.css            # frame, the three column structures, bands
│   │   ├── prose.css             # §10.3 article body
│   │   └── code.css              # §13 + Shiki variable bindings
│   │
│   ├── components/
│   │   ├── chrome/               # Masthead, Nav, MenuPanel, Footer, ThemeControl
│   │   ├── article/              # Toc, MetadataRow, Breadcrumb, Callout, Quote,
│   │   │                         #   Figure, Caption, CodeBlock, TerminalBlock,
│   │   │                         #   Table, Footnotes, AuthorBlock, PrevNext, Related
│   │   ├── list/                 # WritingRow, FeaturedEntry, ProjectItem, ExperienceRow
│   │   └── ui/                   # Button, TextLink, Tag, StatusDot, Disclosure
│   │
│   ├── layouts/
│   │   ├── Base.astro            # frame, masthead, footer, head
│   │   ├── Banded.astro          # layout B (§5.2) — home, indexes, about, 404
│   │   └── Instrumented.astro    # layout A (§5.2) — article, project detail
│   │
│   ├── pages/
│   │   ├── index.astro
│   │   ├── writing/index.astro
│   │   ├── writing/tag/[tag].astro
│   │   ├── writing/[slug].astro          # 301 → /w/[num]
│   │   ├── w/[num].astro
│   │   ├── projects/index.astro
│   │   ├── projects/[slug].astro
│   │   ├── about.astro
│   │   ├── 404.astro
│   │   ├── rss.xml.ts
│   │   └── _dev/                          # gallery + fixtures, excluded from prod build
│   │       ├── gallery.astro
│   │       └── fixtures/
│   │
│   ├── lib/
│   │   ├── numbering.ts          # zero-pad, uniqueness, permalink construction
│   │   ├── reading-time.ts       # §9 — always paired with word count
│   │   ├── related.ts            # tag + section overlap
│   │   ├── toc.ts                # heading extraction; returns null below three h2s (§15)
│   │   └── now.ts                # build-time fetch + fallback (AD-12)
│   │
│   ├── plugins/
│   │   ├── remark-directives.ts  # :::note :::warning :::correction :::figure
│   │   ├── remark-heading-depth.ts   # fails the build on h4 (§21.3)
│   │   ├── rehype-code-chrome.ts     # §13.2 filename bar, line numbers >12, copy
│   │   └── shiki-ledger-theme.json   # §2.3, seven roles
│   │
│   └── consts.ts
│
├── tests/
│   ├── invariants/               # node:test — schema and cross-entry rules
│   ├── e2e/                      # Playwright — DOM assertions, a11y, screenshots
│   └── baselines/                # committed screenshot baselines
│
├── ansible/
├── .github/workflows/
├── .stylelintrc.json
├── lighthouserc.json
├── astro.config.mjs
└── package.json
```

Two structural notes worth stating:

**`_dev/` is excluded from the production build** (leading underscore = not routed by Astro, plus an explicit build-time guard). The gallery and the twelve edge-case fixtures need to be buildable and testable but must never ship. They're the backbone of §8.

**`docs/decisions/`** holds one short ADR per decision above. Not ceremony — in eighteen months you will not remember why Tailwind was rejected, and the design system doesn't record implementation reasoning by design (§24).

---

# 4. The token layer

`tokens.css` is the single most important file in the repo. Rules for it:

1. **It is the only file allowed to contain a colour literal.** Enforced by lint (§8, T2).
2. **Light is the default; dark is one wholesale override block** (§24.1). Structure:

```
:root { /* every token, light values */ }
:root[data-theme="dark"] { /* every overridden token */ }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* same dark block, via a shared custom-property set */ }
}
```

Author the dark values once and reference them from both selectors, so the two can't drift.

1. **Compound type tokens are custom-property bundles, not single values.** Each `--t-*` step declares family, size, line-height, tracking and weight together, applied by one rule. This keeps §2.5's tokens atomic and makes §22.4 enforceable.

2. **Responsive type (§3.4) lives in the token file, not in components.** Redeclare the `--t-*` sizes at the two breakpoints in `tokens.css`. A component never contains a media query about type. This is what makes "spacing shrinks by exactly one step per breakpoint" (§3.3) auditable in one place.

3. **Every token exists in both themes.** Exceptions are explicit and commented: `--c-text-prose` and `--c-rule-2`, per §25.4. A script asserts parity and whitelists those two.

4. **The 44px grid gap is named `--grid-gap` and carries a comment pointing at E1**, so nobody later "fixes" it to 40 to match the scale.

---

# 5. The CSS architecture

Cascade layers, declared once in this order:

```
@layer tokens, reset, base, layout, components, exceptions;
```

- **tokens** — `tokens.css` only.
- **reset** — minimal; do not use a heavy reset that re-styles lists and tables, since §10.4 explicitly wants browser list markers.
- **base** — element defaults, the focus token (§2.13), the global reduced-motion override (§17.5), `:target` scroll offset for the sticky masthead.
- **layout** — the frame (§5.1) and exactly the three column structures (§5.2), as three classes. Nothing else may declare a page-level grid; this is lintable.
- **components** — mostly Astro scoped `<style>`; global only for `prose.css` and `code.css`, which style Markdown output.
- **exceptions** — the fifteen registered exceptions from §23.2 that need CSS, each with a comment naming its E-number. Putting them in their own layer means `git log` on one layer tells you every time an exception was touched.

**Container queries.** E6 requires figures, code and tables to consult their container (< 700), not the viewport. Put `container-type: inline-size` on the article body wrapper and write those three components' breakpoint against `@container`. This is the only place `@container` appears; everywhere else uses the two named breakpoints.

**Motion.** One duration pair and one curve as tokens (§2.12), with a global `prefers-reduced-motion` block collapsing them to `0s`. Because the tokens are the only durations in the codebase, that override is genuinely global — which is what §17.5 asserts.

---

# 6. The content model

`writing` frontmatter:

| Field      | Type                 | Validation                                                      |
| ---------- | -------------------- | --------------------------------------------------------------- |
| `number`   | int 1–999            | Unique across collection; rendered zero-padded (§9)             |
| `title`    | string               | Warn > 90 chars (triggers E5), never fails                      |
| `lead`     | string               | **Must not contain a blank line** — §21.1: never two paragraphs |
| `section`  | enum                 | Gutter label + breadcrumb segment (§10.2)                       |
| `date`     | date                 | ISO 8601 (§21.2)                                                |
| `updated`  | date?                | Must be > `date` + 1 day, else rejected (§9)                    |
| `tags`     | string[]             | 1–3, lowercase, no `#` in source (§21.2)                        |
| `series`   | `{id, part, total}`? | `part <= total`; drives §17 pagination                          |
| `featured` | bool?                | At most one `true` across the collection                        |
| `draft`    | bool                 | Excluded from prod build and from counts                        |

Derived at build, never authored: `readingTime`, `wordCount` (§9 requires them paired), `toc` (null below three `h2`s, §15), `parts` (auto-split above 8,000 words, E14 — or at minimum a build **warning** telling you to split it manually).

`projects` frontmatter: `number` (1–99, unique), `title`, `description` (≤ 58ch guidance), `why?`, `stack[]` (3–6, §21.1), `status` (enum of exactly four, §21.2), `period {from, to|null}`, `caseStudy` bool, `links {article?, source? }`, `sourceAbsence?` (string, e.g. `client work · no source` — §11.1 requires absence to be _stated_, so this field is required when `source` is missing).

**Cross-entry invariants** (run as tests, fail the build):

1. Article numbers unique and contiguous from 001 — a gap means a deleted permalink.
2. At most one `featured: true` per collection.
3. Every `series.id` has entries covering 1…`total` with no duplicates.
4. Every tag used appears in the tag registry in `consts.ts` (prevents `#linux` / `#Linux` drift, and the counted-tag row in §19.2 depends on stable tags).
5. Every internal link in prose resolves to a real route.
6. No article has an `h4` (§21.3) — enforced by the remark plugin.
7. Every content image has non-empty alt text (§18.6: decorative images do not exist).

---

# 7. Code, figures and tables

These three are where implementations of this design fail, because all three carry rules that no default tooling produces.

## 7.1 Code block (§13.2)

Authored as fenced code with meta:

    ```yaml title="roles/monitoring/templates/prometheus.yml.j2" {14-16}
    ```

The rehype plugin must produce:

- Chrome bar with the **full repo-relative path** (§13.2 — not the basename), language token, copy control.
- Line-number track **only above twelve lines** (§13.2, and §25.4 confirms the rule is normative even though demo frames show otherwise).
- At `<760`: numbers pinned **outside** the scroll container (§13.5) — this is a two-track grid, not `position: sticky`, or line 4 stops being line 4 at column 60.
- Highlight = tint spanning the full scroll width **plus** a 2px inset bar on the line (§13.2, §18.4).
- Full-bleed with radius dropped below 760 (§2.9, §13.5).
- Filename truncates with ellipsis; code never does (E8).

## 7.2 Terminal block (§13.3)

A **separate component**, not a variant — §23.4 documents the confusion risk explicitly. Different ground, uppercase host label instead of a filename, `$` prompt in accent, **no line numbers, no copy control**, identical at every width. Trigger it with a distinct fence language (` ```terminal host="pi-02" `).

## 7.3 Figure (§14)

The directive takes a `kind` of `diagram | screenshot | photo`, because §2.2 deviation 6 and E15 require dark mode to dim diagrams and photos to ~92% but leave screenshots untouched. This cannot be inferred; it must be authored.

Also: caption stays inside the 20px text margin while the figure goes full-bleed (§5.5, §14.3). That single rule is, per the spec, what keeps a full-bleed block attached to the article — implement it as caption-outside-the-bleed-wrapper, not as padding on the figure.

## 7.4 The constrained case study (OD-04)

A case study with no code and no screenshots is not a degraded case study in this design — §10.10 states an image-free article is normal and that nothing is inserted to compensate. But §11.2's canonical section sequence assumes both, so the substitutions must be deliberate:

| §11.2 section        | Normally                           | Here                                                                                       |
| -------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------ |
| Problem & motivation | Prose                              | Prose — the domain problem, stated generically                                             |
| Architecture         | Prose + one architecture diagram   | A **redrawn, anonymised** diagram: component roles, not systems, names or vendors          |
| Implementation       | Prose + screenshots                | Prose only. No `--c-sunken` screenshot frames on this page                                 |
| Technical decisions  | Decision / Alternative / Why table | **This carries the page.** It needs no proprietary detail at all — it is pure reasoning    |
| Results & lessons    | Measured numbers + buttons         | Qualitative lessons; `source ↗` button omitted, `client work · no source` stated per §11.1 |

Before drafting: write a one-page publication boundary listing what may and may not appear (no customer names, no measurement values, no schema, no internal service names, no screenshots, no code), and get it acknowledged by your employer in writing. Do this at Phase 0, not at Phase 10 — the alternative is writing something good that you then cannot publish.

## 7.5 Table (§15)

Markdown tables must be wrapped by a rehype plugin into a scroll region with: sticky first column, edge fade, and a `scroll →` marker on the caption line that flips to `← scroll` at the end. The region must be **focusable and arrow-scrollable** (§15.2, §18.2 — the commonly-missed part) and labelled by its caption.

Never reflow to cards (§3.2 law 03, §15.2). No hover state on data rows (§15.1) — worth stating in the component because index rows _do_ have one and they look identical.

---

# 8. The enforcement system

This is what replaces "eyeball it against a screenshot." Five tiers, cheapest first, all wired into `npm run verify` and CI.

## T1 · Schema and content invariants — build fails

`content/config.ts` Zod schemas plus `tests/invariants/`. Covers §6 above. Runs in under a second; catches the majority of real-world content mistakes.

## T2 · CSS lint — build fails

Stylelint with a deliberately harsh config:

| Rule                                                                   | Enforces                                        |
| ---------------------------------------------------------------------- | ----------------------------------------------- |
| No colour literals outside `tokens.css` (hex, rgb, hsl, oklch, named)  | §2 "no component may introduce a literal value" |
| `box-shadow` disallowed everywhere                                     | §2.10, §1.12                                    |
| `border-width` allowed list: `1px`, `2px`, `0`                         | §2.8                                            |
| `border-radius` allowed list: `0`, `3px`, `4px`, `50%`, `0 4px 4px 0`  | §2.9                                            |
| `transition-duration` / `animation-duration` ≤ `200ms`                 | §17.3 ceiling                                   |
| `transition-timing-function` must be `var(--ease)`                     | §17.3 one curve                                 |
| `font-family` only via `var(--font-*)`                                 | §2.4                                            |
| `outline: none` disallowed unless followed by a replacement            | §18.2                                           |
| Media queries only at `760px` / `1100px`; `@container` only at `700px` | §4.1, §4.2, §22.13                              |
| `text-transform: uppercase` only in a `--t-label` context              | §2.5 typographic laws                           |
| Property allowed-list for `transition-property`                        | §17.1 exhaustive list                           |

Plus a small custom script asserting: every `var(--…)` used is defined; light and dark token sets have parity; no `@layer` other than the six declared.

## T3 · DOM assertions — CI fails

Playwright, headless, across the **matrix that matters**: 7 page types × 3 widths (390 / 900 / 1320) × 2 themes = 42 renders, plus the fixtures from T4.

Assertions, all mechanical:

1. **No horizontal page scroll** — `documentElement.scrollWidth <= clientWidth`. §10.11 states this absolutely; it's the single highest-value automated check in the whole system.
2. **Type floors** — no computed `font-size` below 10.5px; body ≥ 17px at 390; code ≥ 12.5px; metadata ≥ 11.5px (§3.4, §18.5).
3. **Measure** — every prose block's content box ≤ 680px (§22.10).
4. **Touch targets** — every interactive element's bounding box ≥ 44px at 390; index/menu rows ≥ 48px (§18.5).
5. **Focus ring** — tab through every focusable element; assert a visible outline with the accent colour and 2px offset (§18.2).
6. **No shadows in the rendered DOM** — computed `box-shadow` is `none` on every element (catches third-party CSS, which lint can't see).
7. **One `h1` per page; no `h4`; no skipped levels** (§18.3).
8. **Contrast** — axe-core, plus a direct assertion that the computed body/secondary/muted/accent ratios match the values documented in §18.1.
9. **Scroll regions are focusable** — every code block and table region is tabbable and arrow-scrollable (§18.2).
10. **Reduced motion** — with `prefers-reduced-motion: reduce`, all computed transition durations are `0s` (§17.5).

## T4 · Edge-case fixtures — the spec's own stress tests

§25.6 lists twelve content stress tests the design was verified against. Commit them as draft fixtures under `_dev/fixtures/` and run T3 against every one:

148-character title · 8 tags · 210-character code line · 7-column table · 90-word article · 9,400-word / 34-section article · 3840×2160 screenshot · image-free article · four consecutive code blocks · long URL in prose · long caption · project with no source.

This is the highest-leverage part of the whole enforcement system, because these are exactly the cases real content will hit and exactly the cases you won't think to check by hand.

## T5 · Visual regression and performance

- **Screenshot baselines** for the 42-render matrix, committed. Threshold ~0.1%. Any intentional design change updates baselines in the same commit — so design drift becomes a reviewable diff instead of an accumulation.
- **The gallery page** (`_dev/gallery.astro`) renders all twenty components in every state (default / hover / focus / active / disabled / current) in both themes. Force states via CSS classes so screenshots capture them deterministically.
- **Lighthouse CI** budgets: performance ≥ 98, a11y = 100, JS ≤ 5 KB, CLS ≤ 0.01, LCP ≤ 1.2s. The JS budget is what keeps AD-11 honest over time.
- **`lychee`** link check on the built output.

## What stays manual

Three things are judgment, not assertion, and belong on a written pre-merge checklist:

1. **Accent budget** — at most three accented elements per viewport (§1.6, §22.21).
2. **Box-or-rule test** — §9.2, applied to any new bounded container.
3. **Does the band do work?** — §5.6: a page is finished when every band is doing work.

---

# 9. Roadmap

Ten phases. Each has an exit criterion; don't start the next until it's met. The ordering follows one principle from the spec: **§19.3 says the article page is the reference implementation and every other page is a reduction of it** — so the article is built early, not last, and the index pages are derived from it.

### Phase 0 · Decisions and skeleton _(1 day, revised from half-day — OD-04's publication boundary and the font risk check add real time)_

Five sub-phases, in dependency order. Nothing in 0.2 onward should start before 0.1 is done, since it fixes the tools everything else assumes.

#### 0.1 · Repository and tooling bootstrap

1. **Package manager: pnpm.** Reasoning: strict, non-hoisted `node_modules` catches phantom dependencies (a package used but not declared) at install time rather than as a mystery production build failure — the same category of error T1–T5 exist to catch in content and CSS, so it's consistent to catch it in dependencies too. Cost: one more tool than npm; acceptable given the project already runs `pnpm`-agnostic CI images fine.
2. **Node version: pin to the current Active LTS via `.nvmrc` / `"engines"` in `package.json`.** Verify the actual current LTS at nodejs.org rather than trusting a remembered number — don't guess.
3. `git init`, initial commit with just `.gitignore`, `.editorconfig`, `README.md` (placeholder), `LICENSE`.
4. **License — open micro-decision, OD-06.** Recommendation: a `LICENSE` covering code only (MIT is the sane default for a portfolio — it signals "read this, learn from it" without obligation) plus an explicit line in the README stating article prose and images are © Michael Obernhumer, all rights reserved, unless a post says otherwise. Reasoning: your content brief is about demonstrating engineering judgement through writing — that's worth protecting from wholesale republishing — while the _code_ being copyable is free advertising and costs you nothing. Confirm or override before the first commit that adds real content.
5. `.editorconfig` (LF, UTF-8, 2-space indent, trim trailing whitespace) and Prettier for `.astro` / `.css` / `.md` / `.json` (not JS-only — you want Markdown and CSS formatted consistently too). This is a code-hygiene decision, unrelated to the design system; it exists to keep diffs small when you're the only reviewer.

**Exit:** `pnpm -v` and `node -v` match what's pinned; repo has one clean initial commit.

#### 0.2 · Astro scaffold

1. `pnpm create astro@latest` — choose the empty/minimal template, TypeScript strict.
2. `astro.config.mjs`: `output: 'static'`, `trailingSlash: 'never'` (matches the `/w/038` permalink style with no trailing slash), `site:` — **blocked on a real decision, OD-07 below**.
3. `tsconfig.json` extends `astro/tsconfigs/strict`.
4. Stub the full folder tree from §3 of this plan — every directory gets a `.gitkeep` or a one-line placeholder file, even ones with nothing in them yet (`src/content/site/`, `src/plugins/`, `tests/invariants/`). Reasoning: deciding the shape now, empty, is cheap; discovering halfway through Phase 3 that a directory should exist and retrofitting file locations is not.
5. **A CI workflow that does nothing but build**, before there's anything else to check: push → `pnpm install` → `astro build`. This is deliberately trivial — it exists so that from commit two onward, a broken scaffold is caught in two minutes instead of at Phase 1 when you're deep in token work and can't tell if a red build is your CSS or a rotten scaffold.

**Open decision — OD-07 · Domain / site URL.** Astro's `site` config value feeds canonical URLs, the sitemap, and RSS `<link>` tags — it has to be real before Phase 5 (RSS) and ideally set now so it's never a find-and-replace later. It's also what AD-12's Now-panel endpoint and AD-13's analytics will live under (a subdomain, most likely). If you don't have the domain yet, use a placeholder (`https://example.invalid`) checked in as a constant in exactly one place (`src/consts.ts`), so switching it later is a one-line change, not a grep-and-replace.

**Exit:** `astro build` produces an empty static site; CI is green on a trivial push; every directory in §3 exists.

#### 0.3 · Design reference capture

1. Export from Claude Design at the **six-combination matrix**: 390 / 900 / 1320 × light / dark, for all seven page types (home, writing index, article, projects index, project detail, about, 404) — 42 images.
2. Fixed naming convention, since T5's screenshot baselines will eventually compare against these: `docs/reference/<page-slug>/<width>-<theme>.png`, e.g. `docs/reference/article/1320-light.png`.
3. Also pull the **twenty-component gallery** if Claude Design has one rendered — this seeds `_dev/gallery.astro` in Phase 7 and saves re-deriving component states from the spec text alone.

Reasoning this is a Phase 0 blocker and not a "do it whenever" task: every visual judgement call from Phase 1 onward (including the ones already flagged as provisional in `tokens.css`) gets resolved by looking at these, not by re-opening Claude Design each time. Get them once, get them complete.

**Exit:** 42 images committed under `docs/reference/`, named consistently; the two provisional tokens (`--c-accent-hi` dark, `--c-nav` dark) checked against them and corrected if needed.

#### 0.4 · Font risk check

Do this before subsetting (Phase 1), because it changes what Phase 1 has to build.

1. Obtain the actual font files: Source Serif 4 (Adobe Fonts GitHub release), IBM Plex Sans and IBM Plex Mono (IBM's GitHub releases) — not Google Fonts' repackaged versions, which sometimes lag or trim tables.
2. Check `cmap` coverage for the closed glyph set in §2.11: `→ ↗ ← · ● ○ ◐ + −` plus standard Latin, using `fontTools`' `ttLib` (`pip install fonttools`, then inspect `TTFont['cmap']`). Do this for all three families, both because a component might use any of them for a glyph and because a mismatch between "the arrow renders in mono but not in sans" is worse than either family lacking it outright.
3. `◐` (U+25D0) is the one to bet against — verify it explicitly, don't assume.
4. Write the result to `docs/reference/glyph-coverage.md`: a table of glyph × family × present/absent. If anything is missing, the Phase 1 fix is a narrow `@font-face` with `unicode-range` scoped to just that code point, pointing at a fallback family — not an SVG icon (§1.12 forbids icon fonts/libraries, and a missing-glyph icon substitute would be exactly that in disguise).

**Exit:** `glyph-coverage.md` exists and is complete; Phase 1's font work has a yes/no answer for every glyph instead of discovering gaps mid-subsetting.

#### 0.5 · Governance documents — **complete, 2026-08-25**

1. **ADRs for AD-01 through AD-13, plus AD-07a**, committed under `docs/decisions/`, indexed in `docs/decisions/README.md`. Two of the fourteen record real corrections found during Phase 0 execution rather than hypothetical ones: ADR-0002/0003/0006 correct assumptions made before `DESIGN_SYSTEM.md` existed; ADR-0007 and ADR-0007a record the Plex Mono variable-font discovery and the three-missing-glyph resolution found in 0.4.
2. **OD log** — the table in §2 of this plan, kept current as decisions resolve.
3. **Publication boundary for OD-04** — drafted and sent for acknowledgement (§7.4 below); not yet countersigned, tracked as the one open item carried past Phase 0's own exit.

---

**Phase 0 overall exit criteria:**

- `astro build` succeeds in CI on every push.
- 42 reference screenshots + component gallery committed under `docs/reference/`.
- `glyph-coverage.md` complete, no open questions.
- 13 ADRs committed.
- OD-06 (license) and OD-07 (domain) resolved or explicitly deferred with a placeholder.
- Publication boundary document sent.

### Phase 1 · Token layer and theme _(1–1.5 days — revised up from 1 day: real font subsetting and metric-matching are measurement work, not typing)_

Six sub-phases. Two things already exist from work done ahead of schedule during Phase 0 and get _finished_, not started, here: `tokens.css` (drafted, two values still provisional) and the real font files (pulled and glyph-checked in 0.4, not yet subset or self-hosted). Order matters because 1.3 depends on 1.1's actual output filenames, and 1.6 depends on 1.2–1.4 existing to have something to lint.

#### 1.1 · Font subsetting

1. Subset the six variable files from 0.4 (Source Serif Roman/Italic, Plex Sans Roman/Italic, Plex Mono Roman/Italic) with `fonttools`' `pyftsubset`, to: Latin + German (Ä Ö Ü ä ö ü ß, per OD-05) + the confirmed-present glyphs from §2.11 (`→ ↗ ← · / # + −`).
2. **Do not include `●` `○` `◐` in the subset request at all** — per ADR-0007a they're never rendered as font glyphs (CSS-drawn dot, inline SVG half-circle instead), so there's nothing to subset and no `unicode-range` fallback font is needed. This is a real simplification the 0.4 finding bought: the original plan assumed a fallback-font mechanism for missing glyphs; it turned out not to be necessary at all.
3. **Preserve variable tables explicitly.** `pyftsubset` can silently drop `fvar`/`gvar`/`avar` if invoked carelessly (some flag combinations implicitly instance the font down to a static weight). Verify after subsetting — not before — by re-running the same fontTools `fvar`-axis check from 0.4 against the _subset_ output, not just the source file. A subsetting step that quietly flattens the variable axis is a real, easy-to-miss failure mode and the whole reason §2.4's optical-size behavior exists.
4. Output `.woff2` (universal support at this point, best compression — no `.woff` fallback needed).
5. Record before/after byte sizes in `docs/reference/glyph-coverage.md` (append a subsetting-results section rather than a new file, since it's the natural continuation of that document).

**Exit:** six `.woff2` files in `public/fonts/`; fontTools confirms `fvar` intact on every one; sizes recorded.

#### 1.2 · Metric-matched fallback fonts

1. Extract real vertical metrics (`hhea.ascender`, `hhea.descender`, `hhea.lineGap`, `unitsPerEm`, and cap-height/x-height from `OS/2`) from each of the six subset files via fontTools — not estimated.
2. Compute `size-adjust`, `ascent-override`, `descent-override`, `line-gap-override` for three `@font-face` fallback blocks: `"Source Serif 4 Fallback"` matched against Georgia, `"IBM Plex Sans Fallback"` against the `system-ui` stack, `"IBM Plex Mono Fallback"` against a generic monospace stack. This is what `tokens.css`'s font stacks already assume exist (`var(--font-serif)` lists the Fallback name second) — they're referenced but not yet defined.
3. Verify by throttling network in a browser and confirming the fallback-to-real-font swap doesn't visibly reflow — this is the actual point of doing the metric math, so check it, don't just trust the arithmetic.

**Exit:** three fallback `@font-face` blocks in `src/styles/tokens.css` (or a new `src/styles/fonts.css` — see 1.3), with a code comment recording the source metrics used, so a future font swap knows what to recompute.

#### 1.3 · Finish `tokens.css`, resolve the provisional values

1. Split font-loading concerns (the six real `@font-face` blocks, the three fallback blocks, `font-display: swap`, preload hints for the three above-the-fold faces) into `src/styles/fonts.css`, separate from `tokens.css`'s custom-property declarations — they're different kinds of change (a font swap vs. a design-token edit) and shouldn't sit in one file.
2. **Resolve the two `!! PROVISIONAL !!` tokens** (`--c-accent-hi` dark, `--c-nav` dark) against the reference screenshots captured in 0.3. This needs you specifically — either point me at the relevant dark-mode article/masthead screenshot filenames from `docs/reference/`, or read the accent-hover and nav-link states off them yourself and give me the two oklch values. Don't let this stay guessed-and-flagged past Phase 1; it's exactly the kind of small thing that's cheap to fix now and annoying to notice later.
3. Confirm `light-dark()` resolution once more against real content, not just the token file in isolation — this is what 1.7's specimen page is for.

**Exit:** no `!! PROVISIONAL !!` markers remain in `tokens.css`; `fonts.css` exists and is imported once, from `base.css`.

#### 1.4 · `reset.css` and `base.css`

1. `reset.css` — deliberately minimal. Box-sizing border-box, margin reset on a short list of elements, but **do not reset list-style or table default spacing** — §10.4 wants real browser list markers, and an aggressive reset (Tailwind's preflight, `modern-normalize`'s list handling, etc.) fights that later. Write this one by hand rather than importing a package, specifically so it can't accidentally undo a design requirement you'd have to notice and patch.
2. `base.css` — the focus token as one universal rule (`:focus-visible { outline: var(--focus-w) solid var(--focus-color); outline-offset: var(--focus-offset); }`, §2.13); the global `prefers-reduced-motion: reduce` override collapsing `--dur`/`--dur-layout` to `0s` (§17.5) — since every duration in the codebase is required to reference these two tokens (T2 lints for it), this single override is genuinely global, which is the point; `scroll-margin-top: var(--masthead-h)` on heading anchors, so the sticky masthead (built in Phase 2) doesn't cover a `:target` heading when someone follows a TOC or footnote link.

**Exit:** tabbing through the empty specimen page shows one consistent focus ring; toggling reduced-motion in OS settings collapses a test transition to instant.

#### 1.5 · Inline theme resolver

1. Write the theme-detection/persistence script as its own file (`src/lib/theme-init.ts`, compiled to a tiny inline string, or authored directly as a template literal) — logic only, no DOM beyond setting `data-theme` and reading/writing one `localStorage` key. Keep it pure enough to unit-test.
2. It doesn't get _embedded_ until `BaseLayout.astro` exists in Phase 2 (the `<head>` this script lives in isn't built yet) — so 1.5's deliverable here is the script itself plus a throwaway inline `<script>` on the specimen page that calls it, just to prove the no-flash behavior works before the real layout exists to host it properly.

**Exit:** on the specimen page, a manual toggle switches instantly with no flash on reload, in both an explicit-choice and OS-preference state.

#### 1.6 · Stylelint (T2) — brought forward from Phase 8, per the original plan's own instruction

1. Write `.stylelintrc.json` implementing the full rule table from §8 (T2) of this plan: no colour literals outside `tokens.css`; `box-shadow` disallowed; `border-width`/`border-radius` allow-lists; transition duration ceiling and required `var(--ease)`; `font-family` only via `var(--font-*)`; media queries restricted to 760/1100, `@container` to 700.
2. Wire it into `check:css` (already stubbed in `package.json`) and add it as a CI step.
3. **Prove it actually catches things**: deliberately commit a `box-shadow: 0 1px 2px black;` to a scratch file, confirm `pnpm run check:css` fails, then remove it. Do this now, while it's cheap to verify, not after the rule set has quietly bit-rotted.

**Exit:** `pnpm run verify` fails on a deliberate violation and passes once removed; CI runs it on every push.

#### 1.7 · Specimen page

`src/pages/_dev/specimen.astro` — excluded from the production build per the `_dev` convention already established. Renders, in both themes via the 1.5 toggle:

- Every colour token as a labelled swatch.
- Every `--t-*` type step at real size with its token name printed in mono beside it.
- The spacing scale as a visual ruler.
- Border weights and radius values as swatches.
- The §2.11 glyph row (`→ ↗ ← · / # + −`) plus the ADR-0007a resolutions — the CSS-drawn status dot (both states) and the inline-SVG theme glyph — rendered together, specifically so you can eyeball whether the drawn dot actually sits well next to real text before any real component uses it.

This is the cheapest insurance in the whole phase: every subsequent phase's "does this look right" question gets answered by comparing against this one page instead of hunting through real pages.

**Exit:** specimen page renders correctly at 390/900/1320 in both themes; this becomes the reference you and I both check against for the rest of the build.

---

**Phase 1 overall exit criteria:**

- Six self-hosted `.woff2` files, confirmed variable, in `public/fonts/`.
- Three metric-matched fallback `@font-face` blocks, computed not guessed.
- `tokens.css` has zero provisional markers left.
- `reset.css` + `base.css` written; focus ring and reduced-motion verified by hand.
- Theme toggle is instant, no flash, in both explicit and OS-preference states.
- Stylelint wired into `verify` and CI, proven to actually fail on a violation.
- Specimen page live, covering every token and both glyph-resolution exceptions.

### Phase 2 · Frame, layout structures, chrome _(1–2 days)_

The 1320 frame and the three column structures (§5.2) as three classes. Masthead at all three widths including the `<details>` menu panel with counts. Footer. Band system with gutter labels and closing hairlines.

**Exit:** an empty three-band page renders correctly at 390/900/1320 in both themes; T3 checks 1, 4, 5 pass; masthead matches the reference screenshots.

### Phase 3 · Prose and the article body _(2–3 days)_

`prose.css` per §10.3. Headings with mono section numbers (§6·06), lists, links (§8.2 — including the offset-shadow underline that survives mid-URL breaks), quotes, callouts via directives, footnotes, metadata row, breadcrumb.

Build this against a **real 3,000-word article with a table, four code blocks, a quote, two callouts and a diagram** — not lorem ipsum. Use one of your actual homelab pieces.

**Exit:** the article reads correctly at all six matrix combinations; T3 all checks pass on it; measure verified at 68ch desktop / 38–40ch mobile.

### Phase 4 · Code, terminal, figures, tables _(2–3 days)_

The hard parts, per §7 of this document. Custom Shiki theme, rehype chrome plugin, pinned line numbers, terminal component, figure directive with `kind`, table scroll regions.

**Exit:** all twelve fixtures from T4 render correctly and pass T3. Particularly: 210-char code line scrolls without the page scrolling; 7-column table pins its first column; four consecutive code blocks keep their 24px of page ground.

### Phase 5 · Content model and the article page _(1–2 days)_

Collections, schemas, cross-entry invariants, `/w/[num]`, slug redirects, TOC island, progress island, prev/next, related, author block, RSS, sitemap.

**Exit:** T1 passes; three real articles render end-to-end; TOC correctly absent below three `h2`s; series navigation works.

### Phase 6 · Writing index and projects _(2 days)_

Writing index (featured entry, year groups, counted-tag filter row, archive row), tag pages, projects index, project detail with status band.

**Exit:** T3 passes on both index page types at all widths; the five-track → three-track → stacked row transitions match §20.3; project status leads on mobile (E3).

### Phase 7 · Home, about, 404 _(1 day)_

Mostly composition — if any of these needs a new component, that's a signal to revisit Phases 2–6 rather than to add one (§22.8).

**Exit:** all seven page types exist; the gallery page renders all twenty components in all states; screenshot baselines committed.

### Phase 8 · Enforcement hardening _(1–2 days)_

Full T2–T5 wired into `npm run verify` and CI. Manual checklist written. Baselines locked.

**Exit:** CI is red if any rule is violated; deliberately break one rule of each tier to confirm it actually fails.

### Phase 9 · Deploy _(1 day)_

Per §10 below. Deploy an almost-empty site first so pipeline bugs surface before content exists.

**Exit:** push to `main` → live in under two minutes; rollback tested; TLS A+ ; nightly rebuild for the Now panel works.

### Phase 10 · Launch content

Minimum viable publication: **4–6 articles, 3–4 projects, one of them a full case study.** Below that the index pages look empty and the design has nothing to be a reduction _of_.

Suggested first set, chosen because they're already half-written in your head and cover three different article types: the Ansible migration piece (problem-solving), one CTF writeup (reasoning process), the evolutionary SVG experiment (experiment format), and the homelab backup architecture (technical explanation).

---

# 10. Deployment

Confirmed from earlier, with additions.

**Build:** GitHub Actions on push to `main` plus a nightly cron (AD-12). Steps: install → `npm run verify` (T1–T3, T5 fast checks) → `astro build` → `lychee` → Lighthouse CI → deploy. Verify runs **before** build so a token violation fails in ten seconds, not ninety.

**Serve:** Caddy on the VPS. Automatic TLS, HTTP/3, `zstd`/`gzip`, and a much smaller config surface than nginx + certbot for a static site.

**Atomic releases:** rsync into `releases/<git-sha>/`, then swap a `current` symlink. Instant, and rollback is one symlink change. Keep the last five releases. This is a small thing that turns "deploying my blog" into a legitimate infrastructure article, and it means a half-finished rsync never serves a half-finished site.

**Cache headers:** fonts and hashed assets `immutable, max-age=31536000`; HTML `no-cache` (revalidate); `/rss.xml` short max-age. Astro hashes asset filenames, so this is safe.

**Ansible** owns the server state (Caddy install, config, directory layout, firewall, Umami). GitHub Actions owns deploy events. Keep that boundary clean — it's the same separation you'd defend in a code review, and it's the reason a bad deploy can never leave the server misconfigured.

**Headers worth setting in Caddy:** CSP (strict — you have no third-party anything, so this can be genuinely tight and is a rare pleasure), `Referrer-Policy: strict-origin-when-cross-origin`, `X-Content-Type-Options: nosniff`, HSTS with preload once you're confident.

---

# 11. Designed-in leeway

Where the system must be able to grow without violating itself.

| Future need                                | Prepared how                                                                                                                             | Cost if unprepared                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| A fourth content type (notes, talks, uses) | Row components are collection-agnostic: they take a normalised `{number, title, meta[], href}` shape, not a `CollectionEntry<'writing'>` | Rewriting four list components                     |
| Article count into the hundreds            | Year-group bands (§19.2) already partition; archive-by-year already specified                                                            | Retrofitting pagination — which the design forbids |
| Search (OD-01 reversal)                    | §12.2 derivation rules exist; component #21 via the extension protocol                                                                   | None — genuinely deferrable                        |
| A second language                          | Collection paths and `lang` set at Phase 4; hreflang scaffolding                                                                         | Very expensive after 30 articles                   |
| Article > 8,000 words                      | E14 auto-split; `series` schema already models parts                                                                                     | Manual surgery on a published permalink            |
| A new syntax role                          | §2.3 palette is a token set, not a Shiki theme literal                                                                                   | Re-authoring the theme                             |
| Design system v1.1                         | Every exception is in the `exceptions` CSS layer with its E-number; baselines make drift a diff                                          | Silent drift                                       |
| Someone else contributing                  | `docs/decisions/` + `npm run verify` + the manual checklist                                                                              | The system decays on first outside PR              |

Two things deliberately **not** prepared for, because preparing for them would compromise the design: a card grid, and a CMS. If either becomes genuinely necessary, that's a design-system revision, not an implementation change.

---

# 12. Extension protocol

§22.6–22.8 gives the priority order. Concretely, before adding component #21:

1. **Can an existing component take a variant?** If yes, do that. A variant must still satisfy every state and every width.
2. **Can the page change instead?** §22.8: if a component would appear on exactly one page, the page is wrong.
3. **If it genuinely must exist**, it ships with all nine things §22.7 requires — purpose, anatomy, variants, all states, responsive behaviour at three widths, spacing, type tokens, colour roles, and when _not_ to use it — written into `DESIGN_SYSTEM.md` in the same PR as the code.
4. It must pass the box-or-rule test (§9.2) and add no new token.
5. It goes into the gallery page and gets a screenshot baseline in the same PR.

Same for tokens: a new colour must be added to **both** themes with a stated contrast ratio (§22.2), or it isn't added.

---

_Companion to DESIGN_SYSTEM.md v1.0._
