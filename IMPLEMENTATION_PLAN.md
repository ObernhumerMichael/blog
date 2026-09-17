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

**Corrected in Phase 5 (Finding B):** under AD-01's no-adapter constraint, Astro's static `redirects` config does not issue a real 301 — it emits a meta-refresh page (`noindex`, a canonical link, `content="0;url=…"`). A true 301 is a Caddy-layer feature, tracked as a named Phase 9 item once the deploy pipeline exists to generate and ship the redirect map.

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
│   │       ├── specimen.astro
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
- **The gallery page** (`dev/specimen.astro`, doing this job since Phase 3 — 8.4) renders all twenty components in every state (default / hover / focus / active / disabled / current) in both themes. `current`/`disabled`/`draft` are prop-driven per component; `:hover`/`:focus` are captured via real Playwright interaction (`locator.hover()`/`locator.focus()` in `visual.spec.ts`), not a parallel `.force-hover` CSS class — `:active` is deliberately skipped (8.4: pixel-identical to `:hover` for every component here).
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
3. Also pull the **twenty-component gallery** if Claude Design has one rendered — this seeds `dev/specimen.astro` (8.4: the page that has done this job since Phase 3) in Phase 7 and saves re-deriving component states from the spec text alone.

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

### Phase 4 · Code, terminal, figures, tables _(4–5 days — revised up from 2–3: the stub counts four components but the real work is a syntax-highlighting layer that has to be taken away from Astro's defaults first, an island that cannot reach the markup it belongs to, and three separate scroll regions that each own §10.11's absolute no-horizontal-page-scroll guarantee)_

Eleven sub-phases. Like Phases 2 and 3 this one opens with findings, and for the same reason: two of them invalidate work already committed, and one of them would have made every component in the phase silently wrong at desktop.

Three scope corrections to the stub, all of which change what "done" means:

- **The stub's exit criterion — "all twelve fixtures from T4 render correctly" — cannot be met in this phase.** Six of §25.6's twelve stress tests are machine-content cases and belong here: 210-character code line, 7-column table, 3840×2160 screenshot, image-free article, four consecutive code blocks, long caption. The other six (148-character title, 8 tags, 90-word article, 9,400-word / 34-section article, long URL in prose, project with no source) are either already covered by Phase 3 (long title, long URL) or depend on the collection schema, the conditional apparatus and the projects index, none of which exist before Phases 5–6. Building them here would mean authoring six fixtures against a schema that is still a stub. **Phase 4 owns six fixtures; Phase 6's exit inherits the remaining six.**
- **Inline code is not in this phase.** §13.4 landed in Phase 3.4 as a prose-typography rule. What remains of §13 here is §13.2, §13.3 and §13.5 — the two block components and their mobile behaviour.
- **Two new global stylesheets, not one.** §3's tree names `code.css`. Figures (§14) and tables (§15) are Markdown-generated too, so they need global CSS as much as code does, and all three share the caption (§14.2) and the scroll-region affordances (§10.11). Adding `blocks.css` beside `code.css` — shared caption/scroll primitives plus §14 and §15 — is the same category of small necessary addition as `fonts.css` in Phase 1.3 and `global.css` in Phase 2. Both go in `@layer components`.

#### 4.0 · Four findings, and two decisions that need your call

| #   | Finding                                                                                                           | Effect                                                                                                      | Status                                          |
| --- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| A   | **E6's container context is on the wrong element**, and the 700px query would match at every width                | Code, figures and tables would take their mobile treatment on desktop                                       | Resolved below; blocks 4.2, 4.6, 4.7 — ADR-0019 |
| B   | **Astro's default Shiki (`github-dark`) is live right now** and writes literal hex into inline `style` attributes | §2.3 violated on every code block in the build, invisibly to T2 (stylelint cannot see inline styles)        | Resolved in 4.1                                 |
| C   | **`filter` is on T2's `property-disallowed-list`**, and E15's dark-mode dimming needs `brightness()`              | A registered exception is unimplementable under the current lint config                                     | Resolved in 4.6 — narrow scoped override        |
| D   | **Astro already emits the diff `+`/`−` marker** as a `user-select: none` span, in ASCII                           | §13.2's "mandatory leading glyphs" is half-built already; the remaining question is ASCII `-` vs U+2212 `−` | Resolved below                                  |

**Finding A · the container query would match everywhere.** Phase 2.1 put `container-type: inline-size` on `.layout-measure`, per §5 of this document ("the article body wrapper"). The measure is 680px. E6's threshold is 700px. **A container that is 680px wide at desktop is under 700px at every width the site has**, so `@container (max-width: 700px)` would be permanently true and all three components would go full-bleed inside the measure at 1320 — the exact opposite of §14.3 ("media never extends beyond the measure at desktop; there is no full-bleed figure variant") and §13.5.

Measured in Chromium against the real Phase 3 fixture, not derived from the CSS:

| Candidate container                    | 390     | 900     | 1320     | `(max-width: 700px)` matches at |
| -------------------------------------- | ------- | ------- | -------- | ------------------------------- |
| `.layout-measure` / `.prose` (current) | 350     | 680     | 680      | **all three widths** — wrong    |
| Band content box (`.band` inner width) | **350** | **836** | **1208** | 390 only — correct              |

So E6's container is the **band-level body wrapper**, not the measure column: the element whose width is the page's content width, which is what actually tracks the viewport. Move `container-type: inline-size` off `.layout-measure` and onto the article body wrapper in `layout.css`, with the arithmetic in a comment so it isn't "tidied" back onto the measure later.

Two consequences worth stating rather than discovering:

- **A 5px disagreement window at the breakpoint.** With `--page-margin: 32` from 760 up, the band content box is 696px at a 760px viewport and 700px at 764px — so between 760 and 764 inclusive the container query still reads "narrow" while the media queries have already switched to tablet. A code block is full-bleed there while the prose around it uses tablet margins. This is cosmetically harmless (full-bleed at 760 looks like full-bleed at 759), and the alternative — moving the threshold to 696 — would contradict §4.2's single stated container breakpoint and T2's own (documented, unenforceable) 700px restriction. **Accept it and record it**; do not invent a third number.
- **`ProseLayout.astro`'s comment is wrong and must be corrected at source.** It records that adding `container-type: inline-size` to `.prose` "collapsed it to 0 width with the article's full height crammed into an unreadable single column." That does not reproduce: tested both ways in Chromium 151 — injected at runtime and declared statically in `prose.css` with a full reload — `.prose` measured 350 / 680 / 680 at the three widths, identical to baseline, with the container query correctly matching inside it. Inline-size containment does not opt a grid item out of stretch alignment (auto inline margins do, which is the neighbouring note in `prose.css`, and that one _is_ right). Whatever was seen there, it wasn't containment. Correct the comment when the container moves, and don't carry the folklore forward — the next person to need a container context will believe it.

**Finding D · the diff glyph.** `@astrojs/internal-helpers`' own Shiki wrapper already splits a leading `+`/`-` off each diff line into its own `user-select: none` span, so it survives copy-paste as absence rather than as a stray character. §13.2 writes the removal glyph as `−` (U+2212), which is in the font subset. **Keep the ASCII `-` in the code text anyway.** The code area is verbatim machine content; substituting a typographic minus into a diff would produce a hunk that doesn't apply if anyone copies it, and §13.2's `−` is describing what the reader sees, not asking for a character swap in the payload. Style the existing marker span; don't rewrite it.

##### OD-12 · How does a Svelte island reach markup generated inside Markdown? **(blocking 4.4)**

§13.2 requires a copy control on every code block. ADR-0017 assigns it to `CopyButton.svelte`. Those two are not currently reconcilable: the chrome bar is generated inside the Markdown pipeline, and Astro's `client:*` directives only exist in `.astro` and `.mdx` templates — a hast tree cannot instantiate an island. MDX is ruled out by AD-04 for exactly the reason that would apply here.

| Option                                                                                  | Cost                                                                                                                                |
| --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Mount one `CopyButton` per block from a script in the layout (`mount()` from Svelte 5)  | N component instances per page; re-implements hydration by hand; ADR-0017's "narrowest directive" rule stops meaning anything       |
| **One `CodeCopy.svelte` per page, `client:visible`, delegating clicks for every block** | One island regardless of block count; one `aria-live` region per button still needed; the button markup is server-rendered and real |
| Drop back to a vanilla inline script, as the theme resolver already is                  | Simplest, but reopens ADR-0017 two weeks after it was accepted, for the one behaviour that ADR explicitly kept                      |

**Recommendation: the middle one.** The chrome bar server-renders a real `<button hidden>` with its 44px target and mono 11 label; the single island un-hides every such button on mount and owns the delegated click, the clipboard write, and the 1.2s label swap. No JS, no dead control — which matters because a copy button that silently does nothing is worse than no copy button. It satisfies §13.2 (always present, label swap not a toast, politely announced), ADR-0017 (Svelte owns the interaction), and the bundle budget (one island, not one per fence).

##### OD-13 · How is a caption authored? **(blocking 4.8, and therefore 4.2/4.6/4.7's exit)**

§13.2, §14.2 and §15.1 all require a numbered caption — `Listing n —`, `Fig. n —`, `Table n —` — in mono 11.5 muted, below the block and, at mobile, _outside_ its full-bleed. Markdown has syntax for none of this. GFM tables have no caption at all, and a fenced block cannot carry four lines of prose in its meta string.

The Phase 3 fixture already improvised the convention: a paragraph immediately after the block, starting `Table 1 — …`. Formalise that.

**Recommendation: the caption is the paragraph immediately following the block, recognised by its `Fig. n — ` / `Listing n — ` / `Table n — ` prefix**, promoted into the block's caption slot by a remark plugin, with the numbers **authored, not generated** — the same trade-off OD-10 already settled for section numbers, decided the same way and for the same three reasons (one authoring model rather than two, the number is visible in the diff when it changes, and prose that says "see Listing 3" stays true because the author wrote both). A validator enforces contiguity from 1 per kind, and fails the build on a caption paragraph that follows nothing captionable, or a block whose caption is missing. Emphasis markers in the source (`_Table 1 — …_`) are dropped: the caption has its own type treatment and does not inherit italics.

The alternative — `:::figure{caption="…"}` and a `caption=` fence meta — puts unquotable prose inside an attribute string, and gives tables nowhere to live at all. Note that figures are the one kind where the caption sits _inside_ the directive, so the plugin handles two shapes; that's four lines of branching, not two mechanisms.

#### 4.1 · The Shiki layer — taking it away from the defaults

Finding B is live in `dist/` today: every `<pre>` carries `class="astro-code github-dark" style="background-color:#24292e;color:#e1e4e8"`, 29 inline hex colours across the fixture, and T2 cannot see any of it.

1. **Configuration goes at `markdown.shikiConfig` / `markdown.syntaxHighlight`, not inside `unified()`.** Verified against the installed `@astrojs/markdown-remark@7.2.4`: `UnifiedProcessorOptions` has no highlighting fields, and `AstroMarkdownOptions` documents `syntaxHighlight` and `shikiConfig` as "cross-cutting options … honoured regardless of which processor is selected." The Phase 3.3 comment in `astro.config.mjs` predicting this ("the Shiki theme is Phase 4's") is right about the phase and silent about the location; the location is the top level.
2. **Author `src/plugins/shiki-ledger-theme.json` against §2.3's seven roles, with `var(--code-*)` colour values** so the palette stays in `tokens.css` (AD-05) and the code block themes itself from the same file as everything else. The tokens already exist (`--code-fg`, `--code-kw`-family, `--code-hl-*`, `--diff-*`, added in Phase 1) — this maps TextMate scopes onto them. **Do not use Shiki's built-in `css-variables` theme**: it exposes nine roles, and it collapses `constant.numeric` and `constant.language` into one `token-constant`, so §2.3's separate literal/boolean (`oklch(0.74 0.12 300)`) and number (`oklch(0.80 0.09 60)`) cannot both be expressed. Checked in `@shikijs/core@4.4.3`'s `createCssVariablesTheme` source, not assumed from its name. That theme is still the proof that `var()` values are accepted where Shiki expects a colour, which is the mechanism the custom theme relies on — confirm it by building, since it's the one load-bearing assumption here.
3. **`excludeLangs: ['terminal']`.** A language in `syntaxHighlight.excludeLangs` is left entirely untouched by the highlighter — the `<pre><code class="language-terminal">` survives to the rehype stage as plain text. That is exactly what §13.3 wants: the terminal has no syntax highlighting, only a prompt glyph and a success token, and it is a separate component rather than a theme variant (§23.4). This is a cleaner boundary than registering a fake grammar.
4. **Fail the build on an unknown fence language.** Shiki's fallback is `console.warn` plus `plaintext`, which is how `jinja2` in the Phase 3 fixture has been silently rendering unhighlighted since it was written (`jinja` is the real grammar name; `jinja2` is not, and `@shikijs/langs` confirms only the former exists). A warning in a build log is not enforcement — Phase 3.3's discipline applies: add the language check to `remark-code-meta.ts` (4.3) against an explicit allow-list in `consts.ts`, and fail. Fix the fixture to `jinja`, matching §20.9's own language token.
5. **Install `@shikijs/transformers`** (AD-05) — it is not currently a dependency.

**Exit:** no hex literal appears in any built page's inline styles; a code block's colours change when a `--code-*` token changes; a fence tagged `jinja2` fails the build with a message naming the valid alternatives; a ` ```terminal ` fence reaches rehype unhighlighted.

#### 4.2 · `code.css` and the chrome — the block that isn't an embed

`global.css` already carries the `/* Phase 4: @import "./code.css"; */` stub. The tokens this needs that don't exist yet, in the shape Phase 3.2 established:

| Token                          | Value                             | Source                                                                                                                                                                            |
| ------------------------------ | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--code-chrome-muted`          | the language token's colour       | §13.2 says "mono 10.5 muted" — but `--c-muted` is theme-dependent and the chrome bar is not (E2). Needs its own value inside the code palette, like `--code-filename` already has |
| `--term-label`                 | host-label colour                 | §13.3's uppercase mono host label, same reasoning                                                                                                                                 |
| `--fs-term` / `--t-term`       | mono 13 / 1.8, 12.5 at <760       | §13.3. Not `--t-code`: different size _and_ different line height, and §23.4 exists to stop these two collapsing into one                                                         |
| `--fs-caption` / `--t-caption` | mono 11.5 / 1.6, **11 at mobile** | §14.2. `--fs-meta-sm` is 11.5 but constant; the mobile step is real                                                                                                               |
| `--sp-9`                       | 9px                               | §13.2's `9/14` chrome padding and §15.1's 9–11px row padding. Same class of value as `--sp-10` in Phase 3.4 — a gap in §25.2's audit of E13 sub-steps, not a new decision         |

Then the block itself, per §13.2 and §13.5. Four things that are not transcription:

1. **The scroll lives on the `<pre>`, and it is not yours.** Astro's wrapper appends `; overflow-x: auto;` to the `<pre>`'s inline `style` unconditionally. Inline styles beat every cascade layer, so `code.css` must work _with_ that, not declare its own `overflow` and wonder why nothing changes. Shiki also sets `tabindex="0"` on the `<pre>` already, which is most of T3 check 9 for code blocks for free — assert it rather than re-adding it.
2. **Radius requires a fill and the mobile block has none.** §2.9: full-bleed below 700 (container, per finding A) drops the radius and the side borders, leaving two hairlines. Because the escape is `.full-bleed`'s negative margin from Phase 2.1, the block spans the viewport while its caption does not — 4.8 owns that half.
3. **The light-theme border is the only thing that changes between themes** (§13.1, E2). One `border-color` declaration under the theme override; nothing else in `code.css` is theme-aware, and a reviewer should be able to confirm that by reading the file.
4. **Scrollbar colour is explicit.** `tokens.css` already carries the warning from Phase 1: `color-scheme: dark` on the code block would flip every token inside it and break §13.1's light-theme border. Use `scrollbar-color` with code-palette values instead — the note anticipated this component; this is where it gets consumed.

**Exit:** a code block matches `docs/reference/article/1320-light.png` at desktop and `390-dark.png` at mobile, including the chrome bar's filename/language/copy tracks; `pnpm check:css` passes; the block's ground is identical in both themes and only its border differs.

#### 4.3 · Meta, line numbers, highlighting, diff

The fence meta (` ```yaml title="…" {14-16} `) is silently dropped today — confirmed in the built output, which has no `title` attribute anywhere and every line as a bare `class="line"`.

**Where the chrome is built matters, because of one ordering fact:** `rehypeShiki` runs _before_ user rehype plugins, and it replaces the `<pre>` wholesale. A rehype plugin therefore cannot see `node.data.meta` — it is gone by the time the plugin runs. Two places still can: a **remark** plugin (mdast `code.meta` is a plain string on the node) and a **Shiki transformer** (Astro forwards meta as `{ __raw }`). Split the work along that seam:

1. **`remark-code-meta.ts`** — parses `title=`, `host=` and the highlight range, validates the language against the allow-list (4.1), validates a `title` is present on every non-terminal fence (§13.2 wants the **full repo-relative path**, and a basename should fail rather than degrade), and wraps the code node in the figure-shaped container that carries the chrome bar and the copy button. Wrapping in remark rather than rehype also keeps the wrapper outside the node Shiki replaces.
2. **Transformers, via `shikiConfig.transformers`** — `transformerMetaHighlight` for the `{14-16}` tint plus the 2px inset bar, and the line-number track. The number track is a **two-track grid with the numbers outside the scroll container** (§13.5), not `position: sticky` and not a `::before` counter: at column 60 a sticky number stops being that line's number. Numbers appear **only above twelve lines** (§13.2, and §25.4 confirms the rule is normative even though the reference frames show numbers on a four-line block — do not "fix" this to match the screenshot).
3. **Highlight geometry.** The tint spans the full scroll width, which means the tinted element must be as wide as the scroll content (`min-width: 100%` on the line, not a background on a fixed-width row), and the 2px bar is inset on the line so it stays visible at any scroll offset. §18.4: position _and_ tint, so it survives greyscale.

**Exit:** a 13-line block shows numbers and a 12-line block does not; the highlight tint reaches the right-hand end of a 210-character line and the accent bar is still visible after scrolling to it; a `title=` naming only a basename fails the build.

#### 4.4 · The copy control (OD-12)

`CodeCopy.svelte`, one instance per article, `client:visible`, delegating for every `[data-copy]` in the body. Server-rendered `<button hidden>` in the chrome bar: mono 11, `--radius-sm`, hairline in `--code-control-border`, 44px target, label `copy`. On activation: clipboard write, label → `copied` for 1.2s, border takes `--c-accent`, announced through an `aria-live="polite"` span — a text change, not a toast, not an animation (§13.2). Hover lightens border and label (§16.2). Failure path: the clipboard API can reject (permissions, insecure context) — swap the label to `failed`, restore after the same 1.2s, and don't throw.

**Exit:** copy works from every block on the page with one island in the bundle; with JS disabled no control is shown; the label change is announced; `pnpm check:svelte` passes.

#### 4.5 · Terminal block — a separate component, deliberately

§23.4 documents the confusion risk in advance, so the test of this sub-phase is whether the two components share code they shouldn't. They share the caption and the scroll region; they share nothing else.

Per §13.3: `--c-term-bg` ground (one step below code), uppercase mono host label `TERMINAL — PI-02` at 10.5–11px / +0.1em above a `--term-chrome-rule` hairline, `$` prompt in `--term-prompt`, `--term-fg` foreground, success tokens in `--term-success`, mono 13 / 1.8 (12.5 at <760). **No line numbers, no copy control, no language token, no filename.** Identical at every width — the `@container` rule that makes the code block full-bleed applies to the terminal only for the full-bleed itself, not for type or chrome.

The prompt and success token are the one place a "highlighter" is written by hand: a small rehype pass over the excluded-language block that wraps a leading `$ ` and `[+]`-style success markers. Keep it to those two; §13.3 lists exactly two coloured things, and a third would be a syntax theme by the back door.

**Exit:** code and terminal blocks sit adjacent in the fixture and are visibly different objects at all three widths in both themes; the terminal has no copy control and no numbers at any width; four consecutive blocks alternate grounds and keep 24px of page ground between them (§10.10).

#### 4.6 · Figures — the directive, the `kind`, and the dimming exception

`remark-directives.ts` currently throws on `:::figure` by name, with a comment pointing at this phase. Extend it rather than adding a second plugin.

- **`kind` is required, and its absence fails the build.** `diagram | screenshot | photo` (§7.3 of this document): E15 and §2.2 deviation 6 dim diagrams and photos to ~92% in dark mode and leave screenshots untouched, and nothing in the markup can infer which is which. Screenshots additionally sit on `--c-sunken` with a `--c-rule` border (§14.1) so a light UI capture does not bleed into a light page.
- **Finding C · the dimming needs `filter`, which T2 forbids.** `property-disallowed-list` bans `box-shadow`, `text-shadow`, `filter` and `backdrop-filter` — written against §2.10 and §1.12, which are about shadows and blur, not about brightness. `opacity: 0.92` is not a substitute: it composites the image against the page ground rather than darkening it, so it lightens a dark-on-transparent diagram instead. **Add a stylelint override permitting `filter` in `blocks.css` only**, in the `exceptions` layer, with the comment naming E15 — the same pattern as the `tokens.css` and `fonts.css` overrides that already exist, and the fourth registered exception to need CSS.
- **The image itself goes through `astro:assets`.** Keep the mdast `image` node intact inside the directive rather than emitting raw HTML: Astro's `remarkCollectImages` runs after user remark plugins, so a real image node still gets `srcset`, intrinsic `width`/`height`, a modern format and `loading="lazy"` — §14.4's "3840×2160 served at 780w" is the pipeline's job, not a manual `<img>`'s. This only applies to sources relative to the Markdown file; the Phase 3 fixture's `/dev/homelab-architecture.svg` comes from `public/` and is passed through untouched. T4's 4K fixture must therefore use a **collection-relative asset**, or it will prove nothing.
- **Height cap 65vh at every width** (`--img-cap`, another Phase 1 token used for the first time), sizes by role from `--fig-h-*`, square corners, no shadow, no device mock.
- **Alt text is non-empty, always** (§18.6, cross-entry invariant 7). Fail the build on an empty alt inside a `:::figure` — decorative images do not exist in this design, so an empty alt is an authoring mistake by definition.
- **Tap-to-full-size below 760** (§14.3, §14.4) is a `<a href={src} target=_self>` wrapper on wide diagrams — no lightbox, no island, no overlay. §12 has no modal and this is not the place to invent one.

**Exit:** a diagram dims in dark mode and a screenshot beside it does not, verified by eye against `docs/reference/article/390-dark.png` and by a computed-style assertion; `:::figure` without a `kind` fails the build; an empty alt fails the build; the 4K fixture ships a width-appropriate modern-format source.

#### 4.7 · Tables — the scroll region

A rehype plugin (`rehype-table-region.ts`, running after Shiki like everything else in that stage) wraps every `table` in the region §15.2 specifies. The table markup itself is GFM's; the region and the affordances are ours.

- **Sticky first column** on the page ground, so a value is never orphaned from its row label. Note that §15.1 forbids vertical rules — the pinned column is separated by ground, not by a border.
- **Two affordances, both required**: a `--scroll-fade` (26px) ground-coloured fade on the overflowing edge, and a mono `scroll →` marker on the caption line that flips to `← scroll` at the end and disappears when everything fits. The marker is the only part of a table that needs JS-free state — do it with `scroll-driven` detection via the same mechanism 2.6 chose for the masthead ground, or accept a static marker; **do not add an island for it.**
- **Focusable and arrow-scrollable**, `role="region"`, `aria-label` from the caption (§15.2, §18.2 — the commonly-missed half, and T3 check 9). Unlike code blocks, nothing adds `tabindex="0"` for you here.
- **No hover on data rows** (§15.1, §23.4). Worth a comment in `blocks.css`: index rows _do_ have one and they look identical.
- **Never reflows to cards.** Cell floor mono 12.5. Head row `--t-label` above a `--c-rule` hairline, `--c-rule-2` top rule, `--c-rule-in` between rows, no bottom rule on the last row, no zebra.
- **Prose cells and alignment are authored, not inferred**: identifying column left, numeric and date columns right (§15.1); a column carrying explanation rather than data is sans 13.5 `--c-text-2`. GFM's `---:` alignment syntax covers the numeric case; the prose-cell case needs a convention — reuse the column-alignment marker rather than inventing an attribute, and document that a left-aligned non-first column renders as a prose cell.
- **At tablet**: in the measure normally, a scroll region early above five columns.
- **E7 middle-truncated digests** — the only content truncation in the system besides E8. Implement as a `<span title>` with the full value, so hover and copy both give the whole string.

**Exit:** the 7-column fixture at 390 pins its first column, shows both affordances, and the page does not scroll sideways; the region is reachable by Tab and scrollable by arrow key; no data row has a hover state; a digest cell copies its full value.

#### 4.8 · Captions and the numbering validator (OD-13)

One small plugin closing three components at once, and the thing that makes §5.5's most-cited rule real: **the caption stays inside the 20px text margin while the block goes full-bleed** — implemented as caption-outside-the-bleed-wrapper, not as padding on the block (§7.3 of this document, and §5.5's own note that this is what keeps a full-bleed block attached to the article).

The validator mirrors `remark-section-numbers.ts`: contiguity from 1 per kind, three independent counters, build fails on a gap, a duplicate, or a caption paragraph that follows nothing captionable. Terminal blocks share the code counter — the reference frames caption a terminal as `Listing 2`, which is the only evidence either way and is consistent with §14.2 giving `Listing n —` to "code" as a category rather than to component 19 specifically.

Caption type is `--t-caption` in `--c-muted`, 10px below the block (`--sp-10`), 32px to the following prose. No length limit (§14.2, and T4's long-caption fixture).

**Exit:** every block in the fixture has a numbered caption; renumbering one out of sequence fails the build; a caption stays inside the text margin at 390 while its block spans the viewport, verified at all three widths.

#### 4.9 · The six machine-content fixtures (T4)

Under `src/pages/dev/fixtures/`, each routable and each in the T3 matrix: **210-character code line · 7-column table · 3840×2160 screenshot · image-free article · four consecutive code blocks · long caption.** The remaining six from §25.6 are listed in Phase 6's exit criteria instead of being faked against a stub schema here.

These are the highest-leverage part of the enforcement system precisely because they are the cases real content hits and hand-checking misses. Author them as real content — a real 210-character `kubectl` line, a real seven-column benchmark table — for the same reason Phase 3.1 rejected lorem ipsum.

**Exit:** all six render at 390 / 900 / 1320 in both themes and pass every T3 check now wired.

#### 4.10 · T3 checks 8 and 9, and the horizontal-scroll check that finally has teeth

- **Check 9 · scroll regions are focusable and arrow-scrollable** — code blocks, terminal blocks and tables. Deferred from Phase 2.7 by name because none of the three existed. Assert both halves: `tabindex` reachable, and `scrollLeft` actually moves on `ArrowRight`.
- **Check 8 · contrast** — axe-core plus direct assertions on the documented §18.1 ratios. Brought forward here rather than left to Phase 8 because §2.3's seven roles are the one palette in the system held to a lightness band rather than to a contrast ratio, and this is the moment they first render.
- **Check 1 · no horizontal page scroll** has been passing since Phase 2 against pages that could not violate it. With a 210-character code line and a seven-column table in the matrix it becomes the check the plan always claimed it was (§10.11, "the single highest-value automated check in the whole system"). Prove it again on the new fixtures, and prove the failure direction: remove the `overflow-x` on a `pre`, watch it go red, put it back.

**Exit:** `pnpm check:e2e` runs checks 1–10 except 4's row-height half across both existing pages plus the six new fixtures; each newly added check is proven to fail on a deliberate violation and pass once removed.

#### 4.11 · Extend the specimen page

Per the precedent 3.9 set — the specimen page is where a token with no bundle behind it stops hiding. Add: a code block with and without line numbers, with a highlighted line and a diff hunk; a terminal block; all three figure kinds side by side in both themes (the only place the E15 distinction is visible as a comparison rather than one image at a time); a table with a prose cell, a right-aligned numeric column and a truncated digest; and the three caption forms.

This also seeds the same specimen page's own extension in Phase 7 (8.4: it was always `dev/specimen.astro`, never a separate `gallery.astro`) with five of the twenty components already rendered in their states.

**Exit:** the specimen page renders every §13/§14/§15 component in both themes at all three widths.

---

**Phase 4 overall exit criteria:**

- E6's container context sits on the band-level body wrapper, with the 350 / 836 / 1208 arithmetic recorded, and the 700px query matches at 390 only — ADR-0019.
- `ProseLayout.astro`'s containment comment is corrected at source rather than carried forward.
- OD-12 (island-in-Markdown) and OD-13 (caption authoring) resolved and recorded.
- No built page contains an inline hex colour; the code palette is driven entirely from `tokens.css`.
- The build fails on: an unknown fence language, a fence without a repo-relative `title`, a `:::figure` without a `kind`, an empty alt, and a caption number out of sequence — each proven by a deliberate violation.
- `jinja2` in the Phase 3 fixture is corrected to `jinja`, and had been silently rendering as plaintext since Phase 3.1.
- Code and terminal are two components sharing only the caption and the scroll region.
- Line numbers appear above twelve lines and not at twelve, in both the reference-screenshot case and the fixture.
- A diagram dims in dark mode; a screenshot does not; `filter` is permitted in exactly one file, scoped to E15.
- Captions stay inside the text margin at 390 while their blocks span the viewport.
- The page scrolls horizontally at no width, on any of the six new fixtures, with a 210-character code line and a seven-column table present.
- Every scroll region is focusable and arrow-scrollable.
- Still one island per behaviour, not one per block; bundle stays inside ADR-0017's 10KB gzip budget.

### Phase 5 · Content model and the article page _(2–3 days — revised up from 1–2: the fixture and the real collection turn out to disagree on two data shapes, T1 has no obvious way to run without fighting Astro's virtual module system, and AD-10's "301" is not a thing a static build with no adapter can actually issue)_

Twelve sub-phases. Like Phases 2–4, this one opens with findings — surfaced by actually building throwaway probe pages against a real collection entry and a real static build, and reading the installed Astro source, not by re-reading the plan's own prose.

Two scope corrections to the stub, both narrowing it:

- **The `projects` collection schema lands here; the `projects` pages do not.** The stub's "collections, schemas" is plural and the phase title says "content model," which covers both collections defined in AD-03 — but Phase 6 is titled "Writing index and projects" and owns the projects index and detail pages. Building the schema without a page to render it against is exactly Phase 3.1's situation with `writing`, so the same fix applies: land `content.config.ts`'s `projects` schema and its cross-entry rules now, alongside `writing`'s, and leave the pages themselves — and therefore the `project with no source` and `8 tags` T4 fixtures, which need an index page to render into — to Phase 6.
- **Two of Phase 4.9's six deferred T4 fixtures move here.** Phase 4.9 punted all six remaining stress-test fixtures to "Phase 6's exit inherits" without checking which actually depend on the projects index. Two don't: the **90-word article** (no TOC, no author block, no related list) and the **9,400-word / 34-section article** (TOC's 150px scroll cap, the split-above-8,000-words rule) are both `writing` entries, provable the moment `/w/[num]` exists. Phase 6 inherits the other two — **8 tags** (needs the tag filter row) and **project with no source** (needs the projects index item).

#### 5.0 · Four findings and one deliberately dropped feature

| #   | Finding                                                                                                          | Effect                                                                                                                                                                            | Status                         |
| --- | ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| A   | **`render(entry)` does not merge `remarkPluginFrontmatter` into `entry.data`** — confirmed by probe, not assumed | `wordCount`/`minutesRead`/`numberedHeadingFlags` would silently be `undefined` on the real article page, which the fixture's `layout:` mechanism never exposed as a risk          | Resolved in 5.4                |
| B   | **A static `redirects` entry is not a 301** — confirmed by reading the installed `astro` source, not the docs    | AD-10 states "issuing a 301"; under AD-01 (no adapter) that is not literally true                                                                                                 | Resolved below, corrects AD-10 |
| C   | **`@astrojs/sitemap` will list every routable page by default**, `/dev/*` included                               | The gallery and fixtures — fully routable since the Phase 0.1.2 correction — would ship in `sitemap.xml`                                                                          | Resolved in 5.10               |
| D   | **The `series` schema in the Phase 3.6 fixture has no stable key** — it carries `name`, not `id`                 | Cross-entry invariant 3 ("every `series.id` has entries covering 1…total") has nothing to group by; a typo'd display name would silently start a second series instead of failing | Resolved in 5.1                |

**Finding A, in detail.** A throwaway probe page (`getCollection('writing')` + `render(entry)` against a scratch entry, deleted once answered) returned `{ Content, headings, remarkPluginFrontmatter }` — three separate values, no automatic merge with `entry.data`. This is a different contract from the one `ProseLayout.astro` was built against: a `.md` page using the `layout:` frontmatter key (the Phase 3.1 fixture's own mechanism) gets `remarkPluginFrontmatter` folded into `Astro.props.frontmatter` by Astro itself, which is why `ArticleHeader.astro`'s comment could say `wordCount`/`minutesRead` "show up on this same `frontmatter` prop already flowing in" without anyone having to merge anything. A real collection entry gets no such courtesy. `/w/[num].astro` (5.4) has to build that merged object itself: `{ ...remarkPluginFrontmatter, ...entry.data }`, schema-validated fields last so a coerced `date` or a trimmed `title` wins over the raw pre-Zod copy `remarkPluginFrontmatter` also happens to carry.

One more asymmetry the same probe surfaced, worth fixing while `ArticleHeader.astro` is open anyway: its `Frontmatter.date` is typed `string`, because the fixture bypasses collections and Astro never coerces a `layout:` page's frontmatter. A real `writing` entry's `date` will be a schema-coerced `Date` — `new Date(frontmatter.date)` already handles both identically at runtime (the constructor accepts a `Date` or a string equally), so the only change is the type: `date: Date | string`. Not a rewrite, one word wider.

**Finding B, in detail — corrects AD-10.** `node_modules/astro/dist/core/routing/3xx.js` is the actual template a static build emits for a redirect page: `<meta http-equiv="refresh" content="…;url=…">` plus `<meta name="robots" content="noindex">` and a `<link rel="canonical">`. The 301 path (`node_modules/astro/dist/core/redirects/render.js`, a real `Response` with `status: 301`) only runs under a server adapter — which AD-01 forbids. So AD-10's "issuing a 301" describes an SSR feature this project cannot use by its own architecture.

Confirmed by building, not just by reading the source: a throwaway `Astro.redirect('/w/001')` page, built with this project's real `output: 'static'` config, produced exactly that template — and the delay is **not** always instant. `redirectTemplate`'s own logic is `status === 302 ? 2 : 0`, and `Astro.redirect(target)` with no explicit status defaults to 302 — the first build produced `content="2;url=/w/001"`, a visible two-second pause before the client-side hop. Passing the status explicitly, `Astro.redirect(target, 301)`, changed the output to `content="0;url=/w/001"` on a second build — instant, matching what a reader following a shared link should experience. **The status argument is not optional**, it's the difference between an invisible redirect and a two-second stall.

Two further consequences:

- The `noindex` on the redirect page is the wrong signal for a page whose only job is to point at a canonical URL — it tells crawlers not to index a page that's supposed to hand them onward, not to disappear. Harmless for the reader once the delay is fixed to 0, cosmetic for search engines.
- A **real** 301 is a Caddy-layer feature, not an Astro one, and Caddy already serves the site (§10). Building that now — before there is a single real article, a single chosen slug, or a mechanism for content-driven redirects to reach Caddy's static config without breaking the "GitHub Actions owns deploy events, Ansible owns server state" boundary §10 already draws — is solving a problem that doesn't exist yet.

**Recommendation: ship the Astro static redirect in this phase, accept the `noindex` cosmetic cost, and open the real fix as a named Phase 9 item** ("upgrade `/writing/<slug>` from a static meta-refresh to a Caddy 301, once the deploy pipeline that would generate and ship the redirect map exists to receive it"). This is deferral with a name and a destination, not a silent gap — the same treatment OD-01 gives search. AD-10 gets a one-line correction; see below.

**The dropped feature.** §6's own schema table already sanctions a fallback: "`parts` (auto-split above 8,000 words, E14 — **or at minimum a build warning** telling you to split it manually)." Full auto-splitting means turning one Markdown file into N generated pages with generated series metadata and cross-linked navigation — real, speculative machinery for a document nobody has written yet, and a naive word-count split would butcher mid-section regardless. Take the plan's own sanctioned fallback: **a build **warning**, not a build feature**, when a `writing` entry exceeds 8,000 words. `series`-based manual splitting (author writes `part-1.md`, `part-2.md`, each with its own `series` block) already works with nothing further built — series navigation is 5.8's job either way. Revisit auto-splitting if a real 9,000-word draft ever shows up unsplit; nothing here forecloses it.

##### Resolved without a finding table row, because each has one clearly correct answer

- **Numbering contiguity must include drafts.** §6's schema table excludes drafts "from prod build and from counts," but says nothing about contiguity. A draft occupies its number the moment it's authored — queuing article 006 as a draft while 005 is still unpublished must not fail the build, and cross-entry invariant 1's own stated purpose ("a gap means a **deleted** permalink") only makes sense if drafts hold their place in the sequence. The invariant in 5.3 checks contiguity across every entry, published or not; only the reader-facing **counts** (`Writing 3`) filter drafts out.
- **Prev/next is numeric adjacency, not literally `series`-aware.** §10.7's worked example (`← 037 · previous in series`) happens to show a series article, which reads as if prev/next walks the `series` field — but that would leave every non-series article (the majority, by AD-03's own framing) with no prev/next at all, which nothing else in §10 supports, and the series relationship is already fully surfaced by the gutter/metadata series line (component 09, already built in Phase 3.6). Prev/next in 5.8 is adjacent-by-article-number, full stop; the worked example's wording is imprecise, not a second navigation mode to build.
- **`related`'s result count is an invented number**, same category as OD-11's spacing value: nothing in DESIGN_SYSTEM.md states how many related items to show. Four — a clean two-row fill of the two-column grid §10.7 already specifies, and it matches the homepage's own "four rows of writing" density elsewhere in §21.5. Recorded here rather than silently picked, in case a real archive of related articles makes four feel thin or crowded once it exists.

#### 5.1 · Finish `content.config.ts` — both collections

1. `writing`: `number` (`z.number().int().min(1).max(999)`), `title`, `lead` (refined: no blank line, i.e. no double newline), `section` (`z.enum([...])` — the section list isn't stated anywhere in DESIGN_SYSTEM.md as a closed set beyond the worked examples `Infrastructure`/`Security`; treat it as closed anyway, for the same drift-prevention reason as the tag registry and `CODE_LANGS`, and extend the enum the first time a real article needs a new one), `date` (`z.coerce.date()`), `updated` (`z.coerce.date().optional()`, refined `> date` by more than a day), `tags` (`z.array(z.string()).min(1).max(3)`), `series` (`z.object({ id: z.string(), name: z.string(), part: z.number().int(), total: z.number().int() }).refine(part <= total).optional()` — **`id` is new**, per Finding D; a slug-shaped grouping key, separate from the display `name`), `featured` (`z.boolean().optional()`), `draft` (`z.boolean().default(true)` — default stays `true`, per OD-03's "drafts exempt" framing: a forgotten `draft:` line must fail closed, not silently publish).
2. `projects`: `number` (1–99), `title`, `description` (58ch guidance, not enforced — a Zod `max` would fight real titles the design's own "wraps to three lines rather than shrinking" rule already accepts), `why` (optional), `stack` (`z.array(z.string()).min(3).max(6)`), `status` (`z.enum(['active', 'maintained', 'paused', 'archived'])`), `period` (`z.object({ from: z.coerce.date(), to: z.coerce.date().nullable() })`), `caseStudy` (bool), `links` (`z.object({ article: z.string().url().optional(), source: z.string().url().optional() })`), `sourceAbsence` (`z.string().optional()`, cross-checked in 5.3 against `links.source`'s absence rather than in the schema itself — Zod's `superRefine` can express "required when a sibling is missing," but the resulting error is a generic Zod issue rather than the specific "state the absence" message §11.1 is actually about; a named invariant test gives a better failure message for the one field in this schema that's a content-quality rule, not a shape rule).
3. **Fix the fixture, not just the schema.** `src/pages/dev/fixtures/article.md`'s `series:` block gets an `id: declarative-homelab` line alongside its existing `name`. `ArticleHeader.astro`'s `Series` interface and its `frontmatter.date` type get the two widenings from Finding A. Both are one-line changes to files nothing else in this phase touches structurally.
4. **`section` needs a first real value list**, since the enum has to be non-empty to compile. Seed it from what's already authored: `['Infrastructure', 'Security']` (the fixture's own section, plus OD-02's `Security` for CTF writeups) — extending a two-item enum later is cheap; inventing five speculative sections nobody's written toward is not.

**Exit:** `pnpm check:astro` passes with both schemas real (no more `title` + `draft` stub); the fixture's frontmatter validates against the real `writing` schema if pointed at it, proving the schema didn't just get written to match itself; `series.id` exists on the fixture and on the `Series` interface.

#### 5.2 · The tag registry

`consts.ts` gets a `TAGS` export in the same shape as `CODE_LANGS` and `FIGURE_KINDS` — a `readonly [...] as const` array, one canonical lowercase form per tag, no `#`. Seed it from the fixture's own tags (`ansible`, `infrastructure`, `homelab`) plus the two OD-02 names (`ctf`, `security`) already promised in AD-03's table. This is the smallest possible version of the registry: it exists so 5.3's invariant 4 has something to check against, and it grows by one line the first time a real article needs a tag that isn't there yet — same extension discipline as `CODE_LANGS`'s own closing comment.

**Exit:** `TAGS` exported from `consts.ts`; a tag used in content but absent from `TAGS` is a real, provable failure (proven in 5.3, not here).

#### 5.3 · Cross-entry invariants (T1) — and how to run them without fighting Astro

`tests/invariants/` is an empty `.gitkeep` today, and `check:content` is a literal `echo 'TODO Phase 5' && exit 0`. The obvious approach — write `node:test` files that `import { getCollection } from 'astro:content'` — doesn't work outside Astro's own Vite pipeline; that's a virtual module, not a real file, and `node --test` has no Vite underneath it. The two real options:

| Option                                                                                                                                                                                                                                            | Cost                                                                                                                                                                                                           |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Switch `tests/invariants/` to Vitest with `getViteConfig()` (Astro's documented testing pattern)                                                                                                                                                  | A second test runner beside Playwright's own runner, for five checks, when the plan's own repo tree already commits to `node:test` here                                                                        |
| **Read the Markdown files directly** — `node:fs` glob + `gray-matter` for the frontmatter block, validated against the **same Zod schema** `content.config.ts` exports (import it directly; a Zod schema is a plain object, not a virtual module) | One small dependency (`gray-matter` — parses exactly this, nothing more, the same category of addition as `js-yaml` would be); re-implements zero validation logic, since the schema is imported, not re-typed |

**Recommendation: the second.** It's also the pattern already proven twice in this repo — `scripts/verify-fonts.mjs` and `verify-tokens.mjs` both read source files with plain `node:fs` rather than reach for a framework-aware tool, for the same reason: the check is fundamentally "read some files and assert something," and Astro's own pipeline is more machinery than that needs. `gray-matter` is a genuinely new dependency, not an existing one doing double duty — justified because hand-rolling a YAML frontmatter parser is exactly the kind of "looks like a few lines, is actually a correctness trap" job this plan elsewhere refuses to DIY (fallback font metrics, the Shiki theme, the digest truncation — anywhere real parsing is involved, it reaches for a real parser).

Checks, each a separate `node:test` in `tests/invariants/`, mirroring §6's numbered list:

1. **Numbers unique and contiguous from 1**, per collection, **including drafts** (see 5.0's resolved note).
2. **At most one `featured: true`**, per collection.
3. **Every `series.id` groups a contiguous 1…`total` with no duplicate `part`**, and every member's `total` agrees.
4. **Every tag is in `TAGS`** (5.2).
5. **Every internal link in prose resolves to a real route** — this one can't be a pure frontmatter check, since the links live in the Markdown body, not the frontmatter block `gray-matter` extracts. Walk the raw body with a regex for `](/...)`-shaped internal links (a real parse is overkill for "does this path exist as a file/route," and the body is already trusted authored content, not user input) and check each target against the actual `src/pages` + collection-derived route list.
6. **`sourceAbsence` is present whenever `links.source` is absent**, `projects` only (the Zod `superRefine` case from 5.1, moved here for the message quality reasoning already given).

Invariants 6 (no `h4`) and 7 (non-empty alt) from §6's own list are **not** re-implemented here — they're already build failures via `remark-heading-depth.ts` (Phase 3.3) and the figure directive's alt check (Phase 4.6), enforced on every Markdown file regardless of which collection it belongs to. Duplicating them as a second, slower check would be the "second layer of defence" pattern this codebase already uses sparingly and by name (`rehype-table-region.ts`'s own comment) — not the default.

**Exit:** `check:content` in `package.json` runs the real suite, not the stub; each of the six checks is proven by deliberately breaking one entry, watching it fail with a message naming the offending file, then fixing it — the 1.6 discipline, applied to content instead of CSS.

#### 5.4 · `/w/[num].astro` — the article page

1. `getStaticPaths()` over `getCollection('writing', (e) => import.meta.env.PROD ? !e.data.draft : true)`, `params: { num: String(entry.data.number).padStart(3, '0') }` — the **route param is the zero-padded string**, not the raw number, so `/w/1` is a 404 and only `/w/001` resolves, matching AD-10 literally rather than relying on Astro to zero-pad for you.
2. `const { Content, headings, remarkPluginFrontmatter } = await render(entry)`, then build the single merged `frontmatter` object per Finding A: `{ ...remarkPluginFrontmatter, ...entry.data }`.
3. Compute prev/next by number (5.0's resolved note) and related (5.8) from the full non-draft entry list, sorted once.
4. Render through `ProseLayout.astro` (unchanged from Phase 3/4's shape) with `<Content />` in the slot, plus the new apparatus block (5.8) and aside (5.7) ProseLayout doesn't yet render.
5. **Draft visibility**: a draft renders in `astro dev` and is excluded from `getStaticPaths` in a production build — not rendered-but-noindexed. A draft permalink that resolves in production is a permalink, and permalinks are permanent (AD-10); the only safe state for unpublished content is "the route doesn't exist yet."

**Exit:** the three real articles from Phase 10's own "already half-written" list (or three placeholder equivalents, if Phase 10's content isn't drafted yet) render end-to-end at `/w/001` etc.; a `draft: true` fourth entry 404s in a production build and renders in dev; `wordCount`/`minutesRead`/the TOC's numbered headings all populate correctly, proving Finding A's merge.

#### 5.5 · `/writing/[slug].astro` — the redirect, and the AD-10 correction

1. **Not `astro.config.mjs`'s `redirects` map.** That option is a static, hand-typed table resolved before the content layer exists — `astro:content` isn't reachable from the config file, so a per-entry, collection-derived slug can't populate it without either hardcoding every slug by hand (defeats the point) or reaching for a module the config loader can't see. The correct shape is an ordinary dynamic route: `src/pages/writing/[slug].astro`, `getStaticPaths()` over `getCollection('writing')` returning `{ params: { slug }, props: { num: String(entry.data.number).padStart(3, '0') } }` per entry, and the page body doing exactly one thing — `return Astro.redirect(`/w/${num}`, 301)`. The explicit `301` argument is load-bearing per Finding B; omitting it silently reintroduces the two-second stall.
2. A `slug` field the schema doesn't currently have — derive it at build time from the title (kebab-case, ASCII-folded) rather than requiring authors to hand-write a second identifier that can drift from the title.
3. Per Finding B: this ships as Astro's static meta-refresh (now a zero-delay one), not a 301. Add the one-line correction to AD-10 (below) and open the named Phase 9 item.
4. **AD-10 correction** (apply to §1's text now): after "Add a slug alias `/writing/<slug>` issuing a 301 to `/w/<num>`," append — _"Corrected in Phase 5 (Finding B): under AD-01's no-adapter constraint, Astro's static `redirects` emits a meta-refresh + `noindex` + canonical link, not a real 301. A true 301 is a Phase 9 Caddy-layer item, tracked there."_

**Exit:** `/writing/a-reproducible-homelab` (or whatever the real first slug is) redirects to `/w/001`; the canonical `<link>` on the redirect page points at `/w/001`; the Phase 9 roadmap entry names the real-301 upgrade explicitly (see the roadmap edit below).

#### 5.6 · The TOC + progress island — AD-11's third and last

Per AD-11's own table, this is **one** island doing two jobs, not two islands — `ArticleToc.astro` (Phase 3.7) built the static shape and left `.is-active` for "Phase 5's scroll-spy island," and §10.8's progress bar has had no producer since it was first named. One `TocProgress.svelte`, `client:visible` (mounted once per article, same delegation shape as `CodeCopy.svelte` from 4.4 — consistent budget, not a new pattern), owning:

1. **Active TOC item.** One `IntersectionObserver` over every numbered `h2`/`h3` (rehype-toc.ts's own `numberedHeadingFlags` — already computed, already reaching the client-rendered headings by `id`), toggling `.is-active` on the matching TOC entry. §15's own rule: **no transition, no smooth-scroll hijack** — a class swap, not an animation, which conveniently means this island adds nothing to the motion-token surface Phase 1/2 already built.
2. **Reading progress.** `scrollY` against `document.documentElement.scrollHeight` on scroll (throttled via `requestAnimationFrame`, not a scroll listener firing unthrottled — the kind of detail that's invisible until a real Lighthouse run in Phase 8 counts main-thread time), writing the percentage into the aside's `read n%` text and the 2px bar's `width` — and, below 1100 per §10.9, the same bar under the masthead instead.

**Exit:** scrolling the fixture article through its sections updates exactly one active TOC entry with no visible transition; `read n%` and the bar track scroll position at all three widths; still three islands total, matching ADR-0017's budget with nothing added.

#### 5.7 · The aside (§10.8)

`ProseLayout.astro`'s own comment already flags this as missing ("no aside content (share/progress are Phase 5)"). Sticky 200px column, mono 11.5/1.9 muted: `share ↗` (native `navigator.share()` where available, falling back to a `mailto:` composed link — no share-sheet polyfill, no new dependency, no island: a plain `<a>` whose `href` is computed at build time per article), `reply by email ↗` (a `mailto:` to the address in `consts.ts`), `edit on github ↗` (the repo path to this exact Markdown file — `github.com/<user>/<repo>/edit/main/src/content/writing/<file>` — blocked on `GITHUB_URL`'s own still-unset placeholder in `consts.ts`, same OD-07-adjacent "placeholder now, one-line fix later" treatment), then the progress bar from 5.6. Below 1100, per §10.9: share moves to the end of the article, progress becomes the under-masthead bar, the rest of the aside's content has nowhere to go and isn't rendered there — it was never relocated content, only the progress datum was (matching stacking law 02's "relocate, never delete," since the other three lines already have replacements: reply is inside the apparatus's author block contact line, and github/share have no mobile equivalent named anywhere in §10.9's own table, so their disappearance at that width is what the table already specifies, not a gap this phase introduces).

**Exit:** the aside renders at ≥1100 with all four lines live; below 1100 only the progress bar survives, relocated under the masthead; `edit on github` resolves to a real, working GitHub edit URL once `GITHUB_URL` is real (and 404s harmlessly on the current placeholder, which is expected and not this phase's problem to fix).

#### 5.8 · Apparatus — author block, prev/next, related

1. **Author block** (§10.6). Static content — one author, one bio, one contact line — sourced from `consts.ts` rather than the `site` data collection (AD-03 assigns `site` to experience rows, Elsewhere links and the Now-panel fallback; a single-author blog's own author block is closer to `SITE_NAME`/`SITE_ROLE`'s existing home than to a collection with one row). Conditional per §10.10's "very short article" case: absent below three `h2`s, matching the TOC's own threshold and stated reasoning ("article apparatus is conditional on there being an article to support").
2. **Prev/next** (§10.7, component 17 — Pagination). Numeric adjacency by article number (5.0), computed in 5.4 and passed down; absent at either end of the sequence (no "previous" on article 001) rather than wrapping around — nothing in component 17's own spec suggests a carousel.
3. **Related** (§10.7). `src/lib/related.ts` — tag-overlap count, ties broken by same `section`, then by recency — the one piece of this sub-phase that's genuinely "logic easy to get subtly wrong" (`nav.ts`'s own stated bar for warranting a real file), so it gets a real file and a `node:test`, not an inline `.sort()` in the page. Top four (5.0's resolved note). Absent when fewer than one real match exists — an empty "RELATED" band with nothing under the label would be worse than no band at all, and nothing in §10.10 requires related articles to always be present the way TOC-absence is explicitly sanctioned.

**Exit:** the 90-word fixture (5.9) shows no TOC, no author block, no related list — proving the conditional apparatus actually gates on content, not just on TOC's three-`h2` threshold reused blindly everywhere; a three-article corpus shows correct prev/next at both ends and in the middle; related entries share at least one tag with the current article, every time.

#### 5.9 · The two inherited T4 fixtures

`src/content/writing/`: a **90-word entry** (single paragraph, one `h2` at most — below the TOC's three-`h2` floor) and a **9,400-word / 34-section entry** (real content preferred per Phase 3.1's own anti-lorem-ipsum reasoning; failing that, a real section structure with placeholder prose inside each section, which at least exercises the numbering and TOC-cap logic honestly even if the prose itself is filler this once). Both routable through `/w/[num]` like any other entry.

**Exit:** the 90-word article renders with no TOC, no author block, no related list, no prev/next gap-handling surprises; the 9,400-word article's TOC engages its 150px scroll cap (E4) and the build emits the 8,000-word warning from 5.0's dropped-feature note — proven by the warning actually appearing in build output, then removing ten sections and confirming it stops.

#### 5.10 · RSS and sitemap

1. **RSS.** `@astrojs/rss` (a function, not an integration — not currently a dependency) via `src/pages/rss.xml.ts`. Title/description from `consts.ts`, `site` from `SITE_URL`, items from non-draft `writing` entries sorted newest-first, `link` pointing at `/w/<num>` (the canonical form, never the slug alias). Description is the `lead` field — already capped at 62ch/one-paragraph by the schema, which happens to make it a reasonable feed summary without any extra truncation logic.
2. **Sitemap.** `@astrojs/sitemap` (an integration — add to `astro.config.mjs`'s `integrations` array). Per Finding C, pass a `filter` excluding any path starting `/dev/`, plus the `/writing/<slug>` redirect routes specifically (their canonical is `/w/<num>`; a redirect page in a sitemap is a mixed signal a crawler doesn't need). **Not** a blanket `path.startsWith('/writing/')` — that would also swallow Phase 6's real `/writing` index and `/writing/tag/<tag>` pages the moment they exist; match the redirect pages by the number-lookup shape (5.4's slug set), not by their path prefix, so the filter doesn't need editing again in Phase 6. Verify by building and grepping the output `sitemap-0.xml` for `/dev/` — zero matches, not assumed from the filter function reading correctly.

**Exit:** `/rss.xml` validates against a real RSS validator and lists exactly the non-draft `writing` entries, newest first; `sitemap.xml` contains zero `/dev/*` entries and zero `/writing/<slug>` redirect entries, confirmed by grep against the built output — with nothing else excluded.

#### 5.11 · Extend the specimen page, and close out T1

Per the precedent every prior phase sets (3.9, 4.11): add the aside (both its ≥1100 and <1100 forms), the author block, prev/next, and a related-items grid to the specimen page, so the apparatus components this phase built have a home outside a full article render.

`check:content` (5.3) is the last of `package.json`'s `echo 'TODO'` stubs this plan is responsible for closing — `check:links` stays Phase 8's, `check:e2e`'s remaining T3 checks stay Phase 8's per the original roadmap.

**Exit:** the specimen page renders the full apparatus set in both themes at all three widths; `pnpm run verify` runs a real `check:content`, not a stub, and it's the only stub `package.json` still names after this phase.

---

**Phase 5 overall exit criteria:**

- Both collection schemas are real Zod, not the Phase 0 `title`+`draft` stub; `series.id` exists (Finding D) and the fixture matches.
- T1 (`check:content`) runs all six cross-entry invariants against real files via `gray-matter` + the shared Zod schema, no `astro:content` dependency in a plain `node:test` file; each check proven to fail on a deliberate violation.
- Three real articles (or Phase 10-equivalent placeholders) render end-to-end at `/w/00N`; a draft 404s in production and renders in dev.
- `/writing/<slug>` redirects to the canonical `/w/<num>`, with AD-10 corrected to describe what a static build actually emits and the real-301 upgrade named as a Phase 9 item.
- TOC gains a working active state and the reading-progress bar renders and updates, with **zero** new islands beyond the one ADR-0017 budgeted for this behaviour — three islands total, still.
- Author block, prev/next and related all correctly go absent under §10.10's short-article case; the 90-word and 9,400-word fixtures prove it, not just the schema's own conditionals in isolation.
- An over-8,000-word article warns at build time rather than failing or silently auto-splitting; series-based manual splitting already works with no further code.
- `/rss.xml` and `/sitemap.xml` exist, validate, and contain no `/dev/*` page.
- `check:content` is a real check; it is the last `echo 'TODO'` stub this plan closes.

### Phase 6 · Writing index and projects _(3–4 days — revised up from 2: six findings surfaced by reading the real schema, the real component tree and the real reference screenshots before writing a line of this phase, three of them blocking, plus a component — Tag — that the first five phases never needed and so never built)_

Twelve sub-phases. Like Phases 3–5, this one opens with findings rather than code — obtained by reading `content.schemas.ts`, `src/components/list/` and `docs/reference/` as they actually are on disk, not as §0.3 and Phase 5 assumed they'd be.

One scope correction to the stub: **real project content lands here, not Phase 10.** Phase 5's own precedent (3.1's fixture-before-schema, 5.4's "three real articles … or placeholder equivalents") applies again — a projects index and a project detail page cannot be proven against an empty collection, and `src/content/projects/` currently holds nothing but a `.gitkeep`.

#### 6.0 · Six findings, checked against the repository as it stands

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Effect                                                                                                                                                                                                     | Status                            |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| A   | **`writingSchema.tags` caps at 3**, but §21.2 itself states "eight has been tested and survives at 390"                                                                                                                                                                                                                                                                                                                                                               | The T4 "8 tags" fixture 5.0 deferred to this phase cannot be authored as a real entry — Zod rejects it on parse                                                                                            | Resolved in 6.1                   |
| B   | **Component 08 (Tag) has never been built** — `ArticleHeader.astro` inlines `<dd>#{tag}</dd>` directly, `src/components/list/` and `src/components/ui/` hold only `.gitkeep`s                                                                                                                                                                                                                                                                                         | Phase 6 is the first phase that needs a real, interactive, reusable Tag — filter rows and tag pages are the first place tags are navigational at all                                                       | Resolved in 6.3                   |
| C   | **No reference screenshots exist for the Writing index at all** — `docs/reference/` has `404/ about/ article/ home/ projects/ ui/`, no `writing/`                                                                                                                                                                                                                                                                                                                     | This phase builds one full page type from DESIGN_SYSTEM.md prose alone, with nothing to check pixels against                                                                                               | Flagged, not blocking — see below |
| D   | **The projects reference screenshots are two page types under one name, and incomplete.** `docs/reference/projects/1320-light.png` and `.../390-light.png` turn out — confirmed by opening them — to be the **project detail** page, not the index; the actual index shots live one level deeper at `docs/reference/projects/index/{390,900}-light.png`. There is no 1320 (desktop) or dark-theme shot of the index, and no dark-theme shot of the detail page either | §0.3's 42-image matrix silently shipped four of the projects-page combinations short                                                                                                                       | Flagged, not blocking — see below |
| E   | **The project detail reference shows a `demo ↗` link in the status band's LINKS row and a `browse 28 →` primary link on a non-case-study project** — `projectsSchema.links` only has `article` and `source`; component 07's own spec hardcodes the primary link's text as `case study →`                                                                                                                                                                              | Schema and component spec both undershoot what the reference actually shows                                                                                                                                | OD-14, resolved in 6.1            |
| F   | **`projectsSchema` has no `draft` field** (unlike `writing`), and the OD-04 publication boundary for the one confidential case study — the industrial testing platform — is still not countersigned (checked: no `docs/*boundary*` file exists on disk, and Phase 0.5's own exit note still lists it as the one item carried past Phase 0)                                                                                                                            | This phase has nothing to render the projects index against, and the one project most worth stress-testing (`sourceAbsence`, no `links.source`) is also the one legally blocked from having real prose yet | OD-15, resolved in 6.1/6.2        |

**Finding C and D, what "flagged, not blocking" means.** Every prior phase from 1 onward had a reference image to check a token, a spacing value or an alignment against before shipping it (3.2's callout bug, 3.3's `h3` spacing question). This phase's single highest-value page — the Writing index — has none. Recommendation: **request the missing captures before 6.5**, the same six-combination matrix §0.3 used elsewhere (390/900/1320 × light/dark) for the Writing index, plus the two missing projects-index combinations (1320, and a dark-theme shot of both index and detail) — cheap to ask for now, expensive to discover missing once 6.5 is mid-build and there's nothing to compare against. If they aren't available, this phase proceeds from DESIGN_SYSTEM.md §19.2/§9.5/component 05 prose alone and says so in the exit criteria, rather than silently treating prose-only as equivalent to a checked page.

**Finding A, in detail — corrects the schema, not the design system.** §21.2's own sentence is unambiguous: eight tags is a tested, sanctioned ceiling; three is stated as "the design intent," a content guideline, not a hard limit. `content.schemas.ts` currently enforces the guideline as if it were the ceiling (`z.array(z.string()).min(1).max(3)`), which is backwards — the same category of mismatch as 3.2's `--fs-callout` bug, a value that slipped in because nothing was checking it against the section that actually specifies it. Fix: raise the Zod constraint to `.max(8)`, matching the tested ceiling, and add a comment recording that 3 is the recommended editorial target (the same non-enforced-guidance pattern `projectsSchema.description`'s 58ch already uses, per 5.1 point 2) — not something a schema constraint should be doing.

**Finding B, in detail.** This is a correct absence, not a gap to backfill: component 08's own purpose line reads "Navigational on an index, descriptive on an article," and every existing tag render (`ArticleHeader.astro`'s metadata row) is the descriptive case — plain, non-interactive, correctly inline. **Do not retrofit `ArticleHeader.astro` to consume the new component in this phase** — it renders correctly today, and swapping it for `<Tag interactive={false}>` would be a churn-only change with no visible effect, the same reasoning 2.4's `NAV_LINKS` shape avoided a speculative abstraction for a count that didn't exist yet. The new component's variants — plain, counted, and the "all"/current-filter treatment — are built fresh for the filter row and tag pages, the first genuinely navigational tag surfaces in the codebase.

##### OD-14 · The status band's `demo` link, and the project item's primary-link label **(blocking 6.1, 6.7, 6.9)**

The industrial-platform reference shows `LINKS` as `source ↗ · demo ↗` in the status band, and the CTF-writeups project uses `browse 28 →` — not `case study →` — as its primary link, pointing at `/writing/tag/ctf`, a route this phase already builds (6.6), not a project detail page at all. Two schema-shaped questions follow:

1. **Add `links.demo`** (`z.url().optional()`) to `projectsSchema` — a fourth link kind the reference needs and the schema doesn't have. Not `article`/`source` reused for it: a live demo and a written case study are different things a project can have independently (the homelab project in the mockup has neither `links.demo` nor a source link problem — it's `source` + `article`; the reference simply didn't show every combination in one frame).
2. **The primary link's label is content, not a template string.** Component 07's "primary link (`case study →`)" phrasing describes the common case, not the only one. Add an optional `links.primaryLabel` (`z.string().optional()`, e.g. `'browse 28'`) — when absent, derive `case study →` from `caseStudy && links.article`; when present, it overrides both text and, implicitly, that the link may point somewhere other than a project detail page (`links.article` doubles as "the primary link's href" regardless of label, so `browse 28 →` still just needs `links.article: '/writing/tag/ctf'`, no new href field).

**Recommendation: both, exactly as above.** Neither is speculative — both are things the reference screenshot already shows and the schema needs to represent them at all. Record as ADR-0022 once implemented.

##### OD-15 · Real project content without waiting on the publication boundary **(blocking 6.2, and therefore 6.8/6.10's exit)**

Four non-schema facts converge on one resolution:

- `src/content/projects/` is empty; this phase cannot prove the index or detail page against nothing.
- One of the two inherited T4 fixtures (5.0) is specifically "project with no source" — and the industrial-platform project (`client work · no source`, per the reference) is exactly that case by construction. No separate throwaway fixture is needed if the real project can be authored now.
- The industrial platform's real prose is legally blocked: OD-04's publication boundary hasn't been sent for signature yet (Phase 0.5's own carried-forward item), and writing real case-study content ahead of that boundary being acknowledged is precisely what Phase 0's OD-04 section warned against doing.
- `projectsSchema` has no `draft` field, so today there is no way to author a structurally-complete-but-not-yet-public project entry the way `writing`'s `draft: true` already lets an article exist without shipping.

**Recommendation: add `draft: z.boolean().default(false)` to `projectsSchema`**, mirroring `writing`'s field for field — **default `false`**, not `true` as `writing` has it, because OD-03's "drafts exempt, fail closed" reasoning was about a forgotten flag silently _publishing_ prose that wasn't ready; a project entry's default risk runs the other way (a forgotten flag would silently _withhold_ a project that's actually fine to ship), and every project after the industrial one is non-confidential from the moment it's written. Then:

1. Author the **three non-confidential projects** from the reference mockup now, as real launch-quality content, not placeholders: the homelab platform (`active`, `ansible · debian · wireguard · postgres`, `source` + `article`), the CTF-writeups aggregate (`active`, primary link `browse 28 →` per OD-14, `source` only), the evolutionary-SVG experiment (`archived`, `source` + `article`).
2. Author the **industrial testing platform as `draft: true`**, with the real facts that are already safe to state (`maintained`, `2025`, `client work · no source`, the stack line, `sourceAbsence`) and placeholder-but-honest section prose standing in for the Technical-decisions table and Results section until the boundary is signed. This satisfies the "project with no source" T4 fixture structurally — `check:e2e` runs against `astro dev` (draft entries render there, same as `writing`'s), so the stress test is provable now — while nothing confidential ships, since a draft project is excluded from the production build exactly as a draft article already is.
3. Phase 10 flips `draft: false` and replaces the placeholder sections once the boundary is countersigned. Nothing here forecloses that; it's the same deferred-with-a-name treatment Finding B/5.10 gave the real-301 upgrade.

**Exit:** decided, `draft` field added, recorded as ADR-0023 once implemented.

#### 6.1 · Schema corrections and the tag registry

1. `content.schemas.ts`: `writingSchema.tags` → `.min(1).max(8)` (Finding A), comment recording 3 as the editorial target, not the enforced one. `projectsSchema`: add `links.demo` and `links.primaryLabel` (OD-14), add `draft: z.boolean().default(false)` (OD-15).
2. `consts.ts`: extend `TAGS` from six entries to at least eight, so the 6.10 fixture has eight registry-valid tags to use. Draw the new ones from real thematic territory already established by the existing six real articles (e.g. a `linux` or `networking` tag reflecting the homelab/Ansible content already published) rather than inventing categories nothing will ever use again — same reasoning 5.9 gave `notes`.
3. `tests/invariants/`: no new check needed — invariant 4 ("every tag is in `TAGS`") already covers a wider registry for free; invariant 1 (number contiguity) already covers the new project field additions since they don't touch numbering.

**Exit:** `pnpm check:content` passes; a scratch article with 8 valid tags parses; a scratch project with `links.demo` and `draft: true` parses; `pnpm check:astro` has no type errors from the two new optional fields.

#### 6.2 · Real project content

Per OD-15: three real, non-draft project entries (`001-self-hosted-homelab.md`, `002-ctf-writeups.md`, `003-evolutionary-svg.md` — projects number 1–99 independently of `writing`'s sequence, AD-03) and one `draft: true` entry for the industrial platform (`004-industrial-testing-platform.md`), all four transcribed from the reference mockup's actual copy rather than lorem ipsum, per 3.1's own anti-lorem-ipsum reasoning (a stack line, a `**Why.**` sentence and a status word all read as fake or real immediately — there's no filler version of any of them worth writing).

**Exit:** `pnpm check:content` validates all four against `projectsSchema`; three are visible in a production build, one only in `astro dev`.

#### 6.3 · Tag (component 08)

The first real build of this component — a small one. `src/components/ui/Tag.astro`: a lowercase hash-prefixed mono span or anchor, no chip, no background, no border, no radius (§6·08's own anatomy line is the whole visual spec). Three variants as props, not three components (§22.6 — prefer a variant over a new component):

1. **Plain** (`#ansible`) — accent mono 12, hover underline, always a link (`/writing/tag/ansible`).
2. **Counted** (`#infrastructure 11`) — plain plus a muted count appended, same link.
3. **Current** (the "all" pseudo-tag, or whichever real tag the page is filtered to) — `--c-text` plus a permanent accent underline instead of the accent colour, **not a link to itself** (a current-page self-link is a no-op affordance §7.2's own "current page" treatment already avoids the same way for nav links).

**Exit:** all three variants render correctly on the specimen page (6.11) in both themes; tabbing to a plain or counted tag shows the token focus ring; the current variant is not tabbable to itself (it has no `href`, so this is free — an `<a>` with no `href` isn't a link at all, confirmed by reading how the browser treats it, not assumed).

#### 6.4 · Blog post item — row, compact row, featured entry (component 05, §9.5)

`src/components/list/WritingRow.astro` and `src/components/list/FeaturedEntry.astro`. Both take the same normalised `{number, title, lead, dek?, date, minutesRead, tags, section}` shape rather than `CollectionEntry<'writing'>` directly — §11 of this plan's own "designed-in leeway" table already commits to collection-agnostic row components for exactly this reason (a future fourth content type shouldn't need a rewrite), and it costs nothing extra here since `/w/[num].astro` already builds an equivalent merged object for other reasons (Finding A, Phase 5).

1. **`WritingRow`, full variant** (index row, five tracks: `52 / 104 / minmax(0,1fr) / 130 / 80`). This is a component-internal grid, not a page-level column structure — worth stating plainly, the same way Phase 4's code-block two-track grid and the TOC's spine needed saying, because §22.9 ("exactly three column structures, do not invent a fourth") governs page-level layout classes, not a single list item's own grid.
2. **`WritingRow`, compact variant** — four tracks (number, date, title+dek, reading time), the tag track dropped. Built now, consumed by Phase 7's homepage "Latest writing" band — another instance of the reuse-across-phases pattern `findRelated`/`ArticleApparatus` already set.
3. **`FeaturedEntry`** — not a row: a `minmax(0,680px) / 1fr` band per §9.5, metadata row + 27–28px serif title with its permanent accent underline + lead paragraph + optional series line, paired with a hairline-framed 170–200px lead figure. No ground, no border around the whole, no radius — it stays a band, not a card, per §9.1/§9.5's own insistence.
4. **Responsive**, both row variants: five tracks → three (tag and reading time join line 2) → stacked (title first at 16.5, one wrapped mono line, dek dropped per E9 — the only datum in the system permitted to disappear rather than relocate).

**Exit:** all three components render correctly at 390/900/1320 in both themes on the specimen page; a row's entire bounding box is the hit target at ≥48px tall; hover shifts the row ground to `--c-surface` and underlines the title, no lift/scale/shadow.

#### 6.5 · The writing index page

`src/pages/writing/index.astro`. Four bands per §19.2:

1. **Header** — gutter `Writing / N articles` (N = published count, via `getCollection('writing', e => !e.data.draft)`), `h1` `--t-title`, lead ≤62ch, then the filter row: `<Tag current>all N</Tag>` followed by one counted `<Tag counted>` per registry tag with at least one published article, via `countTags()` (new, `src/lib/archive.ts` — see below), ending with `rss ↗`.
2. **Featured** — the one `featured: true` entry (invariant 2 already guarantees at most one exists) via `FeaturedEntry` + 200px lead figure. **Absent if no entry is marked featured** — nothing in §19.2 mandates one exist, and inventing a fake feature would violate the content brief's no-invented-metrics rule the same way a fabricated homepage stat would.
3. **Year groups** — one band per year, gutter carrying the year in serif 22 with the count beneath in `--c-faint`, body a `--c-rule-2`-opened list of `WritingRow` (full variant). `src/lib/archive.ts`'s `groupByYear()` — sort descending by year, entries within a year newest-first — gets a real file and a `node:test`, the same "logic easy to get subtly wrong" bar `related.ts`/`nav.ts` already set, not an inline `.sort()`/`.reduce()` in the page.
4. **Archive row** — `archive by year → 2024 (9) 2023 (6) rss ↗`. **Resolved without a finding table row, because it has one clearly correct answer**: since §19.2 already renders every year's articles in bands on this one page ("an archive, not pagination" — no second page exists to link to), each year in this row is an **in-page anchor** (`#2024`, `#2023`) to that year's own band, not a route. `groupByYear()`'s output already gives both the year and its count for free.

**Exit:** T3's three brought-forward checks (2.7) plus the width/theme matrix pass; the five-track → three-track → stacked transition matches §20.3; an anchor click from the archive row lands on the correct year band.

#### 6.6 · Tag pages

`src/pages/writing/tag/[tag].astro` — a real route named in AD-10's own route list but, checked directly, **given no page-composition entry anywhere in §19** (§19.1–19.8 names exactly seven page types; a tag page isn't an eighth, it's a filtered view of one of the seven). Resolved by derivation, the same treatment OD-01 gives search UI and §19.9 gives "every list is the same list": a tag page **is** the Writing index with the filter state changed, not a new composition.

1. `getStaticPaths()` over `TAGS`, filtering published `writing` entries to ones containing that tag.
2. Same header band, with the matching `<Tag>` rendered `current` instead of `all` in the filter row, and `h1`/lead swapped to name the filter (`#security` / `9 articles tagged #security`) — a small amount of invented copy, same weight-class as OD-11's spacing value, recorded here rather than left silent.
3. **No Featured band** — the sitewide `featured: true` pick has no guaranteed relationship to the current tag, and showing an unrelated "featured" entry at the top of a filtered list would contradict the filter itself. Year groups start immediately after the header.
4. Year groups and archive row: identical logic to 6.5, scoped to the filtered set — `groupByYear()` takes the entry list as a parameter, so this is a second call, not new code.

**Exit:** `/writing/tag/ctf` renders only CTF-tagged entries, correctly grouped by year; the filter row shows `#ctf` as current, not `all`; a tag with zero published entries 404s rather than rendering an empty page (no dead route for a tag nothing uses yet).

#### 6.7 · Project item (component 07)

`src/components/list/ProjectItem.astro`. Full index variant: three tracks `44 / minmax(0,1fr) / 210` — again a component-internal grid, not a fourth page-level structure, same 6.4 point 1 reasoning. Content order inside the substance track exactly as §11.1 states — number → title → description → optional `**Why.**` → stack line — and the instruments track per component 07's anatomy: status → period → primary link (OD-14's derived label) → source-or-`demo`-or-absence.

**The one sanctioned law-01 inversion (E3).** At mobile the instrument track folds under the description as a wrapped mono block with **status first** — checked against `docs/reference/projects/index/390-light.png`, which shows exactly this order (`● active 2024 — ongoing`, then title, description, stack, links). Implement it as source order in the markup (status genuinely first in the DOM at every width, description second), not a CSS reorder trick — the row's tab order should match what's visually first at the width where it matters, and a `flex-direction`/`order` reshuffle would make the two diverge for keyboard users.

**Exit:** renders correctly at 390/900/1320 in both themes; the status-first mobile order is real DOM order, confirmed by tabbing through it at 390 and seeing status focused before the title link.

#### 6.8 · Projects index page

`src/pages/projects/index.astro`, replacing the `.gitkeep`. Per §11.1/§19.4: header band (gutter `Projects / N · M active`, `h1` `--t-title`, lead ≤62ch) → an `INDEX`-labelled band of `ProjectItem`s (26px padding-y, `--c-rule-2` opening the list, `--c-rule` between items) → footer. `N`/`M` computed from the same published-project count `NAV_LINKS`' mobile-menu count already needs (6.2's `draft: true` industrial entry excluded from both, in production).

**Exit:** matches `docs/reference/projects/index/{390,900}-light.png` at those two widths (Finding C/D's gap — no 1320 or dark shot to check against, noted rather than silently assumed correct); T3's matrix passes at 1320 and in dark mode regardless.

#### 6.9 · Project detail page

`src/pages/projects/[slug].astro` — **"uses the article grid exactly," per §11.2, which is a real architectural constraint, not just a description.** Checked directly: `ProseLayout.astro` hardcodes `<ArticleHeader frontmatter={frontmatter} />` inline (not a slot), so a project detail page cannot reuse it unmodified — the status band's data shape (status/period/stack/links, no tags, no word count) doesn't fit `ArticleHeader`'s `Frontmatter` interface at all.

**Resolution: give `ProseLayout.astro` a `header` slot, defaulting to `<ArticleHeader frontmatter={frontmatter} />` when nothing is passed.** A one-slot change, not a speculative plugin system — there is exactly one concrete second header (`ProjectHeader.astro`, built this sub-phase) that needs to swap in, and a default keeps every existing call site (`/w/[num].astro`) working with zero changes.

1. `src/components/article/ProjectHeader.astro` — same header-band markup shape as `ArticleHeader` (gutter, breadcrumb, `h1`, lead) but `h1` at 40 not 42 (§11.2 point 1), and the metadata row replaced by the **status band**: hairline above, four-column `LABEL`-over-value grid (Status · Period · Stack · Links), collapsing four → two → a stacked two-line mono block at the same two breakpoints `ArticleHeader`'s own metadata row already collapses at. Gutter carries `Project 01` + the status word in `--c-ok` (or the appropriate status colour — §11.2 point 3).
2. Breadcrumb: `projects / <slug>` — the slug reused from the same `slugify(title)` helper (`src/lib/slug.ts`) `writing`'s own `/writing/[slug]` redirect already uses (5.5 point 2), applied to `projects` for the first time; no new code.
3. `src/pages/projects/[slug].astro`: `getStaticPaths()` over `getCollection('projects', e => import.meta.env.PROD ? !e.data.draft : true)`, canonical section sequence per §11.2's table (Problem & motivation → Architecture → Implementation → Technical decisions → Results & lessons), reusing every article-body component built in Phases 3–4 unchanged (code blocks, figures, the decision table via the standard Table component). Aside's third line: `next project`, numeric adjacency by project number (same reasoning as 5.0's article prev/next resolution — a one-line `.find()`, no new lib file needed for something this small).
4. `related.ts`/`ArticleApparatus`'s prev/next-pair layout is **not** reused here — §11.2 names a single `next project` line in the aside, not a two-column prev/next grid; building the pair component into project detail would be adding a component to a page that doesn't call for it (§22.8).

**Exit:** `/projects/self-hosted-homelab` renders end-to-end through the shared grid with a real status band; `/w/[num]` still renders unchanged with zero prop changes (the slot default proven, not assumed); the status band collapses 4 → 2 → stacked exactly where `ArticleHeader`'s metadata row already does.

#### 6.10 · The two inherited T4 fixtures

Per 5.0's deferral and this phase's own Finding A/OD-15 resolutions, both now unblocked:

1. **8 tags** — `007-<real-short-homelab-note>.md` in `src/content/writing/`, tagged with eight of the now-extended `TAGS` registry (6.1). Real short content, not filler, per 3.1's standing reasoning. Proves two things at once: the metadata row wraps correctly at 390 without breaking the type floor or the page width, and the filter row (6.5) renders eight counted tags without its wrapping flex row (component 08's own "tested at 390 with eight tags" claim) visibly degrading.
2. **Project with no source** — already satisfied by 6.2's `004-industrial-testing-platform.md` (`draft: true`, `sourceAbsence` set, no `links.source`). No additional fixture needed — the real content **is** the stress test, per OD-15's own reasoning.

**Exit:** the 8-tag article renders correctly at 390 in both themes; the filter row on `/writing` shows all eight of its tags as distinct counted entries with no visual break; the industrial project's `client work · no source` renders correctly on both the projects index (in `astro dev`) and its own detail page.

#### 6.11 · Extend the specimen page

Per the precedent every prior phase sets (3.9, 4.11, 5.11): add `Tag` (all three variants, both themes), `WritingRow` (full, compact, featured), and `ProjectItem` (all states, including the mobile status-first order forced via a class so it's screenshot-deterministic per T5's own gallery-state convention) to `src/pages/dev/specimen.astro`.

**Exit:** the specimen page renders the full set introduced this phase, in both themes, at all three widths.

---

**Phase 6 overall exit criteria:**

- `writingSchema.tags` allows up to 8 (matching §21.2's tested ceiling), `TAGS` registry has at least 8 entries; `projectsSchema` has `links.demo`, `links.primaryLabel` and `draft`, all recorded in an ADR (OD-14 → ADR-0022, OD-15 → ADR-0023).
- Four real project entries exist; three ship in production, one (industrial platform) is `draft: true` pending the still-uncountersigned OD-04 publication boundary.
- `Tag`, `WritingRow` (+ compact + featured), and `ProjectItem` all exist as real, reusable components for the first time — `src/components/list/` and `src/components/ui/` hold more than `.gitkeep`s.
- `/writing` renders featured entry (when one exists), year groups, a counted-tag filter row and an in-page archive-by-year anchor row; T3 passes at all three widths in both themes, matching §20.3's five → three → stacked transition.
- `/writing/tag/<tag>` renders as a derived filtered view of the same page, with no Featured band and the current tag marked instead of `all`.
- `/projects` and `/projects/<slug>` both render; project detail reuses the article grid via `ProseLayout`'s new `header` slot with zero changes to `/w/[num].astro`'s own rendering; the mobile status-first inversion (E3) is real DOM order, not a CSS reorder.
- Both T4 fixtures inherited from Phase 5 (8 tags, project with no source) are provable, the second one without any fixture-only content — the real launch content **is** the test.
- The Writing-index and projects-index reference-screenshot gaps (Finding C/D) are either closed by a fresh capture request or explicitly noted as unclosed in this phase's own record — not silently treated as covered.

### Phase 7 · Home, about, 404 _(2–3 days — revised up from 1: the stub's "mostly composition" is correct, but the data three of the six new bands compose from doesn't exist anywhere yet — this is the first phase to need a `data` collection at all, and two findings are blocking before either the homepage or the about page can render its real numbers)_

Nine sub-phases. §22 rule 8 and §23.3 already settle the component question the stub raises itself: none of this phase's six new page bands (Now panel, Interests line, Experience rows, Elsewhere grid, route list) is a candidate component, because each names exactly one page. The open work is everything upstream of composition — the `site` data collection AD-03's own table promises and Phase 0 never built, the homepage's project-selection rule, and the Now panel's live-fetch mechanism.

#### 7.0 · Four findings, checked against the repository as it stands

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Effect                                                                                                                                                                                                                                                       | Status                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| A   | **The `site` data collection named in AD-03's own collections table has never been built.** `content.config.ts` defines exactly `writing` and `projects`; `src/content/site/` holds only a `.gitkeep`, exactly as Phase 0 left it                                                                                                                                                                                                                                                                                                                                                                         | Every real fact this phase's homepage and about page need — experience rows, Elsewhere links, the interests line, the Now-panel fallback — has nowhere to live                                                                                               | Resolved in 7.1                           |
| B   | **Phase 0's own file-tree stub named a reusable `ExperienceRow` component that §22/§23.3 forbid.** Checked directly: §22 rule 8 ("a component that would appear on exactly one page does not belong in the system") and §23.3's own list name "the 150px period track, the four-column Elsewhere grid" for About and "the Now panel, the 24px opening statement, the interests line" for the homepage as **compositions, not components** — the same status §23.3 gives the blog index's filter row and the project detail status band, both already built as page-local markup, not extracted components | The Phase 0 stub is stale on this point, the same way it was on `Base`/`Banded`/`Instrumented.astro` (only `BaseLayout`/`ProseLayout` exist, confirmed by `ls src/layouts/`) — no `ExperienceRow.astro`, no `Elsewhere.astro`, no `NowPanel.astro` get built | Resolved by not building it — see 7.4/7.5 |
| C   | **`projectsSchema` has no selection rule for the homepage's "Selected work / 3 of 6."** `writing` has `featured` (capped at one by invariant 2); `projects` has nothing equivalent, and nothing in §19.1 or component 07 states how three of N projects get chosen                                                                                                                                                                                                                                                                                                                                        | Blocks 7.4 — the homepage cannot render a Selected-work band without deciding this                                                                                                                                                                           | OD-16, resolved in 7.1                    |
| D   | **AD-12/ADR-0012's Now-panel fetch target is a URL that doesn't exist anywhere in the codebase.** `consts.ts` already has the `SITE_URL`/`GITHUB_URL`/`PGP_URL` placeholder pattern (OD-07) for exactly this category of "real value needed before launch, must not block a build" fact, but no constant for "a small JSON endpoint on the homelab VPS" has been added, and no committed fallback file exists either                                                                                                                                                                                      | Blocks 7.2 — the build-time fetch has nothing to fetch from yet                                                                                                                                                                                              | OD-17, resolved in 7.2                    |

**Finding B, why it matters beyond "one file doesn't get written."** Every prior phase from 3 onward closed with a specimen-page extension (3.9, 4.11, 5.11, 6.11) because every prior phase added at least one of the twenty numbered components in §6. This phase adds none — Tag (component 08, Phase 6) was the last. That's not an oversight to fix; it's what §22 rule 8 and AD-04's "inventory closes at twenty" (referenced by Phase 6 Finding B) predict for a phase whose new surfaces are explicitly named as page-local in §23.3. 7.7 is an audit of the existing specimen page, not an extension of it — the first phase where that's true.

##### OD-16 · Selecting "3 of 6" for the homepage's Selected-work band **(blocking 7.1, 7.4)**

Three ways to pick three projects out of N, none stated in the design system: most-recent by `period.from`, a hand-picked flag, or reverse project-number order. Most-recent-by-date would rank the archived evolutionary-SVG project (`period.from: 2024-02-01`) ahead of the CTF aggregate (`2023-03-01`, `active`, still ongoing) purely because of when each was _started_ — the wrong axis for "work worth showcasing," and no article in this system ever needed the equivalent editorial judgment softened into a date sort, because `writing.featured` already solves the identical problem with an explicit flag rather than a derived heuristic.

**Recommendation: add `featured: z.boolean().optional()` to `projectsSchema`, mirroring `writing`'s field exactly**, plus a new invariant — `tests/invariants/featured.test.ts` extends to assert **at most three** featured projects (not "at most one": the writing invariant's cap matches its own single-slot UI, this one matches the homepage's three-slot band). With the three real non-draft projects (6.2) all worth showing and none yet in excess of three, mark all three `featured: true` now — the cap is exercised the day a fourth non-draft project ships, not invented ahead of need. Record as ADR-0024 once implemented.

##### OD-17 · The Now panel's fetch target and fallback **(blocking 7.2, and therefore 7.4's exit)**

ADR-0012 is unambiguous about the _shape_ of the mechanism (build-time fetch, 2s timeout, committed fallback, no runtime fetch ever) but the actual endpoint doesn't exist — this is a personal VPS/homelab detail nothing in this repository can supply today, and Phase 9 (deploy) is where real server-side infrastructure actually gets stood up, not Phase 7. Building a page that hard-fails without a real endpoint would block this phase on infrastructure that has no reason to exist yet, the same shape of problem Phase 5's Finding B solved by shipping the meta-refresh now and carrying the real 301 forward to Phase 9.

**Recommendation:** add `NOW_PANEL_URL` to `consts.ts` alongside `GITHUB_URL`/`PGP_URL` — a placeholder pointing nowhere real yet (a clearly-fake path, not a guessed real one), documented the same way OD-07's other placeholders are. `src/lib/now.ts` (already named in Phase 0's own lib stub) always attempts the fetch, and on any failure — including "placeholder host doesn't resolve," which is indistinguishable from a real timeout — falls back to `src/content/site/now-fallback.json`, the committed file holding §19.1's own worked numbers (`homelab uptime 214 d`, `11 services ok`, `last deploy 2026-08-19`; they're already real facts, not placeholders, because the homelab project (6.2) is the real thing these numbers describe). Phase 9 swaps the placeholder for the real endpoint once that infrastructure exists — a one-constant change, same shape as OD-07/AD-12's own reasoning for keeping `SITE_URL` in exactly one place. Record as ADR-0025 once implemented.

#### 7.1 · The `site` data collection and the projects `featured` field

1. `content.config.ts`: a new `site` collection, `type: 'data'`, loader over `src/content/site/*.json` (JSON, not the stub's YAML — one fewer parser dependency, and every other collection in this codebase already round-trips through Zod from a single format). Four files, each its own concern rather than one file forced into a union shape: `experience.json` (array of `{period, role, description}`, About §19.6 point 3), `elsewhere.json` (array of `{label, value, href?}`, four entries — Email · Code · Social · Keys), `interests.json` (array of strings, joined with middots at render time, not stored pre-joined), `now-fallback.json` (`{uptime, servicesOk, lastDeploy}`, OD-17). `content.schemas.ts` gets one Zod schema per file, imported by both `content.config.ts` and the two pages that read them directly.
2. `projectsSchema`: add `featured: z.boolean().optional()` (OD-16). `tests/invariants/featured.test.ts`: extend to load both collections, keep the existing "at most one featured writing entry" assertion, add "at most three featured projects."
3. Content: author real values for all four `site` files (the About page's actual experience/elsewhere content, the homepage's actual interests line) — real copy, not lorem ipsum, same standing reasoning as every content sub-phase since 3.1. Mark `001`, `002`, `003` (the three non-draft projects) `featured: true`.

**Exit:** `pnpm check:content` passes with the new collection and field; a scratch fourth featured project fails the new invariant; `pnpm check:astro` has no type errors from the `site` collection's new types.

#### 7.2 · The Now panel (`src/lib/now.ts`, AD-12/ADR-0012)

Per OD-17: a build-time-only fetch against `NOW_PANEL_URL` with an `AbortSignal.timeout(2000)`, `try/catch` around the whole thing, falling back to `now-fallback.json` on any rejection (network error, timeout, non-2xx, malformed JSON — one catch-all, not a per-failure-mode branch, since every branch has the identical outcome). No client-side code at all — this is a plain async function called from `index.astro`'s frontmatter, not a fourth island; ADR-0011's three-islands budget is untouched.

**Exit:** `astro build` succeeds and the homepage renders the fallback numbers (the placeholder host cannot resolve, so every build exercises the fallback path until Phase 9); a unit test (`node:test`, same bar `archive.ts`/`related.ts` set) proves the fallback is used when the fetch promise rejects, without needing a real network call in CI.

#### 7.3 · Project item's selected-work variant (component 07)

Per component 07's own variants table (§6·07) and §22 rule 6 ("prefer a variant over a new component"): `ProjectItem.astro` gets a `variant: 'index' | 'selected'` prop alongside its existing `forceMobile` prop. Selected: 2 tracks (no separate number column), title 19 instead of 21, description capped at 58ch, 22px padding-y instead of 26, a shorter instrument list (status + primary link only — period and source drop, per the variant table's "shorter instrument list," matched against how much a homepage band can afford before it stops being a summary). Existing `index` variant's markup and CSS stay the default, zero change to `/projects/index.astro`'s own rendering.

**Exit:** both variants render correctly on the specimen page (7.7) at all three widths in both themes; `/projects` still renders pixel-identical to its Phase 6 state.

#### 7.4 · The homepage (`src/pages/index.astro`)

Six bands per §19.1, replacing the Phase 0 placeholder. Layout B throughout (`148 / 1fr`, 44px gap), each band closed by a full-frame hairline, first band using the 128px top step (E12).

1. **Index** — gutter `Index / <current year-month>`; opening statement (serif 400 24/1.50, the 23.2's named exception for this page) + one context paragraph; the Now panel beside it on a left hairline (7.2's data, rendered here as plain markup per §23.3 — no component).
2. **Featured** — `FeaturedEntry` with `context="home"` (already built for this exact call site in Phase 6, per that component's own header comment) + 170px lead figure, the one `featured: true` writing entry. Absent if none exists, same conditional Phase 6's writing index already established.
3. **Latest writing** — the four most-recently-published entries, `WritingRow` `variant="compact"` (already built in Phase 6 for this exact call site) + `all writing →` / `rss ↗`. Four-by-date is a one-line `.sort().slice(0, 4)` at the call site, not a new `lib/` function — nowhere near `groupByYear`'s "easy to get subtly wrong" bar.
4. **Selected work** — three `featured: true` projects (7.1/OD-16), `ProjectItem` `variant="selected"` (7.3) + `all projects (N) →` with the real published count.
5. **Interests** — the `site` collection's `interests.json`, middot-joined, sans 15/2.0, `--c-text-2` (§23.3's own named exception).
6. **About & contact** — one paragraph (≤600px) + `CONTACT_EMAIL` (already in `consts.ts`) in serif 22 with an accent underline, + a mono link line reusing `SITE_LINKS`.

**Responsive** (§19.1's own paragraph, verified against no counterexample elsewhere): band order fixed at every width; 44px → 32px band padding; Now panel moves below the intro paragraph and swaps its left hairline for a top one; the two list bands (Latest writing, Selected work) go to stacked rows.

**Exit:** matches `docs/reference/home/{390,900,1320}-light.png` (Finding E's gap — no dark-theme shot to check against, noted rather than assumed); T3's matrix passes at all three widths in both themes regardless; the Now panel shows the committed fallback numbers, not a blank or stuck panel.

#### 7.5 · The about page (`src/pages/about.astro`)

New page, §19.6, four bands:

1. **Header** — gutter `About / upd <date>`; `h1` is `AUTHOR_NAME` at `--t-title`; two serif paragraphs (18.5/1.72, second in `--c-text-2`, from `AUTHOR_BIO` or a longer about-specific variant — real prose, not the article-footer author block's shorter bio, since §19.6 explicitly wants two paragraphs where §10.6's block wants one); a 200×220 portrait using the existing Figure placeholder treatment (§1.8 — "the alternative to an image is not a decorative graphic, it is no image," which the system already renders as a specified hairline-hatch placeholder; no real portrait file exists yet, and inventing one is out of scope for a docs task).
2. **Working on** — one middot-joined line, sans 15/2.0 (same treatment as the homepage's Interests line, different content — a "what I'm doing now" line, not interests; needs its own short constant, doesn't reuse `interests.json`).
3. **Experience** — gutter `Experience / selected`; the `site` collection's `experience.json`, rendered as page-local markup on the same 150px-period-track row system the blog index already established (§19.6 point 3, §23.3's own naming) — not a shared component (Finding B). Three hairline-separated rows.
4. **Elsewhere** — the `site` collection's `elsewhere.json`, four-column `LABEL`-over-value mono grid, 4 → 2 → 1 at the two breakpoints.

**No author block** (component 09's `AuthorBlock`, built for articles in Phase 3.6, is explicitly excluded here per §19.6's own "this page is the author" and Phase 3.6's own note that it "never" appears on the about page).

**Exit:** matches `docs/reference/about/{390,900,1320}-light.png` (same dark-theme gap as 7.4); Elsewhere collapses 4 → 2 → 1 exactly where the responsive note says; Experience rows stack period-above-role at mobile per §19.6's own line.

#### 7.6 · The 404 page (`src/pages/404.astro`)

New page, §19.7. Astro's static output serves this file automatically for unmatched routes with no adapter or SSR involved (AD-01 unaffected — this is a build-time-generated static file, not a server-rendered error handler). Masthead + gutter `404 / not found` (the number in accent) + `h1` `--t-title` ("This page does not exist") + one explanatory paragraph with the permalink pattern in inline code + a hairline-opened mono route list (`--c-text` + accent underline, em-dashed description). 128px band padding, top and bottom (E12's second and last user, alongside the homepage — confirmed by grep, no third user exists).

Route-list counts (`/writing — 38 articles, newest first`) are **live `getCollection` counts, not hand-typed numbers** — the content brief's standing no-invented-metrics rule (already enforced everywhere else: `/projects`'s `N · M active`, the writing index's `N articles`) applies here exactly the same way, even though §19.7's own worked example reads like static copy.

**Exit:** `/nonexistent-path` renders this page in `astro dev` (no way to test a true 404 status in a fully static build without a server, so this only proves the page itself renders, not the HTTP status — Phase 9's job); route counts match the real collections at build time; matches `docs/reference/404/1320-light.png` (Finding E's gap — no 390, no 900, no dark-theme shot exist for this page at all, the largest capture gap this plan has recorded).

#### 7.7 · Specimen page audit, not extension

Per Finding B/F: this phase adds zero new numbered components, so — unlike 3.9/4.11/5.11/6.11 — there is nothing new to add to `src/pages/dev/specimen.astro`. Audit instead: confirm all twenty numbered components (§6, components 01–20) render on the page, in both themes, and add the one genuinely new _state_ this phase introduces to an existing component — `ProjectItem`'s `selected` variant (7.3) — next to its existing `index`-variant entries.

**Exit:** all twenty components confirmed present; `ProjectItem` shows both variants; nothing else changes on the page.

#### 7.8 · Full screenshot baseline capture (T5)

All seven page types exist for the first time as of 7.6 — the 42-render matrix (7 × 3 widths × 2 themes) named in T3/T5's own definition can finally be captured in full, rather than the partial subsets each prior phase captured for its own pages only. Capture and commit `tests/baselines/`'s images now. **This sub-phase produces and commits the images only** — wiring automated diff comparison into `npm run verify`/CI is explicitly Phase 8's job per the original stub split ("Full T2–T5 wired into `npm run verify` and CI"), the same "baseline exists before it's enforced" ordering §2.7 already used to bring T3's DOM checks forward of their own enforcement phase.

**Exit:** 42 images committed under `tests/baselines/`, named per §0.3's `<page-slug>/<width>-<theme>.png` convention; Phase 8 has a real baseline to diff against on day one instead of having to generate one cold.

---

**Phase 7 overall exit criteria:**

- All seven page types (§19.1–19.7) exist and render: homepage, blog index, article, projects index, project detail, about, 404.
- `content.config.ts` has a third collection, `site` (`type: 'data'`), the first non-`writing`/`projects` collection in the codebase, backing the homepage's Now panel and Interests line and the about page's Experience and Elsewhere bands — none of which is a new component (§22 rule 8, §23.3), matching AD-03's own collections table for the first time since Phase 0.
- `projectsSchema.featured` exists, capped at three by a new invariant (OD-16 → ADR-0024); the Now panel has a real build-time-fetch-with-fallback mechanism behind a placeholder endpoint, real infrastructure deferred to Phase 9 exactly as Phase 5's real-301 upgrade was (OD-17 → ADR-0025).
- `ProjectItem` gains a `selected` variant (component 07's own table), no other component changes — the specimen page is audited, not extended, for the first time in this plan.
- The homepage's six bands, the about page's four bands, and the 404 route list are all page-local compositions per §23.3, not new components — checked against §22 rule 8 explicitly, not assumed.
- The full 42-render screenshot baseline is committed; automated enforcement stays Phase 8's, per the original stub.
- The reference-screenshot gaps for all three of this phase's pages (home/about: no dark-theme capture at any width; 404: five of six combinations missing entirely) are either closed by a fresh capture request or explicitly recorded as unclosed — the largest such gap this plan has hit, and the exit criteria say so rather than treating prose-only as equivalent to a checked page.

### Phase 8 · Enforcement hardening _(2–3 days — revised up from 1–2: the stub's "Full T2–T5 wired" undersells how much is already true and oversells how much is a rewrite. T2 is completely done — checked line by line against `.stylelintrc.json` — and most of T3's ten mechanical checks have run since Phase 2. The real gap is narrower and different in shape: T3's own matrix has never once run against a real page, T5 has no baseline images and no gallery/Lighthouse/lychee wiring at all, and one script sits in the wrong place in the pipeline)_

Six sub-phases. The stub's "Baselines locked" presumes baselines exist; they don't yet — that's this phase's job, not a check on work already done.

#### 8.0 · Six findings, checked against the repository as it stands

| #   | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Effect                                                                                                                                                                                                                   | Status                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| A   | **T2 is already fully built.** `.stylelintrc.json` implements every rule in §8's own table, verified rule by rule, plus `scripts/verify-tokens.mjs` for the two cross-file checks T2's prose names (`var()` parity, light/dark parity, stray `@layer`s) — both already run inside `pnpm verify`                                                                                                                                                                                                                  | Nothing to build for T2                                                                                                                                                                                                  | Confirmed done, no sub-phase needed                                |
| B   | **`tests/e2e/pages.ts` still lists only the eight `dev/*` pages Phases 2–4 built.** None of the seven real page types Phase 5–7 shipped (`/`, `/writing`, the article page, `/projects`, project detail, `/about`, `/404`) are in the T3 matrix                                                                                                                                                                                                                                                                  | T3's own definition — "the matrix that matters: 7 page types × 3 widths × 2 themes" — has never actually run against a real page; every check has only proven itself against `dev/layout-check` and the fixture articles | Blocks 8.1                                                         |
| C   | **`tests/baselines/` holds only `.gitkeep`.** Phase 7.8's own exit criterion — "42 images committed under `tests/baselines/`" — was never executed: no capture commit exists in `git log`, the directory is unchanged since Phase 0's scaffold                                                                                                                                                                                                                                                                   | T5 has nothing to diff a screenshot against; this phase's own "baselines locked" presumes they're already there                                                                                                          | Blocks 8.3                                                         |
| D   | **`check:links` is a literal stub** (`echo 'TODO Phase 8 …' && exit 0`, always green) **that sits in the wrong place in the pipeline even once real.** It runs inside `pnpm verify`, which `.github/workflows/build.yml` runs _before_ `astro build` — but a link checker has nothing to check until `dist/` exists. §10's own deployment prose already states the correct order ("`npm run verify` → `astro build` → `lychee` → Lighthouse CI → deploy"); `package.json`'s `verify` chain just never matched it | A real `lychee` wired into today's `verify` would either no-op forever or fail confusingly on a directory that doesn't exist yet                                                                                         | Blocks 8.2                                                         |
| E   | **No Lighthouse CI config exists anywhere** — no `lighthouserc`, no `@lhci/*` dependency, no budget wired to anything                                                                                                                                                                                                                                                                                                                                                                                            | Greenfield, not a gap in something half-built                                                                                                                                                                            | Blocks 8.5                                                         |
| F   | **§0.3/§8/§9's own prose still names a page that was never built.** `dev/gallery.astro` is named as the twenty-component state gallery in four places — but every implementing phase since 3.9 built and extended `src/pages/dev/specimen.astro` instead, and 7.7 explicitly _audited_ it rather than building a gallery — the same "the stub named something the design forbids" shape Phase 7's Finding B hit for `ExperienceRow`                                                                              | `specimen.astro` **is** the gallery; the prose is stale, not the build                                                                                                                                                   | Resolved by correcting the prose (8.4), not building a second page |

**Finding D, in detail.** `check:e2e` (Playwright, dev-server-backed) belongs inside `verify` — cheap enough to gate every push before a build is spent. `lychee` and Lighthouse CI audit the _built_ output: a broken internal link or a JS-budget regression can only be measured against `dist/`, and `pnpm verify` runs with no `dist/` on disk (CI's own `build.yml` runs `pnpm verify` then `pnpm run build`, in that order, today). The fix is mechanical, not a redesign: drop `check:links` from `verify`'s chain, run it — and Lighthouse — as their own CI steps after `pnpm run build`, exactly where §10 already puts them.

#### 8.1 · The real T3 matrix

1. `tests/e2e/pages.ts`: add the real routes alongside the existing eight `dev/*` fixtures, not in place of them — the fixtures still exercise stress shapes (a 210-character code line, a 7-column table) the real pages don't reach on their own. Eleven real URLs cover all seven page types: `/`, `/writing`, `/w/001` (representative article), `/w/007` (the real 8-tag entry — §25.6's stress case that Finding 6.10 already turned into real content, so no separate fixture page is needed here either), `/w/006` (the real 9,400-word / 34-section entry), `/w/004` (draft, 90 words, no TOC/author/related — reachable in `astro dev` via the `import.meta.env.PROD` gate every dynamic route already has since Phase 5), `/projects`, `/projects/self-hosted-homelab-infrastructure-automation` (representative detail), `/projects/industrial-production-testing-data-visualisation` (draft, no source — the other T4 fixture inherited as real content), `/about`, `/404`. `/writing/<slug>` is deliberately excluded: it's AD-10's redirect alias to `/w/<num>` (a meta-refresh utility page, confirmed by reading `src/pages/writing/[slug].astro`), not one of the seven page types §19 defines — checks 2–10 (type floors, measure, touch targets…) don't mean anything on a page whose only content is a canonical link and a refresh tag.
2. No new assertions. Checks 1–10 already generalise across any page — `chrome.spec.ts`/`prose.spec.ts` were built exactly this way in 3.8/4.9, per their own "turn it into a list, not a hardcoded page" instruction. Expanding `PAGES` is the entire change.

**Exit:** `pnpm check:e2e` runs checks 1–10 across three widths × two themes on all nineteen pages (eleven real routes, eight retained fixtures); a deliberate violation on a real page — remove the `overflow-x` on the projects-index status band, or widen the about-page portrait past its 680px prose measure — is proven to fail before being reverted, the same discipline every phase since 1.6 has used.

#### 8.2 · Fix the verify/build/link-check pipeline order, wire lychee

1. `package.json`: drop `check:links` from the `verify` chain (`check:format && check:astro && check:css && check:tokens && check:fonts && check:content && check:e2e && check:svelte` — `check:svelte` stays last, same position it holds today).
2. Replace `check:links`'s stub body with a real `lychee` invocation against `dist/**/*.html`, `--offline` (internal links only — a scheduled external-link sweep is Phase 9's nightly-cron territory per §10, not this phase's).
3. `flake.nix`: add `pkgs.lychee` to `devShells.default.packages`, the same precedent `pkgs.chromium` already sets for Playwright's local runs (CLAUDE.md's own standing instruction) — `lychee` isn't an npm package, so a local `pnpm run check:links` needs the binary on `PATH` without inventing a second installation mechanism.
4. `.github/workflows/build.yml`: after the existing `pnpm run build` step, install `lychee` (its own GitHub Action, since CI doesn't run inside the nix devShell) and run `pnpm run check:links` — matching §10's already-stated order exactly, not a new one.

**Exit:** a deliberately broken internal link fails `check:links` against a real `astro build` output and is proven to pass once fixed; CI is red on the same broken link; `pnpm verify` no longer touches `dist/` at any point in its chain.

#### 8.3 · Capture and wire the T5 screenshot baseline (Phase 7.8's carried-over exit criterion)

1. Capture the 42-render matrix — the seven real page types × 3 widths × 2 themes, **one representative URL per page type** (`/`, `/writing`, `/w/001`, `/projects`, `/projects/self-hosted-homelab-infrastructure-automation`, `/about`, `/404`) — not the broader 8.1 stress-case set, matching §0.3's original 7×3×2 = 42 definition exactly. Commit under `tests/baselines/<page-slug>/<width>-<theme>.png`, the naming convention §0.3 already set. This is the capture Phase 7.8 named but never ran (Finding C).
2. Wire regression with Playwright's own `expect(page).toHaveScreenshot()` — built into `@playwright/test`, already a dependency, no new diff tool — against the committed baselines, ~0.1% threshold per §8's table. New file `tests/e2e/visual.spec.ts` rather than folding into `chrome.spec.ts`/`prose.spec.ts`: it's the one T3 file whose failure mode is "update the baseline," not "fix the code," and keeping that separate matches §8's own instruction that a deliberate design change updates baselines in the same reviewable commit as the change.
3. No new script: `visual.spec.ts` joins the existing `check:e2e` Playwright run.

**Exit:** the 42 images are committed; a one-pixel deliberate CSS change fails `visual.spec.ts`, then passes once the baseline is regenerated (`playwright test --update-snapshots`) and committed alongside the change — proving the reviewable-diff workflow §8 describes, not just asserting it.

#### 8.4 · The component gallery — adopt `specimen.astro`, retire the stale name

1. Correct the `dev/gallery.astro` references (Finding F) to `dev/specimen.astro` in §0.3, §8's own T5 line, and the two cross-reference notes in Phases 6 and 7 — a prose fix; the page has been doing this job since Phase 3.
2. State-forcing, checked against what `specimen.astro` already does: `current`/`disabled`/`draft` states are already prop-driven per component (`ProjectItem`'s `forceMobile`, `Tag`'s `current` variant, nav's `aria-current`, none of them pseudo-classes) — nothing needs a new CSS class for those. `:hover`/`:focus` are the two states nothing on the page forces yet, resolved with Playwright's own `locator.hover()` / `locator.focus()` in `visual.spec.ts` (8.3) rather than a parallel `.force-hover` class added across twenty components' CSS — Playwright already dispatches real pointer/focus events, and there's no lint rule a class-based fake would satisfy that a real event doesn't. `:active` is deliberately skipped: checked directly, no component's CSS gives `:active` a rule `:hover` doesn't already share, so forcing a held mouse-down would prove a state that's pixel-identical to one already captured.

**Exit:** `dev/specimen.astro`, not a `gallery.astro` that has never existed, is the named T5 target everywhere in the plan; its hover/focus states are captured via real Playwright interaction in the same baseline set, both themes.

#### 8.5 · Lighthouse CI budgets

1. `lighthouserc.cjs` at the repo root: the budgets §8's own table already names — performance ≥ 98, a11y = 100, JS ≤ 5 KB, CLS ≤ 0.01, LCP ≤ 1.2s — run against `astro preview`'s local server (already a script; no new server mechanism) on 8.3's seven representative URLs. Fixture pages are excluded — a budget audits a real page's payload, not a stress test's.
2. `.github/workflows/build.yml`: `treosh/lighthouse-ci-action` (a GitHub Action, not an npm dependency — keeps AD-11's own JS-budget discipline from growing the project's `node_modules` in order to measure it) as the step immediately after `check:links`, both running post-`astro build` per §10's order.

**Exit:** CI fails if any budget regresses — proven by deliberately importing an unused ~6 KB script into an island, watching the JS-budget check go red, then reverting.

#### 8.6 · The written manual pre-merge checklist

`CHECKLIST.md` at the repo root — a sibling to `docs/decisions/README.md`, not a new documentation pattern. Three items, verbatim from §8's own "what stays manual" list, each citing its DESIGN_SYSTEM.md section so a reviewer doesn't have to hunt for the rule: accent budget (§1.6/§22.21, at most three accented elements per viewport), the box-or-rule test (§9.2), "does the band do work" (§5.6). One closing line pointing at §8 for the automated side, so the checklist doesn't silently start duplicating what CI already checks. The stub's own word is "written" — that's the whole ask, not a process document.

**Exit:** `CHECKLIST.md` exists; `IMPLEMENTATION_PLAN.md` §9's "someone else contributing" row (§24, currently naming "the manual checklist" with nothing behind it) now points at a real file.

---

**Phase 8 overall exit criteria:**

- T1–T5 all wired into `npm run verify` and CI, in the order §10 already specifies — fast checks pre-build, `lychee`/Lighthouse post-build — not the order `package.json` happened to accumulate them in (Finding D closed).
- The T3 matrix runs checks 1–10 against all seven real page types, not only the `dev/` fixtures that predate them (Finding B closed).
- The 42-render screenshot baseline exists and is enforced, closing Phase 7.8's carried-over exit criterion (Finding C closed).
- `check:links` is a real `lychee` check, correctly ordered after `astro build` (Finding D closed).
- Lighthouse CI budgets gate CI for the first time (Finding E closed).
- `dev/gallery.astro` is retired from the plan's own prose in favour of the page that has actually done the job since Phase 3 (Finding F closed).
- `CHECKLIST.md` exists for the three judgment calls §8 always said would stay manual.
- CI is red if any rule is violated — proven per sub-phase, not asserted: 8.1–8.5 each break one rule of their own tier deliberately and confirm the failure before reverting.

### Phase 9 · Deploy _(1 day)_

Per §10 below. Deploy an almost-empty site first so pipeline bugs surface before content exists.

**Carried from Phase 5 (Finding B):** upgrade `/writing/<slug>` from Astro's static meta-refresh to a real Caddy 301 — generate the slug→number map at build time, ship it alongside `dist/` in the same rsync, and have Caddy `import` it. Keeps content-driven redirects flowing through the GitHub Actions/rsync path rather than requiring an Ansible run per new article, preserving §10's own deploy/server-state boundary.

**Exit:** push to `main` → live in under two minutes; rollback tested; TLS A+ ; nightly rebuild for the Now panel works; `/writing/<slug>` issues a real 301, not a meta-refresh.

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
