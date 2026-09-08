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
│   │   └── dev/                           # gallery + fixtures — see §3 note below on how exclusion actually works
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

**Correction, found while testing Phase 1.2:** a leading underscore does _not_ exclude an Astro page from routing — it only silences a warning about non-`.astro` files sitting in `src/pages/`. Verified directly: an identical `.astro` file returns 404 under `_dev/` and 200 under `dev/`, in both `astro dev` and `astro build`. So the directory is named **`dev/`, no underscore** — it's a completely normal, fully routable set of pages. Exclusion from what actually ships happens one layer later, at deploy time: the deploy step (§10) runs `rm -rf dist/dev` — or the rsync push uses `--exclude=dev/` — before the atomic release swap. The gallery and the twelve edge-case fixtures need to be buildable _and viewable_ during development; they must never reach production. This is now a deploy-pipeline responsibility, not a routing trick.

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

§25.6 lists twelve content stress tests the design was verified against. Commit them as draft fixtures under `dev/fixtures/` and run T3 against every one:

148-character title · 8 tags · 210-character code line · 7-column table · 90-word article · 9,400-word / 34-section article · 3840×2160 screenshot · image-free article · four consecutive code blocks · long URL in prose · long caption · project with no source.

This is the highest-leverage part of the whole enforcement system, because these are exactly the cases real content will hit and exactly the cases you won't think to check by hand.

## T5 · Visual regression and performance

- **Screenshot baselines** for the 42-render matrix, committed. Threshold ~0.1%. Any intentional design change updates baselines in the same commit — so design drift becomes a reviewable diff instead of an accumulation.
- **The gallery page** (`dev/gallery.astro`) renders all twenty components in every state (default / hover / focus / active / disabled / current) in both themes. Force states via CSS classes so screenshots capture them deterministically.
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
3. Also pull the **twenty-component gallery** if Claude Design has one rendered — this seeds `dev/gallery.astro` in Phase 7 and saves re-deriving component states from the spec text alone.

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

`src/pages/dev/specimen.astro` — fully routable like any other page; excluded from what ships via the deploy-time step described in §3, not via Astro routing. Renders, in both themes via the 1.5 toggle:

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

### Phase 2 · Frame, layout structures, chrome _(2–3 days — revised up from 1–2: OD-08 below is real design work, and the mobile menu has more correctness constraints than its size suggests)_

Eight sub-phases. This is the first phase where the token values become actual geometry, which is why it opens with a blocking arithmetic finding rather than with code.

#### 2.0 · OD-08 — resolve the `--bp-gutter` arithmetic **(blocking, needs your decision)**

**DESIGN_SYSTEM.md §4.1 contains an arithmetic error, and it blocks 2.1.** §4.1 justifies the 1100px breakpoint like this: _"the width at which `148 + 44 + 680 + 44 + 200 = 1016` plus 2 × 32 margins can be honoured."_

That sum is wrong. The correct total is **1116**, not 1016 — an off-by-100 typo. Verified by computation, not by eye:

|                                 |                                          |
| ------------------------------- | ---------------------------------------- |
| Three-track content width       | `148 + 44 + 680 + 44 + 200` = **1116px** |
| §3.3's mandated margin at ≥1100 | 56px each side                           |
| Minimum viewport required       | 1116 + 112 = **1228px**                  |
| Available at a 1100px viewport  | 1100 − 112 = **988px**                   |
| Result at the stated breakpoint | **overflows by 128px**                   |

So at exactly 1100px, the three-track article shape cannot be honoured — it would overflow, and the only way to make it fit would be to steal from the measure, which §4.1's own reasoning and §22.10 both forbid absolutely. **The reasoning in §4.1 is correct; only its number is wrong**, and the reasoning itself points at ~1228.

**Recommendation: move `--bp-gutter` to 1280px.** This preserves every token value in §2.7, preserves the measure, and keeps the design's own stated logic intact. The alternative — keeping 1100 and shrinking the gutter or aside — would change published token values to accommodate a typo, which is backwards.

On the specific number, since the obvious choice is wrong in a way worth noting:

| Candidate | Slack after 56px margins | Verdict                                                                                                                                                                                          |
| --------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1228      | 0px                      | The exact minimum. Zero tolerance — rejected.                                                                                                                                                    |
| 1240      | 12px                     | Tempting (minimum, rounded), but **thinner than a classic Windows scrollbar** (~15–17px), which can eat the difference and cause the layout to engage at a width where it doesn't fit. Rejected. |
| **1280**  | **52px**                 | Comfortable margin for scrollbar and sub-pixel variance. **Recommended.**                                                                                                                        |

1280 is admittedly a device-ish number, which sits awkwardly against §4.3's "prefer available space over device names." The justification here is still structural, not device-based: it is the nearest round number that clears 1228 with enough tolerance to survive a scrollbar. Worth recording that reasoning in the ADR so it doesn't read as a device breakpoint later.

Consequences, all of which are Phase 2 work once you confirm:

- `tokens.css`: the `@media (min-width: 1100px)` block becomes `1280px`, and its comment (which currently repeats the wrong `1016` arithmetic — I propagated the error) gets corrected.
- `.stylelintrc.json`: the media-query allow-list changes from `760px|1100px` to `760px|1280px`. Good sign that the T2 rule set is doing real work — it will hard-fail on any file that misses the change.
- The tablet range widens from 760–1099 to 760–1279. No component changes; that range's behaviour is already fully specified.
- `DESIGN_SYSTEM.md` has 19 references to 1100. Since it's the authoritative document, **it should be corrected at source rather than silently diverged from** — otherwise every future reader re-derives the same wrong number. This needs an ADR either way.

Do not start 2.1 before this is decided; the frame classes encode the number directly.

#### 2.1 · `layout.css` — the frame, three structures, bands

1. **The frame.** `max-width: var(--page-max)`, `margin-inline: auto`, and **no horizontal padding of its own**. The page margin lives on the bands inside it instead.

   This inversion is the key insight of the whole layout layer, and it makes §5.5's two rows fall out for free. §5.5 requires hairlines to span "full frame width" at desktop but "full viewport width" at mobile, while text keeps its margin at both. If the border sits on a band that is itself the frame's full width, with `padding-inline: var(--page-margin)` pushing its _content_ inward, then: at desktop the rule spans the full 1320 while text is inset 56; at mobile the frame is fluid (= viewport) so the rule spans the viewport while text is inset 20. **Stacking law 04 is satisfied by construction, with no mobile-specific rule at all** — which is a strong signal the model is right, since §3.2 presents that law as universal.

2. **Exactly three column-structure classes** (§5.2, §22.9 — do not invent a fourth):
   - `.layout-article` — `grid-template-columns: var(--gutter-w) var(--measure) var(--aside-w)`, `gap: var(--grid-gap)`, collapsing to one column below `--bp-gutter`.
   - `.layout-band` — `var(--gutter-w) minmax(0, 1fr)`, same gap, same collapse. The workhorse.
   - `.layout-measure` — a single `min(100%, var(--measure))` column.

3. **The band.** Grid row, `padding-block: var(--sp-band-y)`, `border-bottom: var(--bw) solid var(--c-rule)`. The last band before the footer drops its bottom rule (§5.3 — the footer's top rule serves), which is `:last-of-type` or an explicit prop, not a hand-applied override.

4. **Container context for E6.** Put `container-type: inline-size` on the article body wrapper now. Nothing consumes it until Phase 3/4 (figures, code, tables consult their container at <700, not the viewport), but the element it belongs on is created here — adding it later means editing layout after components already depend on it.

**Exit:** a bare three-band test page renders correctly at 390 / 900 / 1320 in both themes; hairlines span the frame at desktop and the viewport at mobile while text keeps its margin at both, verified by eye against the 0.3 reference screenshots.

#### 2.2 · `BaseLayout.astro`

The first real layout, and the home for several things currently living on dev pages:

1. `<html lang={lang}>` with `lang` as a prop defaulting to `'en'` — the OD-05 German preparation, and load-bearing for §2.5's automatic hyphenation on long titles, which uses language-keyed dictionaries.
2. The three font preload hints carried over from 1.3 (`source-serif-roman`, `plex-sans-roman`, `plex-mono-roman` — Roman only; these are variable fonts, so one file covers every weight, and italic is quote-only).
3. The inline theme script, promoted out of the dev pages via the same `?raw` + `is:inline` mechanism verified in 1.5.
4. **The skip-to-content link** — §18.2 requires it to be the first focusable element on every page. This needs a `.skip-link` class that `base.css` does not currently have: the existing `.visually-hidden` utility is _permanently_ hidden, whereas a skip link must become visible on focus. Small addition to `base.css`, flagged because it's easy to reach for the wrong existing class.
5. `<main id="main">` as the skip target.
6. An explicit comment that ViewTransitions / ClientRouter must never be added here (AD-01, §17.4) — this is the file where someone would reflexively add it.

**Exit:** every page renders through `BaseLayout`; tabbing from a fresh page load focuses the skip link first, and activating it moves focus to `<main>`.

#### 2.3 · Masthead — wordmark, role text, nav, theme control

Per §7.1–7.4. Wordmark (sans 600 14.5, −0.01em) + role text (mono 11, `backend · infrastructure`) baseline-aligned with a 12px gap; three destinations + theme control on the right at 26px gaps; single bottom hairline at full frame width; `position: sticky`.

Two details worth calling out because they're easy to get subtly wrong:

- **The role text drops at tablet** (§7.4), and §7.4 gives a reason worth preserving in a comment: it is the one datum in the masthead whose information is fully carried by the wordmark beside it. That is stacking law 02 (relocate, never delete) being _legitimately_ overridden, not violated — worth documenting so a later reader doesn't "fix" it.
- **`--masthead-h` is 60px only at ≥`--bp-gutter`.** §25.4 resolves this explicitly: height is a consequence of padding (18 tablet / 14 mobile), not an independent token. So the token sets an explicit height only at desktop. Note this makes `base.css`'s `scroll-margin-top: var(--masthead-h)` slightly generous on mobile — erring large is correct here, so no change needed, but it should be a known deviation rather than a surprise.

The theme control promotes the ADR-0007a inline SVG half-circle prototyped on the specimen page into a real component, in a hairline frame at `--radius-sm`.

**Exit:** masthead matches the reference screenshots at all three widths in both themes; the current page carries its accent underline (§7.2); every control clears 44px on touch.

#### 2.4 · Mobile menu — the in-flow disclosure

Deceptively constrained. §7.5 specifies a native `<details>` that **pushes the page down rather than overlaying it**, with no scroll lock, no focus trap, and no close-on-outside-click — and §7.5 is explicit that this is _why_ the pattern is safe ("no focus trap to get wrong"). Resisting the instinct to build a drawer is the whole point.

- Rows 48px, destination in sans 16 on the left, **count in mono 11 muted on the right** (`Writing 38`, `Projects 6`, `About —`).
- **The counts need a data shape, and this is worth deciding deliberately**: two of the three destinations have a count and one has an em dash. So `NAV_LINKS` in `consts.ts` needs a notion of "count source, or explicitly none" rather than a plain number. Also note that with collections empty until Phase 5, these will honestly render `Writing 0` — correct behaviour, not a bug, and better than hardcoding a fake number (content brief: no invented metrics).
- The label swaps `menu` → `close` and the border takes `--c-accent` when open. **Implement the swap with two real elements toggled by the `[open]` attribute, not with CSS `content:`** — generated content isn't reliably announced by assistive technology, and this control is the only navigation affordance at this width.
- Final row: `rss ↗ · github ↗ · pgp ↗` left, theme control right — the theme control _moves into the panel_ at this width rather than competing with the menu control in the masthead.

**Exit:** the panel pushes content rather than overlaying; keyboard-only navigation through open → links → close works with no trap; counts render from real collection data.

#### 2.5 · Footer

Per §18. `--c-surface` ground, one top hairline, two tracks, mono 11.5 / 1.9 throughout, name in `--c-text` and everything else muted, 24px padding-block, stacking to one left-aligned column below 760 with type and colour unchanged.

**OD-09, small but needs an answer before writing it:** §18 specifies the footer's right track ends with `© 2026 · built with Astro · colophon`. But §19 defines exactly seven page types and there is no colophon page; §25.5's confirmed-absences list doesn't mention one either. So `colophon` is either an eighth page type (which would need the §12 extension protocol) or it isn't a link at all.

**Recommendation: make it a section on `/about`** and link to `/about#colophon`. The about page is already described as "a colophon-style record" in §19.6, so the content belongs there, the seven-page inventory stays intact, and no extension protocol is needed. Alternative if you'd rather: drop the word entirely. Either is defensible; inventing an eighth page for one footer link is not.

**Exit:** footer matches reference screenshots at all three widths; every link resolves (no dead `colophon` href).

#### 2.6 · Sticky masthead scroll state

§7.6: the masthead's _only_ scroll behaviour is acquiring the `--c-surface` ground. It does not shrink, hide, or animate (§17.2 explicitly bans sticky-header shrink).

**This needs a mechanism decision, because the obvious approach breaks AD-11.** A scroll listener would be a fourth JS island, and AD-11 budgets exactly three. Two real options:

- **CSS scroll-driven animation** (`animation-timeline: scroll()`), zero JS. Where unsupported, the masthead simply never acquires the surface ground — a purely cosmetic degradation with nothing broken and no layout shift. **Recommended.** Note it isn't really "animation" in the §17.1 sense: the property change can be instantaneous, and §17.1's exhaustive what-animates list doesn't include this, so a duration here would arguably violate that list.
- A sentinel element plus `IntersectionObserver`, folded into an _existing_ island rather than added as a fourth.

Worth stating plainly: this is the least important item in Phase 2 and the first thing to cut if it fights the browser matrix.

**Exit:** the ground appears on scroll in supporting browsers with no layout shift, and its absence changes nothing structural elsewhere.

#### 2.7 · Bring T3 forward — minimal Playwright

The original plan defers all of T3 to Phase 8, but Phase 2's own exit criteria already name T3 checks 1, 4, and 5. **Recommend bringing a minimal Playwright setup forward here**, for the same reason stylelint moved to 1.6: it is far cheaper to build compliant layout than to retrofit it, and these three checks are exactly the ones a layout phase can violate invisibly.

Three checks only — not the full T3 suite:

1. **No horizontal page scroll** (`documentElement.scrollWidth <= clientWidth`) at 390 / 900 / 1320. §10.11 states this absolutely, and it is the single highest-value automated check in the entire system.
2. **Touch targets** ≥ 44px, rows ≥ 48px, at 390.
3. **Focus ring** visible on every tabbable element, both themes.

The remaining seven T3 checks stay in Phase 8 — they assert things (type floors in prose, measure width, scroll regions) that don't exist yet.

**Exit:** `pnpm check:e2e` runs the three checks across the matrix; a deliberately overflowing element fails check 1, proving it works, then is removed.

---

**Phase 2 overall exit criteria:**

- OD-08 resolved, with an ADR, and the number corrected in `tokens.css`, `.stylelintrc.json`, and `DESIGN_SYSTEM.md`.
- OD-09 resolved; no dead `colophon` link.
- Exactly three column-structure classes exist — no fourth.
- Hairlines span the frame at desktop and the viewport at mobile, text keeps its margin at both, with no mobile-specific rule needed to achieve it.
- Masthead and footer match reference screenshots at 390 / 900 / 1320 in both themes.
- Mobile menu pushes rather than overlays; no scroll lock, no focus trap.
- Skip link is the first focusable element on every page.
- Still exactly three JS islands (AD-11 intact).
- T3 checks 1, 4, 5 pass across the matrix, and check 1 is proven to fail on a real violation.

### Phase 3 · Prose and the article body _(3–4 days — revised up from 2–3: the Markdown pipeline is three real plugins, and §10's spacing tables disagree with §5.3, §6 and each other in three places, which are decisions before they are code)_

Ten sub-phases. Like Phase 2, this one opens with findings rather than code.

Two scope corrections to the original one-paragraph stub, both of which change what "done" means:

- **Phase 3 builds the article, not the article _page_.** `/w/[num]`, the collection schema, `readingTime` / `wordCount` derivation, the TOC scroll-spy island, the progress bar, prev/next, related and the author block all stay in Phase 5. What Phase 3 owns is everything between masthead and footer that is made of _prose_: the header band, the running body, and the first apparatus block (references).
- **Inline code belongs here; code blocks do not.** §13.4 is a prose-typography rule with no Shiki involvement — it sizes relative to its parent and needs the sunken ground and a hairline, nothing more. §13.2/13.3 are Phase 4. The stub named neither, and inline code would otherwise fall through the gap between the two phases.

One correction to the stub's own wording, since it would have produced a lint failure on day one: it calls for an **"offset-shadow underline"**. Both `box-shadow` and `text-shadow` are on T2's `property-disallowed-list` (§2.10, §1.12), and no shadow is needed — see 3.4.

#### 3.0 · Three conflicts in §10, and one piece of housekeeping

§10 is the most-specified section of the design system and the only one whose spacing appears in three places (§5.3's rhythm sentence, §10.3's table, §06's component note). Where three sources describe one number, two of them disagree.

| #   | Question                                    | Sources                                                                                                                                                                                          | Status                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A   | `h2` → paragraph at mobile: **16 or 14?**   | §06 says "16px below", with no responsive row. §10.9's mobile table says `h2` is "36 above / **14** below".                                                                                      | **Resolved here: 14.** §25.4's own reconciliation rule — later and more specific wins — applies cleanly; §10.9 is the mobile-behaviour table and is later. §06 needs a mobile row added **at source**, the same way ADR-0016 corrected §4.1 rather than diverging from it.                                                                                                                                                                                                                 |
| B   | Body → apparatus: **96 or 56?**             | §10.3 ("Body → apparatus 96") and §5.3 ("the gap from the end of an article body to its footer apparatus is 96px") both say 96. §10.5 says the references block is "placed 56px after the body". | **Recommendation: 96, and correct §10.5 at source.** Two independent structural rhythm statements agree; one component note disagrees. §25.4's rule would pick 56 here, which is why this is flagged rather than resolved silently — and 56 has a second cost: the references block is _conditional_, so a 56 that applies only when footnotes exist makes the body-to-apparatus gap change size depending on whether the article happens to cite anything. Confirm when you sign the ADR. |
| C   | Paragraph → `h3`: **unspecified anywhere.** | §10.3, §5.3 and §06 each give `h3` → paragraph (12). None of the three gives the space _above_ an `h3`.                                                                                          | **Blocking → OD-11.** A number has to be invented, and inventing a spacing value is exactly what §22.3 exists to prevent, so it needs your eye on the 0.3 reference screenshots rather than my arithmetic.                                                                                                                                                                                                                                                                                 |

**Housekeeping, found while checking the above:** `docs/decisions/README.md` is stale. It indexes ADR-0001–0013 but ADR-0015, ADR-0016 and ADR-0017 exist on disk and are not listed, and its "Next number is 0014" line is wrong — 0014 was never allocated and 0017 is taken. Phase 0.5's exit criterion was "13 ADRs committed, indexed in `docs/decisions/README.md`"; the index has since drifted. Fix it in this phase: add the three missing rows, record 0014 as permanently unused (renumbering existing ADRs would break the cross-references in `tokens.css` and `astro.config.mjs`), and set the next number to **0018**.

##### OD-10 · Where does a section number come from? **(blocking 3.3 and 3.7)**

§06 states the `h2` number is "**content, not decoration**: it is the anchor target and the TOC key." Three things therefore have to agree on it — the rendered heading, the `id` a TOC link and a shared URL point at, and the TOC entry itself. There are two ways to make them agree.

- **Option A — authored in the Markdown.** The heading is written `## 01 · What the drift was hiding`; a remark plugin splits the `NN · ` prefix into the mono accent span and leaves the rest as the heading text.
- **Option B — generated by index.** Headings are written plain; a plugin counts `h2`s in document order and injects the number, then computes the `id` itself.

**Recommendation: Option A, plus a validator.** Three reasons, in order of weight:

1. **§06 already forces half of it.** `h3` subsections are numbered `n.m` "**in the text itself**" and carry no separate span — so `h3` numbering is authored no matter which option is chosen. Option B would leave `h2` numbers generated and `h3` numbers hand-written, which is the configuration most likely to drift.
2. **The anchor and the TOC come free.** Astro's Markdown pipeline already slugs headings and exposes them as `headings` from `render()` (verify this directly against the installed Astro 7.2.6 by rendering the fixture, rather than trusting the docs — the same discipline that caught the `src/content.config.ts` location change in Phase 0). With the number in the heading text, the slug contains it (`#01-what-the-drift-was-hiding`) and the TOC key is the same string the reader sees. No `toc.ts` extraction is needed in this phase at all.
3. **Renumbering is visible in the diff.** Reordering two sections under Option A shows up as an edit to both headings, which is what it is. Under Option B it shows up as nothing, and every shared link into the article silently retargets.

The cost of Option A is that the numbers can go wrong. That is what the validator in 3.3 is for: `h2` numbers must run contiguously from `01`, and any `h3` beginning `n.m` must match its parent `h2`'s `n` — build fails otherwise. It is the same invariant, in the same shape, as T1's "article numbers unique and contiguous from 001".

**Exit:** decided, and recorded as ADR-0018.

##### OD-11 · Paragraph → `h3` spacing **(blocking 3.2 and 3.4)**

The gap above an `h3` is genuinely absent from DESIGN_SYSTEM.md. Every other prose relationship is specified twice or three times; this one, zero. Options, all on the 4px scale and all already tokens:

| Candidate                                                                  | Reasoning                                                                                                                                                                                                                                                                                                                                                                        |                 |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| **26 / 32 / 32** (mobile / tablet / desktop), mirroring `--sp-prose-block` | An `h3` is a break in the reading of the same weight as a block element, and this is the step the system already uses for exactly that. It lands cleanly between its neighbours at every tier — 20 / 26 / 36 at mobile, 24 / 32 / 48 at tablet, 24 / 32 / 56 at desktop, reading paragraph → `h3` → `h2` — and introduces no number the responsive scale does not already carry. | **Recommended** |
| A flat 32 at every width                                                   | Simpler, but at mobile it sits 4px under the `h2`'s 36, so the two heading levels stop being distinguishable by their approach. Rejected on the same reasoning §3.4 gives for stepping body type down at all.                                                                                                                                                                    |                 |
| 24 (`--sp-para`)                                                           | Makes an `h3` indistinguishable from a paragraph break at mobile, where `--t-h3` is 18px against 17px body. Rejected.                                                                                                                                                                                                                                                            |                 |

Please check 32 against a desktop article reference screenshot from `docs/reference/article/` before I write it into `tokens.css` — this is the one number in the phase with no source, and it is much cheaper to settle now than to notice on the fourth published article. If the screenshots show the `h3` breathing more than that, say so and give me the value you read.

**Exit:** a number, recorded in the ADR alongside the §10.5 and §06 source corrections.

#### 3.1 · The fixture article

**Where it lives before Phase 5 exists.** The collection schema is still a Phase-0 stub (`title` + `draft`), and Zod strips unknown keys — so an article authored into `src/content/writing/` today would have its `number`, `section`, `date` and `tags` silently discarded, and the header band would have nothing to render. Pulling the full Phase 5 schema forward to avoid that would drag the cross-entry invariants with it.

**Recommendation: `src/pages/dev/fixtures/article.md`**, a routable Markdown page with a `layout:` frontmatter key. Frontmatter on a page is arbitrary and reaches the layout intact as `Astro.props.frontmatter`, it runs through the identical remark/rehype pipeline, and `dev/` is already stripped from production at deploy time (§3). Author it with the **full Phase 5 frontmatter shape** — `number`, `title`, `lead`, `section`, `date`, `tags`, `series` — so Phase 5's job is `git mv` plus landing the schema, not a rewrite.

**What it must contain**, per the stub plus what the phase actually needs to exercise: ~3,000 words, 5–8 `h2` sections (§21.5's stated density, and above §6·15's three-`h2` TOC threshold), at least two `h3`s, an ordered and an unordered list, one quote with attribution, two callouts of different kinds, three or more footnotes with one external reference and one repo path, several inline-code spans, at least one long URL in prose, and one link inside a heading if you have one naturally.

The table, the four code blocks and the diagram named in the stub go in **too**, but as **Phase 4's targets, deliberately unstyled here**. This is worth stating rather than leaving implicit: their default rendering in Phase 3 is ugly, and that is the correct state. What Phase 3 does assert about them is the one thing that is a prose concern — that a `pre` or `table` in the flow gets §10.3's 32px above and below and does not break the measure or the page scroll.

Use a real homelab piece. The reason is not sentiment: §21.4 makes the writing voice a design constraint ("prose that admits cost, states measurements, names dead ends"), and lorem ipsum has uniform word lengths, no inline code, no URLs and no numbers — it would pass every check in 3.8 while proving nothing.

**Exit:** the fixture renders at `/dev/fixtures/article` through `BaseLayout`, unstyled, with every element in the list above present.

#### 3.2 · Token corrections, and the prose spacing tokens

Opens with a **real bug in `tokens.css`**, not a new value. §6·10 specifies callout body as serif 16, "Mobile body 15.5". The token file declares `--fs-callout: 1rem` (16px) at the mobile-first base, declares `--fs-callout-mobile: 0.96875rem` (15.5px) beside it, and then **re-declares `--fs-callout: 1rem` inside the `min-width: 760px` block** — a no-op. Net effect: callouts would render 16px at 390 (a spec violation), and `--fs-callout-mobile` is referenced by nothing anywhere in `src/`. Fix: base becomes 15.5, the ≥760 override becomes real at 16, `--fs-callout-mobile` is deleted. Worth noting _why_ it slipped through Phase 1 — the specimen page renders every `--t-*` bundle but no `--fs-*` value that lacks one, so a component-local size with no bundle token had nothing checking it. 3.9 closes that gap.

Then, the tokens this phase needs that do not exist:

| Token              | Value                                          | Source                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--t-callout`      | `400 var(--fs-callout)/1.62 var(--font-serif)` | §6·10. §22.4 forbids a size outside the scale, and the token file's own reasoning is that a token which decomposes into four loose declarations stops being one; the 1.62 is inline for the same reason `--t-quote`'s 1.6 and `--t-footer`'s 1.9 are.                                                                                                                                                                                                                                  |
| `--sp-h2-para`     | 14 → 16 at ≥760                                | §10.3 / §10.9, per finding A. Flag in the ADR that 14 is one of §25.2's component-interior 2px sub-steps, whose register entry (E13) bounds them to "inside components only ... never used between components or on a band". A heading and its first paragraph are inside one prose block rather than between components, so this is within E13 rather than an exception to it — but it is the first prose-level use of a sub-step, and `--sp-meta-gap`'s 14/22 is the only precedent. |
| `--sp-h3-para`     | 12, constant                                   | §10.3. Constant at every width, but named so the rhythm is auditable in one place rather than being a bare `--sp-12` in `prose.css`.                                                                                                                                                                                                                                                                                                                                                   |
| `--sp-para-h3`     | OD-11 (26 → 32 at ≥760, recommended)           | The one number in the phase with no source in DESIGN_SYSTEM.md.                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `--sp-apparatus`   | 96 (finding B)                                 | §10.3 / §5.3.                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `--sp-list-indent` | `var(--sp-26)`                                 | §10.4's 26px indent. Aliased rather than re-declared so the 4px scale stays the single source.                                                                                                                                                                                                                                                                                                                                                                                         |
| `--fs-repo-path`   | 13px                                           | §10.5's mono-13 repo paths in the references block. No existing token covers it — `--fs-code` is 13.5/12.5 and `--fs-table-cell` is 13 but semantically unrelated. Same treatment and same comment discipline as `--fs-menu-row` in Phase 2.                                                                                                                                                                                                                                           |

Two things deliberately **not** given tokens: §10.5's reference-row text takes `--t-ui` as-is (§10.5 says "sans 15 / 1.6"; `--lh-ui` is 1.55 — a 0.75px difference on a 15px line, not worth a one-off token, but record the deviation in a comment so it is a known choice), and §10.4's 4px list-item `padding-left` stays a bare `var(--sp-4)`, which is that step's documented use in §2.6.

Also verify while here: `--fs-display-long` (26px, §3.7's over-90-character step) has existed since Phase 1 and is referenced by nothing. 3.6 is what finally consumes it.

**Exit:** `pnpm check:css` and the token-parity script pass; a callout at 390 measures 15.5px in devtools; no `--fs-*` token in the file is unreferenced except ones whose phase hasn't landed.

#### 3.3 · The Markdown pipeline — four plugins

`astro.config.mjs` currently has empty `remarkPlugins` / `rehypePlugins` arrays with a comment deferring them to "Phase 4/5". All four below land here, because all four are about _prose structure_; only `rehype-code-chrome.ts` and the Shiki theme wait for Phase 4. Two of them — `remark-section-numbers.ts` and `rehype-prose-links.ts` — are additions to §3's plugin list, the same category of small, necessary addition as `fonts.css` in 1.3 and `global.css` in Phase 2.

Order matters; they run in this sequence:

1. **`remark-heading-depth.ts`** — brought forward from T1/Phase 8. Fails the build on any heading of depth ≥ 4 (§21.3, §18.3, and cross-entry invariant 6 in §6 of this document). Fifteen lines, and it runs _first_ so an `h4` fails with the right message instead of confusing the numbering validator. Same reasoning as moving stylelint to 1.6: a rule that shapes what you write is worth having before you write 3,000 words, not after.
2. **`remark-directive`** (the npm package) **+ `src/plugins/remark-directives.ts`** — AD-04's mechanism, finally used. The local plugin transforms `:::note` / `:::warning` / `:::correction` container directives into §6·10's callout markup, and **fails the build on anything else**, including `:::figure` — which is Phase 4's, and must error loudly rather than silently emit nothing for a phase and a half. It also enforces §6·10's two structural rules directly, since they are cheaper to check in the AST than to notice in a screenshot: **a callout is never nested, and never contains a code block.**
3. **`remark-section-numbers.ts`** — per OD-10. Splits the authored `NN · ` prefix off an `h2` into the mono accent span, validates `h2` contiguity from `01`, validates that any `h3` opening `n.m` matches its parent's `n`, and marks the heading node as numbered so 3.5 and 3.7 can filter on it.
4. **`rehype-prose-links.ts`** — adds §8.2's trailing `↗` to external links **as real markup, not CSS `content:`**. This follows the precedent set in Phase 2.4 for the menu label swap: generated content is not reliably announced, and here it is also the only thing distinguishing an external link from an internal one. It deliberately does **not** add `target="_blank"` — nothing in the design asks for it, and where a link opens is the reader's decision.

Two verification notes, both of the "check, don't assume" kind this plan keeps insisting on. Adding `remarkPlugins` does **not** disable Astro's GFM and SmartyPants defaults — those are separate `markdown` flags — but confirm it by building, because footnotes (3.5) and curly quotes both depend on GFM staying on, and the subset fonts were built assuming SmartyPants output (`docs/glyph-coverage.md` records em dash, en dash, curly quotes and ellipsis as deliberately included). And `remark-directive` must be listed **before** `remark-directives.ts`, or the container syntax is still plain text by the time the local plugin looks for it.

**Exit:** an `h4` in the fixture fails the build; `:::figure` fails the build; a callout containing a fenced block fails the build; renumbering one `h2` out of sequence fails the build. Each proven by making the violation, seeing red, and removing it — the 1.6 discipline.

#### 3.4 · `prose.css` — the running body

The global stylesheet `global.css` already has its import stubbed out with a `/* Phase 3: */` comment. It goes in `@layer components`, scoped to a single `.prose` class on the body wrapper, because Markdown output carries no classes of its own and the alternative — bare element selectors — would leak into the masthead, the footer and every index row built in Phase 6.

The bulk of this is transcribing §10.3, §10.4 and §3.4 against the tokens from 3.2. Four things are not transcription:

1. **The link underline.** §8.2 wants "a **permanent** 1px `--c-accent` underline at ~0.15em offset", and §10.10 wants it to survive a mid-URL line break "so both fragments keep their rule and the line height never changes". That is a plain `text-decoration`, and has been for years:

   ```css
   text-decoration: underline;
   text-decoration-color: var(--c-accent);
   text-decoration-thickness: var(--bw);
   text-underline-offset: 0.15em;
   text-decoration-skip-ink: none;
   ```

   A text decoration is drawn per line box, so both fragments of a broken link keep it for free, and it has never contributed to line height. `skip-ink: none` is what makes it a _rule_ rather than a decoration, which is §8.2's own word for it. The shadow trick the stub reached for is a workaround for faking skip-ink in browsers this project doesn't support, and T2 forbids both properties it could be built from.

   **This requires one change to `.stylelintrc`.** The `transition-property` allow-list is `color | background-color | border-color | outline-color | height`, and §8.2's hover moves "text and underline both" to `--c-accent-hi` — which needs `text-decoration-color` in the transition. It is licensed by §17.1's exhaustive list ("**Link and nav colour and underline**"), so this is the allow-list being _incomplete_, not the design being violated. Add it to both alternatives of the rule (the single-property regex and the comma-list one), and note in the config's `//` block that §17.1 is the authority for that list.

2. **Inline code, and a collision with the type floors.** §13.4 says mono at **0.86em of the parent** — "sized relatively, never a fixed pixel size" — and §3.4 sets a hard 10.5px floor on any type in the system. In prose that is fine (17 × 0.86 = 14.6px). Inside a mono 11.5 caption or metadata line it is 9.89px, below the floor. The resolution is one declaration: `font-size: max(0.86em, var(--fs-label))`. It engages only in the mono-inside-mono case, where the 0.86 factor was never doing anything useful anyway — §13.4's stated purpose for the ratio is matching the _parent_, and a mono parent already matches.

3. **Mono spans break anywhere.** §10.10: "Mono spans in flow break at any character." `overflow-wrap: anywhere` on inline code and on link text, so a 90-character URL cannot push the page sideways. This is the prose half of §10.11's absolute no-horizontal-page-scroll rule; the other three owners (code, terminal, table) are Phase 4's.

4. **Wrapping and hyphenation.** `text-wrap: pretty` on body paragraphs and headings (§10.3's "pretty wrapping"). `hyphens: auto` is **not** applied to body text — §10.10 asks for it on the long _title_ only, and it is `BaseLayout`'s `lang` attribute (Phase 2.2) that makes it work at all.

Everything else is the table: body `--t-body` in **`--c-text-prose`** — not `--c-text`; that token exists specifically because dark-theme running prose sits one step under headings (§2.2 deviation 1, §25.1) and this is the only place in the codebase that should reference it. Paragraph rhythm from `--sp-para`; heading rhythm from `--sp-para-h2` / `--sp-h2-para` / `--sp-para-h3` / `--sp-h3-para`; block rhythm from `--sp-prose-block`; lists per §10.4 with **the browser's own markers**, which is why `reset.css` was written by hand in 1.4 rather than imported.

**Exit:** the fixture reads correctly at 390 / 900 / 1320 in both themes; a link broken across a line keeps its rule on both fragments with no change in line height; `pnpm check:css` passes with the amended allow-list.

#### 3.5 · Callouts, quotes, footnotes and references

Callouts and quotes are the easy half — §6·10's three callout kinds against `--c-sunken` / `--c-warn-bg`, 2px left marker, `0 4px 4px 0` radius (already on T2's allow-list), `--t-callout` from 3.2; and §6·11's quote with a `--c-rule-2` marker, `--t-quote`, `--c-quote-text`, no ground, no radius. Both stay **inside the text margin at every width** — they are prose, not machine content, and the `.full-bleed` utility from 2.1 must not touch them.

Footnotes are the hard half, because GFM's output does not match §10.5 in three specific ways:

1. **The back-reference glyph is `↩` (U+21A9), which is not in the fonts.** `docs/glyph-coverage.md` records the subset as Basic Latin + Latin-1 Supplement + §2.11's navigation glyphs + prose punctuation. U+21A9 is in none of those, so it would render from a fallback family — a font mismatch on a glyph, which is precisely the failure ADR-0007a exists to prevent, and one nothing in the toolchain would flag. **Replace it with `←`**, which is subset, and whose assigned meaning in §2.11 is "previous in sequence" — exactly what a back-reference is.
2. **GFM emits a visually-hidden `<h2>Footnotes</h2>`.** That is a real `h2` in the document: it would enter Astro's `headings` array, therefore the TOC, and it would break 3.3's contiguity validator by being an unnumbered `h2`. Both problems have the same one-line answer, and it is worth adopting as the general rule: **the TOC and the numbering validator both filter on "has a section number"**, so any structural heading that isn't a numbered article section is excluded by construction rather than by a list of exceptions. Replace the hidden `h2`'s text with §10.5's `REFERENCES` label, drop its `sr-only` class (§10.5 wants that label visible) and give it `--t-label`.
3. **The reference marker.** §2.11 and §8.3 both specify mono 11 superscript in `--c-accent`, **no underline** — the one link kind in the system that doesn't get one. `--fs-meta-xs` is 11px, which clears the 10.5 floor; set it explicitly rather than inheriting `sup`'s default `smaller`, which would compute from the parent and drop below the floor in a caption.

The rest of §10.5 is markup: rows of accent mono numeral + text at `--t-ui`, 12px gap, external references carrying `↗`, repo paths at `--fs-repo-path` with a `--c-rule-2` underline, the block placed `--sp-apparatus` after the body.

**Exit:** every glyph in the rendered fixture resolves from a subset font — checked in devtools' rendered-fonts panel, not by eye; the TOC and the numbering validator both ignore the references heading; a callout and a quote both stay inside the 20px text margin at 390 while a `pre` beside them does not.

#### 3.6 · The article header band

Per §10.2 — gutter, breadcrumb, `h1`, lead, metadata row above a hairline. Five details are load-bearing:

- **The band's padding is asymmetric, and `.band` is not.** §10.2 specifies 56 top / 40 bottom, while `layout.css`'s `.band` is `padding-block: var(--sp-band-y)` on both edges. Add a `.band--header` modifier there (not a fourth column structure — §22.9 is about grid structures, and this is a padding variant on the existing band). §10.2 gives no tablet or mobile values, so derive them from the discipline §3.3 already uses: bottom padding is one band-scale step below top at each tier — **40 / 32 / 24** (desktop / tablet / mobile) against `--sp-band-y`'s 56 / 40 / 32. All three are on the 4px scale; none is invented.
- **`--fs-display-long` finally gets used.** §3.7's "title over 90 characters at <760 steps 28 → 26" cannot be a CSS length query. Apply the class in the component from `title.length > 90` at build time — exact, zero runtime, and it consumes the token Phase 1 created and left dangling.
- **The breadcrumb drops its last segment below 760** (§6·16). Do it with `display: none`, and record _why_ that is not a stacking-law-02 violation: §6·16 states the reason itself — the article number is still present in the metadata row on the same screen. This is the same shape of sanctioned override as the masthead's role text in 2.3, and like that one it deserves a comment so a later reader doesn't "fix" it.
- **The metadata row is a description list, not a flex row of spans.** §18.3 is specific about this: "the metadata row is a description list with visually hidden terms, so `14 min` is announced as 'reading time, 14 minutes'." So it is a `<dl>` of `<dt>` / `<dd>` pairs with `.visually-hidden` terms, laid out as a wrapping flex row — markup and appearance are two separate decisions here, and only the appearance is in §6·09. `base.css` already has the utility from 1.4.
- **The gutter duplicates the article number, and that needs checking against the screenshots.** §10.2 puts number / section / series in the gutter; §6·09's canonical metadata row _begins_ with the number. At ≥1280 both are visible, so `038` renders twice on one screen. §3.6's relocation table says the gutter's number moves into "the first line of the two-line metadata block" below 1280 — which is where the metadata row already puts it, so there is nothing to relocate and the duplication is desktop-only. That reads as deliberate (the gutter is the spine), but it is exactly the kind of thing to confirm against `docs/reference/article/1320-light.png` before building rather than after, in the same spirit as 2.1's note about the `minmax()` gutter tracks.

**Exit:** the header band matches the reference screenshots at 390 / 900 / 1320 in both themes; a 148-character title (T4's fixture) steps to 26px at 390 and wraps without truncation; the metadata row wraps to two lines at 390 in the same fixed order with no datum dropped.

#### 3.7 · The static TOC — a bring-forward, argued

Phase 5 owns "TOC island". **Recommend bringing the static TOC forward to here**, for the same reason stylelint moved to 1.6 and Playwright to 2.7: at ≥1280 the TOC _is_ the gutter track, and without it the phase's own exit criterion — "the article reads correctly at all six matrix combinations" — cannot honestly be judged at two of the six. What Phase 3 builds is the markup, the spine and the three responsive forms. Phase 5 keeps the island and wires the active state to a `.is-active` class that Phase 3 ships with nothing setting it.

It also costs less than it looks, given OD-10: the entries come from Astro's `headings`, filtered to numbered `h2`/`h3`. No `toc.ts` extraction is needed in this phase.

**One constraint is worth stating because it forces the markup shape.** §6·15 wants three forms: a sticky list at ≥1280, an **open** disclosure with a `CONTENTS — 6 SECTIONS` summary row at 760–1279, and a **closed** disclosure at <760. `open` is an attribute, not a style — CSS cannot toggle it at a breakpoint, and doing it with `matchMedia` would mean a fourth island, a flash of the wrong state on first paint, and a dependency on fragile UA `details` styling. So: **two nodes**, each `display: none` outside its range — a `<details open>` for ≥760 whose `summary` is hidden at ≥1280 (where §6·15 wants a plain list), and a plain `<details>` for <760. Neither element's `open` attribute ever has to change. Both carry `.gutter` and sit in source order before the prose, which is what lets one node serve two positions: at 760–1279 the grid is a single column so it lands "below the lead", and at ≥1280 `.layout-article`'s first track plus `.gutter`'s sticky rule from 2.1 put it in the gutter with no extra placement rule. The cost is a few hundred bytes of duplicated markup; `display: none` keeps the inactive one out of the accessibility tree, so nothing is announced twice.

The rest: `CONTENTS` label at `--t-label`, mono 11.5 entries on a 1px hairline spine with 12–13px left padding, `h3` entries indented a further 12px, `--toc-cap` (150px, another Phase 1 token used for the first time) as the internal scroll cap above 20 sections, and **absent entirely below three `h2`s** (§6·15, §21.3) — a build-time condition, not a CSS one, since the element should not exist rather than be hidden.

**Exit:** the TOC renders in all three forms at 1320 / 900 / 390; a fixture with two `h2`s renders no TOC element at all; keyboard navigation through the closed disclosure at 390 opens it and reaches every entry.

#### 3.8 · T3 checks 2, 3 and 7 — the ones Phase 2 deferred by name

§2.7 deferred the remaining seven T3 checks because they "assert things (type floors in prose, measure width, scroll regions) that don't exist yet". Three of them now exist, and all three are checks that prose can violate invisibly:

- **Check 2 · Type floors** — no computed `font-size` below 10.5px anywhere; body ≥ 17px at 390; metadata ≥ 11.5px; code ≥ 12.5px. **The code floor must be scoped to `pre code`**, not to all `code`: inline code in a mono caption legitimately computes to 10.5px under 3.4's `max()` clamp, and an unscoped assertion would fail on correct output.
- **Check 3 · Measure** — every prose block's content box ≤ 680px. **Scope to `.prose > *`**, not to the article: §10.2 explicitly permits header content to run to 760 (`--header-w`), so an article-wide assertion would fail on a correct header band.
- **Check 7 · Heading structure** — one `h1` per page, no `h4`, no skipped levels. Partly redundant with 3.3's build-time guard, which is the point: the guard sees the Markdown, this sees the DOM, and the references heading in 3.5 is exactly the kind of thing that passes one and not the other.

Two more are one-liners while the file is open and worth taking: **check 6** (computed `box-shadow` is `none` on every element) and **check 10** (with `prefers-reduced-motion: reduce`, every computed transition duration is `0s` — the direct test of 1.4's global override, which has never actually been asserted).

**A trap in the stub's exit criterion, worth fixing rather than inheriting.** It says "measure verified at **68ch** desktop / 38–40ch mobile". Do not write that as a `ch`-based assertion. CSS `ch` is the advance width of `0`, not the average width of a prose character, and for a serif face the two differ by several percent in the direction that matters here — 680px of Source Serif at 18.5px measures somewhere near 73 CSS `ch` while carrying the ~68 characters per line the design intends. (Measure it against the real subset file rather than taking that figure from me; the point is the discrepancy, not its size.) An assertion written in `ch` would report the measure as too wide and invite someone to "fix" it by narrowing `--measure`, which §22.10 forbids absolutely. **Assert 680px; verify the character count once, by hand, by counting a rendered line.**

One small refactor: `tests/e2e/chrome.spec.ts` hardcodes `const PAGE = '/dev/layout-check'`. Turn it into a list so the fixture route joins the matrix, rather than copying the file.

**Exit:** `pnpm check:e2e` runs checks 1, 2, 3, 4, 5, 6, 7 and 10 across 3 widths × 2 themes on both the chrome page and the article fixture; each newly added check is proven to fail on a deliberate violation and then pass once it is removed.

#### 3.9 · Extend the specimen page

Small, and it closes the gap that let 3.2's callout bug through. The specimen page (1.7) renders every `--t-*` bundle but nothing for a component-local `--fs-*` with no bundle behind it — which is why a 16px mobile callout sat in `tokens.css` unnoticed since Phase 1.

Add: the three callout kinds in both themes, a quote with attribution, a prose paragraph with an inline link, an external link, inline code and a footnote reference — and the new `--t-callout` bundle beside the existing ones. This keeps the page doing the job it was built for: "every subsequent phase's _does this look right_ question gets answered by comparing against this one page."

**Exit:** the specimen page renders every prose component in both themes at all three widths.

---

**Phase 3 overall exit criteria:**

- OD-10 (section-number authority) and OD-11 (paragraph → `h3`) resolved, with ADR-0018, and the three §10 conflicts corrected **at source** in `DESIGN_SYSTEM.md` — §06's mobile `h2` row, §10.5's 56, and §10.5's back-reference glyph.
- `docs/decisions/README.md` indexes every ADR on disk, and its next-number line is correct.
- `--fs-callout` renders 15.5px at 390 and 16px above; `--fs-callout-mobile` is gone.
- The Markdown pipeline fails the build on: an `h4`, an unknown directive, a nested callout, a code block inside a callout, and a non-contiguous section number — each proven by a deliberate violation.
- A 3,000-word real article renders correctly at 390 / 900 / 1320 in both themes, with code blocks, tables and figures present but deliberately unstyled pending Phase 4.
- Every glyph in the rendered article resolves from a subset font — no fallback-family glyph anywhere.
- A link broken mid-URL keeps its accent rule on both fragments, with no change in line height and no shadow property in the codebase.
- Callouts and quotes stay inside the text margin at every width; `.full-bleed` touches neither.
- The TOC renders in all three §6·15 forms, and is absent entirely below three `h2`s.
- T3 checks 2, 3, 6, 7 and 10 join 1, 4 and 5 in `pnpm check:e2e`, each proven to fail on a real violation.
- Measure asserted in **pixels** (≤ 680), not in `ch`.
- Still exactly the islands ADR-0017 budgets — the static TOC adds none.

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

**`dev/` exclusion:** immediately after `astro build`, before the rsync step, CI runs `rm -rf dist/dev`. This is the actual mechanism keeping the gallery and fixture pages (§3, §8) off production — Astro's routing has no concept of a dev-only page (see the Phase 1.2 correction above), so the exclusion has to live here instead.

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
