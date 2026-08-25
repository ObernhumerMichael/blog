# The Ledger Design System

**Authoritative design specification — reverse-engineered from the existing design.**

Version 1.0 · Derived from: *Ledger Design System* (token & component specification), *Ledger Pages* (seven page templates at 1320 / 900 / 390), *Ledger Responsive* (thirteen responsive studies, twelve edge cases, responsive rule set and audit).

This document is implementation-agnostic. It contains no framework code, no markup and no stylesheets. Token names are given in the form the design already uses (`--token`) so that names survive into any implementation; values are authoritative.

**Scope.** A single-author technical publication: long-form engineering writing, project case studies, an about page and a 404. Seven page types, two themes, three viewport categories.

---

## Table of contents

1. [Design principles](#1-design-principles)
2. [Design tokens](#2-design-tokens)
3. [Responsive system](#3-responsive-system)
4. [Breakpoint philosophy](#4-breakpoint-philosophy)
5. [Layout system](#5-layout-system)
6. [Component system](#6-component-system)
7. [Navigation](#7-navigation)
8. [Buttons and links](#8-buttons-and-links)
9. [Cards and content surfaces](#9-cards-and-content-surfaces)
10. [Article system](#10-article-system)
11. [Project system](#11-project-system)
12. [Forms and inputs](#12-forms-and-inputs)
13. [Code and technical content](#13-code-and-technical-content)
14. [Images, diagrams and media](#14-images-diagrams-and-media)
15. [Tables](#15-tables)
16. [States and interaction](#16-states-and-interaction)
17. [Motion](#17-motion)
18. [Accessibility](#18-accessibility)
19. [Page-level composition](#19-page-level-composition)
20. [Responsive examples](#20-responsive-examples)
21. [Content guidelines](#21-content-guidelines)
22. [Design consistency rules](#22-design-consistency-rules)
23. [Exceptions register](#23-exceptions-register)
24. [Implementation independence](#24-implementation-independence)
25. [Accuracy audit and reconciliation](#25-accuracy-audit-and-reconciliation)

---

# 1. Design principles

## 1.1 Visual character

A warm-paper technical publication. Serif prose on an off-white ground the colour of uncoated stock, structured by hairline rules rather than boxes, instrumented throughout by monospace metadata. The reference for the whole system is a printed journal or a well-set technical report — not a web page, not a portfolio, not a product marketing site.

The design reads as **typeset**, not composed: there is one frame, one measure, one accent, and structure is carried by alignment and rules rather than containers and colour.

## 1.2 The five governing rules

These are the design's own stated principles and they decide every later question. All subsequent sections are consequences of them.

| # | Principle | Consequence |
|---|---|---|
| 01 | **Editorial first** | The article page is the most refined page on the site. Where reading comfort and visual interest conflict, reading wins — without exception. |
| 02 | **Timeless over trendy** | No glass, gradient mesh, glow, 3D, or landing-page hero. If a device would look dated in five years, it is not in the system. |
| 03 | **Engineering precision** | One grid, one spacing scale, hairlines instead of boxes, monospace for anything a machine could have produced. |
| 04 | **Restrained personality** | One accent, used for links, numbering and state only. Character comes from typography, density and writing. |
| 05 | **The work is the visual identity** | Diagrams, screenshots, code, tables and data supply the colour and texture. The interface never manufactures visual interest to compensate for a thin page — a thin page is a content problem. |

## 1.3 Emotional impression

Intended: *competent, unhurried, honest, legible.* The reader should feel they have arrived at something written by a person who measures things. Precision without coldness — the warm hue in every ground is what stops the engineering register from reading as a terminal.

Explicitly not intended: impressive, energetic, playful, premium, "designed".

## 1.4 Typography philosophy

Three families with **strict, non-overlapping roles**, which is the single strongest identity carrier in the system:

- **Serif** = *the thing itself.* Prose, titles, leads, quotes, callout bodies, item titles.
- **Sans** = *the interface around the thing.* Chrome, index descriptions, UI text, small labels in lists.
- **Mono** = *facts about the thing.* Every date, count, tag, status, section number, caption, and all code.

A reader learns this within one page. It means metadata never needs decoration to be recognised as metadata, and it means the serif never has to work below 15px. Two of the three families (Plex Sans and Plex Mono) share a skeleton, so the instrumentation never reads as a foreign face pasted onto the page.

## 1.5 Density and whitespace

Dense at the row level, generous at the band level. Index rows are 14–15px of vertical padding — deliberately tight, so forty articles read as a table of contents rather than a feed. Between page bands the system spends 40–72px. Whitespace is used to separate *kinds* of content, never to make a small amount of content look substantial.

The measure never widens to fill a large display; surplus width goes to the metadata gutter and the aside. Prose length is a fixed quantity in this design.

## 1.6 Colour philosophy

- Two grounds (light "paper", dark "ink"), both at **hue 75**, very low chroma.
- **One accent** (terracotta in light, clay in dark), used only for: link underlines, numbering, active state, tags, and the highlight marker in code.
- **Two semantic hues** (warn, ok) which may only appear alongside a word — never as the sole carrier of meaning.
- **Accent budget:** at most three accented elements visible in one viewport.
- Links inside prose inherit text colour and take an accent *underline*. The accent never colours the word itself, so a paragraph with nine links does not become a rash.

## 1.7 Borders, radius, elevation

- **Borders:** 1px, everywhere, one weight. 2px exists only as a left marker (quote, callout, active TOC tick, progress bar, highlighted code line).
- **Radius:** 4px, and only on something with a fill (code block, button, callout, framed control). A bordered-but-unfilled box is always square.
- **Elevation:** none. No shadows anywhere in the system. Layering is expressed by ground colour: `--c-sunken` reads as below the page, `--c-surface` as beside it.

## 1.8 Imagery

The design ships with placeholders, and the placeholder is itself specified (a 135° hairline hatch on the sunken ground with a mono label). Real imagery is expected to be: diagrams exported from the repository, UI screenshots, and one portrait. Figures are framed by a hairline with square corners — never a rounded browser mock, never a device frame, never a drop shadow. The alternative to an image is not a decorative graphic; it is no image.

## 1.9 Motion

Almost nothing moves. One duration pair (120ms / 160ms), one easing curve, a fixed list of properties that may animate, and a global reduced-motion override. Page transitions do not exist: navigation is a full document load. See §17.

## 1.10 Hierarchy

Hierarchy is produced, in order of strength:

1. **Family** (serif vs sans vs mono) — the primary signal.
2. **Size** — from a fixed eleven-step scale.
3. **Rules and alignment** — hairlines group peers; the gutter aligns everything.
4. **Colour lightness** (`--c-text` → `--c-text-2` → `--c-muted`).
5. **Accent** — last, sparingly, and never as bulk colour.

Weight does almost no work: serif runs at 400 and 600 only, sans at 400/500/600, mono at 400/500.

## 1.11 Accessibility principles

Accessibility is a design constraint, not a review pass. Three rules are load-bearing on the visual system:

- **Never colour alone.** Status carries a word *and* a dot shape; diffs carry `+`/`−` glyphs; callouts carry a label word; highlighted code lines carry a position marker; links carry a permanent underline.
- **One focus ring**, identical on every focusable element in both themes.
- **Nothing below 4.5:1**, including disabled and placeholder states.

## 1.12 Anti-patterns — what this design refuses

These are not stylistic preferences; introducing any of them breaks the system.

**Never introduce:**

| Anti-pattern | Why it breaks the system |
|---|---|
| Card grids for lists | Peers in a sequence get a shared rule and shared alignment. Six projects are one list, not six objects. |
| Shadows or elevation of any kind | Layering is ground colour. A shadow immediately reads as a different design language. |
| Gradient backgrounds, mesh, glow, glass, blur | Principle 02. The only gradients in the system are 24–28px scroll-edge fades. |
| A hero section, a value proposition, a pitch | The homepage is a front page: four lines of introduction, then the work. |
| Accent-filled buttons | The solid button is ink; the accent is for links, numbers and state. |
| Tag chips / pills | Chips add twenty boxes to an index page for no information gain. Tags are `#hashed` mono text. |
| Underline-on-hover for links | Hides the affordance. Underlines are permanent. |
| Icon fonts, icon libraries, logo marks, favicon rows | The glyph *is* the affordance (`→`, `↗`). There is no logo — the wordmark is the name in sans 600. |
| Newsletter boxes, social icon rows, share widgets | The footer is two tracks of mono facts. |
| Numbered pagination ("page 3 of 7") | Sequence navigation (prev/next by article number) and an archive-by-year list. |
| Scroll-triggered reveals, parallax, counters, smooth-scroll hijack, sticky-header shrink | §17. Nothing animates on first paint. |
| Reflowing tables into stacked key/value cards on mobile | Destroys column comparison, which is the only reason a technical table exists. |
| Wrapping code lines | A wrapped shell command is a broken shell command. |
| Truncating content to fit | The only permitted truncation in the entire system is a middle-truncated opaque machine identifier (a digest), plus the code block's filename label. |
| Emoji | Not part of the voice. |
| A second accent, or a decorative colour | One accent, budget of three per viewport. |
| Any new component for a single page | If a page needs something not in the inventory, the page is wrong before the component is. |

---

# 2. Design tokens

Tokens are declared once and overridden wholesale for the dark theme. Colour is authored in **oklch** so both themes can share hue and chroma while lightness is tuned per theme. No component may introduce a literal value that is not in these tables.

## 2.1 Colour — semantic roles, light theme ("paper")

| Token | Value | Role | Contrast on `--c-bg` |
|---|---|---|---|
| `--c-bg` | `oklch(0.982 0.006 75)` | Page ground | — |
| `--c-surface` | `oklch(0.962 0.007 75)` | Beside the page: footer band, table header, row hover, sticky header on scroll | — |
| `--c-sunken` | `oklch(0.945 0.008 75)` | Below the page: inline code, callout ground, figure placeholder | — |
| `--c-text` | `oklch(0.26 0.012 75)` | Prose, titles, current-page nav | 13.4:1 |
| `--c-text-2` | `oklch(0.40 0.012 75)` | Leads, descriptions, secondary prose | 8.1:1 |
| `--c-muted` | `oklch(0.58 0.012 75)` | Metadata, labels, captions | 4.6:1 |
| `--c-faint` | `oklch(0.72 0.012 75)` | Third-level mono data in the gutter, "client work", "… 26 more" | — |
| `--c-rule` | `oklch(0.90 0.008 75)` | Every hairline: section bands, rows, tables, frames | — |
| `--c-rule-2` | `oklch(0.82 0.008 75)` | Group opener: table top rule, start of a numbered list, quote marker | — |
| `--c-rule-in` | `oklch(0.93 0.008 75)` | Hairline *between* rows inside an already-opened group | — |
| `--c-accent` | `oklch(0.55 0.14 40)` | Link underline, numbering, tags, active state | 5.1:1 |
| `--c-accent-hi` | `oklch(0.47 0.15 40)` | Hover / active on accent | 7.2:1 |
| `--c-warn` | `oklch(0.50 0.10 70)` | Warning label, warning rule, a bad number in a table | — |
| `--c-warn-bg` | `oklch(0.955 0.030 85)` | Warning callout ground | — |
| `--c-ok` | `oklch(0.48 0.09 150)` | Status: active / maintained / ok | — |
| `--c-code-bg` | `oklch(0.20 0.010 75)` | Code block ground — **dark in both themes** | — |
| `--c-term-bg` | `oklch(0.155 0.008 75)` | Terminal block ground — one step below code | — |
| `--c-nav` | `oklch(0.45 0.012 75)` | Inactive navigation link, chrome labels on frames | — |

There is no `error` role and no `success` role beyond `--c-ok`; the publication has no transactional states. There is no `link` colour token: links take `--c-text` with an `--c-accent` underline.

## 2.2 Colour — semantic roles, dark theme ("ink")

Dark is **a second design, not an inversion**. Same hue family (75), chroma pulled to 0.008–0.012, and the accent *moves* rather than brightens.

| Token | Value | Role |
|---|---|---|
| `--c-bg` | `oklch(0.185 0.008 75)` | Page ground — warm-neutral, not black |
| `--c-surface` | `oklch(0.215 0.008 75)` | Footer, table header, callout ground |
| `--c-sunken` | `oklch(0.155 0.008 75)` | Inline code, terminal ground — recessed, same metaphor |
| `--c-text` | `oklch(0.90 0.008 75)` | Prose, titles. Never pure white (see below) |
| `--c-text-prose` | `oklch(0.88 0.008 75)` | Article running text specifically, one step under headings |
| `--c-text-2` | `oklch(0.72 0.012 75)` | Lead, descriptions — 7.9:1 |
| `--c-muted` | `oklch(0.60 0.012 75)` | Metadata — 5.2:1 |
| `--c-faint` | `oklch(0.65 0.012 75)` | Disclosure labels, third-level data |
| `--c-rule` | `oklch(0.30 0.008 75)` | Hairlines — proportionally stronger than light, or they vanish |
| `--c-rule-in` | `oklch(0.27 0.008 75)` | Inner row hairline |
| `--c-accent` | `oklch(0.72 0.120 45)` | Lifted 0.17 in lightness and turned 5° warmer |
| `--c-warn` | `oklch(0.80 0.115 85)` | Warning label |
| `--c-warn-bg` | `oklch(0.24 0.035 85)` | Warning callout ground |
| `--c-ok` | `oklch(0.75 0.105 155)` | Status: active |
| `--c-code-bg` | `oklch(0.20 0.010 75)` | **Unchanged from light theme** |
| `--c-term-bg` | `oklch(0.155 0.008 75)` | Unchanged |

### The seven deliberate deviations from a straight inversion

1. **Text tops out at 90% lightness.** Pure white on a dark ground makes a serif bloom and vibrate; 0.90 holds the letterforms.
2. **The accent moves, not just brightens.** Terracotta at L 0.55 becomes clay at L 0.72 / hue 45 — five degrees warmer to keep the same perceived temperature against a cool-reading dark ground.
3. **Rules are relatively stronger.** `--c-rule` sits 0.115 *above* the ground in dark, rather than 0.082 *below* it in light.
4. **Metadata brightens more than body text.** Muted goes from 4.6:1 to 5.2:1 — small mono at low contrast is the first thing to fail on a dark screen.
5. **Code stays put.** The code ground is identical in both themes; only its border changes (a visible hairline in light, none in dark — the block is self-evidently a separate object on a dark page).
6. **Images are dimmed, screenshots are not.** Photographs and diagrams are dimmed to ~92% brightness; UI screenshots are shown as captured on a sunken ground with a rule, because dimming them misrepresents the software.
7. **The warm hue survives.** Both grounds are hue 75. Dark mode is a dim room, not a different building.

**Theme behaviour.** Follows the operating system by default, with a manual override persisted locally and applied before first paint so there is no flash. The control is a `◐` glyph in a hairline frame in the masthead; below 760px it moves into the menu panel.

## 2.3 Code and syntax palette

Constant across both themes. Five semantic roles only, held at a consistent 0.78–0.82 lightness so no token shouts. Punctuation and operators stay at body colour.

| Role | Value |
|---|---|
| Code foreground | `oklch(0.86 0.008 75)` |
| Terminal foreground | `oklch(0.82 0.008 75)` |
| Comment | `oklch(0.60 0.012 75)` |
| Keyword / key | `oklch(0.80 0.09 90)` |
| String | `oklch(0.78 0.09 155)` |
| Literal / boolean | `oklch(0.74 0.12 300)` |
| Number | `oklch(0.80 0.09 60)` |
| Function / identifier | `oklch(0.82 0.09 200)` |
| Prompt glyph (`$`) | `oklch(0.72 0.12 45)` |
| Success token in output | `oklch(0.75 0.105 155)` |
| Line-number gutter | `oklch(0.45 0.010 75)` |
| Code chrome bar ground | `oklch(0.235 0.010 75)` |
| Code chrome rule | `oklch(0.30 0.010 75)` |
| Code control border | `oklch(0.34 0.010 75)` |
| Terminal chrome rule | `oklch(0.28 0.008 75)` |
| Highlight ground | accent at 16–18% alpha |
| Highlight marker | 2px inset bar, `oklch(0.72 0.12 45)` |
| Diff removed | text `oklch(0.80 0.075 25)` on `oklch(0.55 0.14 25 / 0.14)` |
| Diff added | text `oklch(0.80 0.08 155)` on `oklch(0.55 0.12 155 / 0.13)` |

These two diff hues appear nowhere else on the site.

## 2.4 Typography — families

| Token | Family | Fallbacks | Axes / weights used | Role |
|---|---|---|---|---|
| `--font-serif` | Source Serif 4 (variable) | Georgia, serif | opsz 8–60, wght 300–700; used at 400, 600, 400 italic | Prose, titles, leads, quotes, item titles, callout bodies |
| `--font-sans` | IBM Plex Sans (variable) | system-ui, sans-serif | 400, 500, 600 | Chrome, index descriptions, UI text, wordmark |
| `--font-mono` | IBM Plex Mono | monospace | 400, 500 | All metadata, all code, labels, captions, numerals in tables |

All three are libre, self-hostable, variable and subsettable — no third-party font requests at runtime.

**Why these three.** Source Serif has an optical-size axis, so the 42px title tightens and sharpens while 18.5px body stays open, and it still holds at 13px in a caption. Plex Sans is neutral without being anonymous; its slightly mechanical terminals give the chrome an engineered register. Plex Mono has a slashed zero and unambiguous `l 1 I` / `O 0`. Sans and Mono are siblings sharing a skeleton — this is why metadata never reads as a foreign face.

**Hard rule:** Plex Sans is never used for running prose longer than three lines. Plex Mono is used for metadata and code only.

## 2.5 Typography — the type scale

Desktop values (≥1100). Responsive values in §3.4.

| Token | Family / weight | Size | Line height | Tracking | Use |
|---|---|---|---|---|---|
| `--t-display` | serif 400 | 42 | 1.20 | −0.015em | Article and project-detail `h1` |
| `--t-title` | serif 400 | 34 | 1.24 | −0.013em | Page title on index, about, 404 |
| `--t-h2` | serif 600 | 25 | 1.30 | −0.010em | Section heading in an article |
| `--t-h3` | serif 600 | 19.5 | 1.40 | −0.006em | Subsection heading |
| `--t-lead` | serif 400, `--c-text-2` | 20 | 1.62 | 0 | The standfirst under a title — one paragraph, never two |
| `--t-body` | serif 400 | 18.5 | 1.72 | 0 | Running prose. The size the whole system is tuned around |
| `--t-ui` | sans 400 | 15 | 1.55 | 0 | Index rows, nav, buttons, descriptions in lists |
| `--t-small` | sans 400 | 13.5 | 1.55 | 0 | Secondary UI text, deks, notes in specs |
| `--t-meta` | mono 400, `--c-muted` | 12 | 1.50 | 0 | Every metadata datum |
| `--t-label` | mono 500, uppercase, `--c-muted` | 10.5 | 1.00 | +0.12em | Section labels, table heads, callout kind |
| `--t-code` | mono 400 | 13.5 | 1.75 | 0 | Code blocks; inline code at 0.86em of parent |

### Derived and component-local type values

These recur across the design and are part of the system even though they are not top-level scale steps. They exist because item titles must sit between `--t-h3` and `--t-ui`.

| Context | Value |
|---|---|
| Featured entry title (blog index) | serif 600 · 28 / 1.26 / −0.012em |
| Featured entry title (homepage) | serif 600 · 27 / 1.26 / −0.012em |
| Project index item title | serif 600 · 21 / 1.30 / −0.009em |
| Project item title (in a list on another page) | serif 600 · 18–19 / −0.008em |
| Index row title | serif 600 · 17–17.5 / −0.006em |
| Related / prev-next title | serif 600 · 14–17 / 1.35 |
| Homepage opening statement | serif 400 · 24 / 1.50 / −0.008em |
| Callout body | serif 400 · 16 / 1.62 |
| Quote | serif 400 **italic** · 18–19 / 1.60 |
| Wordmark | sans 600 · 14.5 / −0.01em |
| Nav link | sans 400 · 13.5 |
| Metadata, small (captions, footer, TOC, project instrument track) | mono 400 · 11.5 |
| Metadata, smallest (gutter label, prev/next kicker) | mono 400 · 10.5–11 |
| Table cell | mono 400 · 13 |

### Typographic laws

- **Measure.** Prose is capped at 680px (≈68 characters at 18.5px). The column does not grow on a large display; the extra width goes to the gutter and the aside, never to the line.
- **Tracking.** Negative tracking only above 24px, and only on the serif. Mono is never tracked, except the uppercase label, which needs +0.12em to stay legible.
- **Italic** is used for quotes only.
- **Uppercase** is used for the label token only, never for headings or buttons.
- **Numerals** live in mono wherever they are data, so digits align in a column.
- Titles use pretty text wrapping; long titles additionally allow automatic hyphenation. Nothing is clamped, nothing is ellipsised.

## 2.6 Spacing

**Base unit 4px.** Canonical scale, with the permitted use of each step:

| Step | Permitted use |
|---|---|
| 4 | Baseline nudges only — superscripts, icon optical alignment |
| 8 | Tag padding-y, gap between tag and value, label→value |
| 12 | List-item gaps, `h3` → following paragraph, gutter label internal leading |
| 16 | `h2` → following paragraph, callout padding-y, code padding-y |
| 20 | Rule → content, **mobile page margin**, code padding-x, quote indent |
| 24 | **Paragraph → paragraph** — the most-used value on the site. Also: metadata row gap, footer padding-y |
| 32 | Prose → block element (code, figure, table). Index row padding-y ×2 |
| 40 | **Tablet section band padding.** Article footer apparatus spacing |
| 56 | Paragraph → next `h2`; **desktop page margin**; desktop section band padding |
| 72 | Page-level band separation; article header → body |
| 96 | End of article body → footer apparatus |
| 128 | Reserved: page top on the homepage and the 404 only |

**The grid-gap exception.** The gap between gutter, measure and aside is **44px** — the single value outside the scale, set by the 12-column arithmetic of the 1320px frame. It is a layout constant, not a spacing step.

**Responsive spacing steps.** The responsive pass adds three intermediate steps, all on the 4px base: **26** (mobile prose→block), **36** (mobile paragraph→h2), **48** (tablet paragraph→h2). Spacing shrinks by exactly one step per breakpoint, never two, so vertical rhythm stays recognisable.

**Component interior sub-steps.** Inside a component, even 2px sub-steps are permitted where a control or row needs optical rather than rhythmic spacing: **14, 18, 22, 28**. These appear as callout padding (14/18), code chrome padding (9/14), index row padding-y (14–15), header padding-y (14/18/20), section band padding (22–34) and card-frame padding (16/18). They are bounded: they may only be used *inside* a component, never between components, and never on a page band.

## 2.7 Sizing

| Token / dimension | Value | Notes |
|---|---|---|
| `--page-max` | 1320px | Outer frame; header, footer and grid all align to it |
| Page margin | 56 / 32 / 20 | desktop / tablet / mobile |
| `--gutter-w` | 148px | Left metadata column, ≥1100 only |
| `--measure` | 680px (≈68ch) | Hard cap on any line of running prose |
| `--aside-w` | 200px | Right column: TOC/share/progress, ≥1100 only |
| `--grid-gap` | 44px | Between the three article tracks |
| Article header content width | 760px | The header block may exceed the measure |
| Lead paragraph width | 62ch | Narrower than the measure, deliberately |
| List description width | 58ch | Project descriptions, homepage work items |
| Long-form spec prose | 68–72ch | Explanatory paragraphs in a spec context |
| About / experience description | 66ch | |
| Masthead height | 60px | Fixed at ≥1100 |
| Footer band padding-y | 24px | |
| Index row minimum height | 48px | Touch target; the whole row is the target |
| Any interactive element | ≥44px on touch | |
| Image height cap | 65vh | So a tall screenshot cannot occupy the whole screen |
| Portrait, about page | 200 × 220 | |
| Portrait, article author block | 88 × 88 | |
| Figure placeholder heights | 170 / 200 / 230 / 250 | By role: homepage lead / index lead / case-study / article diagram |
| Mobile TOC scroll cap | 150px | Only above 20 sections |
| Code / table scroll fade | 24–28px | |
| Project instrument track | 190–210px | Right-hand column in a project item |

## 2.8 Borders

| Property | Value |
|---|---|
| Weight | **1px** everywhere. `2px` only as a left marker. Never 3px. |
| Colours | `--c-rule` default · `--c-rule-2` to open a group · `--c-rule-in` between rows inside a group |
| Style | Solid. Dashed appears **only** in specification diagrams (grid overlays), never in the product. |

**Where borders are used:** page band separators (full frame width), row separators in every list, table head and body rules, figure frames, code block frames (light theme), the TOC spine, the masthead bottom rule, the footer top rule, framed controls (copy, theme, disclosure).

**Where borders must not be used:** around a list item (use a shared rule), around prose, around a heading, around an index row, as a decorative accent bar, on a table's vertical axis (no vertical rules, ever), or to simulate elevation.

**The 2px marker set** — exhaustive: quote (neutral `--c-rule-2`), callout (accent / warn), active TOC item (accent tick on the spine), reading-progress bar (accent on `--c-rule`), highlighted code line (accent, inset).

## 2.9 Radius

| Token | Value | Applies to |
|---|---|---|
| `--radius` | 4px | Code block, terminal block, button, callout (3 corners: `0 4 4 0`), framed panel, disclosure frame |
| `--radius-sm` | 3px | Inline code, copy control, theme control, small framed labels |
| — | 0 | Everything else: figures, tables, rows, bands, quotes, images, screenshots |
| — | 50% | Status dot only (6px) |

**Rule:** radius requires a fill. A bordered-but-unfilled box is square. At <760 the code block loses its radius entirely (it goes full-bleed and is bounded by two hairlines instead).

## 2.10 Elevation

**There is no elevation system.** No shadows are used anywhere. This is a design rule, not an omission.

Depth is expressed by ground colour only:

| Perceived depth | Ground |
|---|---|
| Below the page | `--c-sunken` |
| The page | `--c-bg` |
| Beside the page (a band, a header row) | `--c-surface` |
| A different kind of object entirely | `--c-code-bg` / `--c-term-bg` |

Shadow-shaped effects are used twice as *drawing* devices, never as depth: an underline drawn as an offset shadow (so it survives a mid-URL line break without changing line height), and the 2px accent tick on the TOC spine.

## 2.11 Icons

**There is no icon set, no icon font, and no icon library.** The system uses a closed set of typographic glyphs, set in the surrounding font at the surrounding size.

| Glyph | Meaning | Placement |
|---|---|---|
| `→` | Internal forward navigation | Trailing, after a hair space |
| `↗` | External link | Trailing, muted |
| `←` | Previous in sequence | Leading |
| `·` | Datum separator inside a mono string | Between tokens |
| `/` | Breadcrumb separator | Between path segments |
| `#` | Tag prefix | Leading, part of the token |
| `●` / `○` | Status: filled = live, hollow = archived (6px) | Leading the status word |
| `◐` | Theme control | In a hairline frame |
| `+` / `−` | Disclosure closed / open; also diff markers | Trailing (disclosure), leading (diff) |
| `sup` numeral | Footnote reference | Superscript mono 11, accent |

**Rules for glyphs with text:** the glyph is separated by a hair space or a 5–6px gap, inherits the text's colour unless it is a status dot, is never boxed, never coloured for decoration, and is never the only content of an interactive element. A status dot is 6px, sits 6px before its word, and the word is always present.

## 2.12 Motion tokens

| Token | Value |
|---|---|
| `--dur` | 120ms — state change on an element the pointer is already on |
| `--dur-layout` | 160ms — anything that changes layout (disclosure open/close) |
| Ceiling | 200ms. Nothing exceeds it. |
| `--ease` | `cubic-bezier(.2, 0, 0, 1)` — one curve for everything |

## 2.13 Focus token

| Token | Value |
|---|---|
| `--focus` | 2px solid `--c-accent`, 2px offset, square corners |

Identical on every focusable element in both themes, shown on keyboard focus only. Nothing removes it without replacing it.

## 2.14 Breakpoint tokens

| Token | Query | Turns on |
|---|---|---|
| *base* | 0–759 | Single column, 20px margins, full-bleed blocks, disclosure nav, stacked rows |
| `--bp-rows` | ≥ 760 | Multi-track rows return, inline nav returns, blocks re-enter the measure, margins → 32 |
| `--bp-gutter` | ≥ 1100 | The 148px metadata gutter and 200px aside appear, margins → 56, frame caps at 1320 |
| *container* | container < 700 | Figures, code and tables consult their own container rather than the viewport |

---

# 3. Responsive system

## 3.1 Viewport categories

| Category | Range | Reference width | Character |
|---|---|---|---|
| **Desktop** | ≥ 1100 | 1320 | Three tracks: gutter, measure, aside. The full instrument panel. |
| **Tablet** | 760–1099 | 900 | One column capped at the measure. Gutter content becomes running heads; aside content relocates. |
| **Mobile** | < 760 | 390 | One fluid column. Rules go full-bleed, text keeps its margin, machine content scrolls. |

Mobile is the base layer; both breakpoints are additive `min-width` queries. Mobile is **not** the desktop design shrunk: the measure is re-tuned, the gutter's content is relocated rather than dropped, and code and figures break out of the margins so a 92-character line of YAML stays readable.

## 3.2 The four stacking laws

Four rules cover every component in the system, which is why there are no page-specific responsive exceptions.

| # | Law | Detail |
|---|---|---|
| 01 | **Substance before instrumentation** | When two tracks stack, the serif content leads and the mono data follows. One sanctioned exception: project status, where "is it alive" outranks the description. |
| 02 | **Relocate, never delete** | A datum may move, abbreviate or wrap. Only the dek on index rows may disappear, because the title already carries it. |
| 03 | **Machine content scrolls, prose reflows** | Code, tables and wide diagrams keep their true dimensions inside a contained scroll region; text always reflows. The page scrolls in one axis only, at every width. |
| 04 | **Rules go full-bleed, text keeps its margin** | Below 760, every hairline spans the viewport while text stays inside 20px. This single move is most of why the phone layout still looks engineered rather than boxed-in. |

## 3.3 Grid and spacing across breakpoints

| | ≥1100 | 760–1099 | <760 |
|---|---|---|---|
| Frame / margin | 1320 max / 56 | fluid / 32 | fluid / 20 |
| Columns | 12 × 24 gutter | 8 × 20 gutter | 4 × 16 gutter |
| Article shape | 148 / 680 / 200, 44 gaps | one column, max 680 | one column, fluid |
| Section band padding-y | 56 | 40 | 32 |
| Paragraph → `h2` | 56 | 48 | 36 |
| Prose → block element | 32 | 32 | 26 |
| Paragraph → paragraph | 24 | 24 | 20–22 |

Every value is a step on the existing 4px scale — the responsive pass introduced no new numbers.

## 3.4 Typography across breakpoints

| Token | ≥1100 | 760–1099 | <760 |
|---|---|---|---|
| `--t-display` | 42 / 1.20 | 36 / 1.22 | 28 / 1.24 — **26 above 90 characters** |
| `--t-title` | 34 / 1.24 | 30 / 1.24 | 26 / 1.26 |
| `--t-h2` | 25 / 1.30 | 24 / 1.30 | 21 / 1.30 |
| `--t-h3` | 19.5 / 1.40 | 19 / 1.40 | 18 / 1.40 |
| `--t-lead` | 20 / 1.62 | 19 / 1.60 | 17 / 1.60 |
| `--t-body` | 18.5 / 1.72 | 18.5 / 1.72 | 17 / 1.70 |
| `--t-code` | 13.5 / 1.75 | 13.5 / 1.75 | 12.5 / 1.75 |
| `--t-meta` | 12 | 12 | 11.5 |
| `--t-ui` | 15 | 14.5 | 14 |
| `--t-label` | 10.5 | 10.5 | 10.5 |

**Reasoning.** Body drops 1.5px and nothing else moves much: at ~350px of measure, 17px yields 38–40 characters per line — the phone's equivalent of the 68-character desktop measure — and Source Serif holds its optical size at that setting.

**Type floors** (not curve points — hard minimums):

| Floor | Value | Reason |
|---|---|---|
| Metadata | 11.5px | Below this the mono loses its slashed zero |
| Code | 12.5px | Same |
| Body | 17px | Reading comfort |
| Label | 10.5px | Uppercase + tracking keeps it legible |
| Touch target | 44px (rows 48px) | — |

## 3.5 System behaviour across breakpoints

| System | ≥1100 | 760–1099 | <760 |
|---|---|---|---|
| **Metadata** | 148px gutter column, sticky per section | Uppercase mono running head above each section, rule under it | Two-line block under the title; short running head per section |
| **Navigation** | Name + role + 4 links + theme | Name + 4 links + theme | Name + `menu` disclosure, in flow, counts in mono; theme moves inside the panel |
| **TOC** | Sticky gutter list | Open disclosure, two columns | Closed disclosure; 150px scroll cap above 20 sections |
| **Progress** | In the aside, with share links | 2px bar under the header | 2px bar under the header; share moves to the article end |
| **Code** | In measure, radius 4, full border | Same | Full-bleed, two hairlines, no radius; numbers pinned, content scrolls |
| **Tables** | In measure | In measure; scroll region if >5 columns | Always a full-bleed scroll region, first column sticky, fade + `scroll →` |
| **Images** | In measure, hairline, 65vh cap | Same | Full-bleed; caption keeps the text margin; wide diagrams tap to full-size |
| **Multi-track rows** | Full tracks (5 on the blog index, 2 on projects) | Reduced tracks; secondary data joins line 2 | Stacked: title first, one wrapped mono line, full-bleed hairline, 48px target |
| **Footer** | Two tracks, left/right | Two tracks | Stacked, left-aligned, same mono 11.5 |
| **Buttons** | Inline row, 10/14 padding | Same | Full width if a primary action, 44px height |
| **Aside** | 200px sticky column | Contents relocate (see §3.6) | Contents relocate |

## 3.6 Where each gutter and aside job goes

The gutter is the strongest desktop signature, so its dissolution is specified job by job. **The column is what goes; the data never does.**

| Gutter job | ≥1100 | 760–1099 | <760 |
|---|---|---|---|
| Article TOC | Sticky column list | Open disclosure, two columns | Closed disclosure |
| Section label | Gutter | Running head above the section | Running head, compressed to two tokens |
| Index year header | Gutter | Sticky row spanning the list | Sticky row spanning the list |
| Article number + series | Gutter | Right side of the running-head row | First line of the two-line metadata block |
| Right aside: share | Sticky column | Moves to the end of the article | Moves to the end of the article |
| Right aside: progress | Sticky column, with percentage | 2px bar under the header | 2px bar under the header |
| Project status | Right track | Right track, narrower | First line of the item's mono block |

**Why no inline gutter at 390.** A 90px column beside a 260px measure would ruin the reading, which is the one thing that may never be traded.

**The two sanctioned abbreviations** (the only compressions allowed anywhere in the metadata system): `last deploy 2026-08-19` → `dep 08-19`, and a section label reduced to its two most useful tokens. Both stay mono, muted, and in fixed order.

## 3.7 Content-adaptive rules

Three rules respond to content length rather than to viewport width:

| Trigger | Behaviour |
|---|---|
| Title over 90 characters at <760 | Display type steps 28 → 26px. The only length-conditional type rule in the system. |
| More than 20 sections | Mobile TOC gains a 150px internal scroll cap. |
| Over 8,000 words | The article is split into numbered parts with series navigation. A length rule, not a layout rule. |
| Fewer than three `h2`s | No TOC at all. Article apparatus is conditional on there being an article to support. |
| More than 5 table columns at tablet | The table becomes a scroll region early. |

---

# 4. Breakpoint philosophy

## 4.1 Two breakpoints, named for what they do

The system has exactly two breakpoints, and neither is named after a device. Each exists because a **specific layout structure stops fitting**, which is a content-driven, not device-driven, definition.

| Token | Value | Why *this* number |
|---|---|---|
| `--bp-rows` | 760 | Below this width a multi-track row cannot hold its tracks: a 5-track index row (number, date, title+dek, tag, reading time) has no room for a serif title of usable length once the mono tracks take their fixed widths. 760 is also where an inline nav of four links plus a wordmark stops fitting comfortably at 13.5px. |
| `--bp-gutter` | 1100 | This is the width at which `148 + 44 + 680 + 44 + 200 = 1016` plus 2 × 32 margins can be honoured. Below it, the three-track article shape cannot exist without stealing from the measure — and the measure is never negotiable. |

Everything else that changes at these two thresholds is a *consequence* of those two structural facts, not an independent decision. That is why there are no page-specific breakpoints and no third breakpoint: no other component in the inventory fails at any other width.

## 4.2 The one container query

**Exception to the two-breakpoint rule:** figures, code blocks and tables consult **their own container** (< 700) rather than the viewport, so an article body embedded anywhere — a narrower page, a preview, a two-column context — behaves correctly. This is the only place the system reasons about available space rather than viewport width, and it is exactly the set of elements whose behaviour depends on how much room *they* have rather than how much room the *page* has.

## 4.3 Direction and philosophy

- **Mobile-first, additive.** The phone layout is the base; both breakpoints add structure.
- **Prefer available space over device names.** "Below `--bp-rows`" is the correct way to describe a rule; "on phones" is not. A 700px browser window on a desktop gets the mobile row treatment, correctly.
- **One step at a time.** Spacing reduces by exactly one scale step per breakpoint, type by one scale value. Nothing jumps two steps, so a reader resizing a window never sees the design change character.
- **Never introduce a third breakpoint for a single component.** If a component fails between 760 and 1100, the fix is the component, or one of the three registered exceptions in §23.

---

# 5. Layout system

## 5.1 The frame

Every page is one 1320px-max frame with symmetric margins (56 / 32 / 20). The frame is the alignment authority: masthead, all bands, the footer, and every rule align to it. There is no full-width-outside-the-frame section except the two ground-coloured bands (sticky header, footer), and even those keep their content on the frame.

## 5.2 The three column structures

Inside the frame there is a 12-column grid (24px gutters at desktop), but only **three arrangements** are ever used. Every page in the system uses one of them.

**A. Article shape** — `148 / 680 / 200` with 44px gaps.
The full instrument layout: metadata gutter, measure, sticky aside. Used by the article page and the project detail page.

**B. Labelled band** — `148 / minmax(0, 1fr)` with a 44px gap.
The workhorse. A gutter label beside a content block of any internal structure. Used by every page band on the homepage, the blog index, the projects index, the about page and the 404. The content side may itself split (commonly `minmax(0,680px) / 1fr` for content-plus-figure, or `minmax(0,1fr) / 190–210px` for content-plus-instruments).

**C. Full-measure block** — a single `680px` column.
Used for the article body when the gutter is not present, and for prose-only sections.

**The constant is the gutter.** It is what makes an about page look like an article. Below 1100 all three arrangements collapse to a single column and the gutter's content relocates per §3.6.

## 5.3 Vertical rhythm

Pages are built from **bands**, not from a continuous flow. A band is:

- A `148 / 1fr` grid row,
- with 40–56px of vertical padding (56 desktop / 40 tablet / 32 mobile),
- closed by a full-frame hairline at its bottom edge.

The last band before the footer has no bottom rule (the footer's top rule serves). Page-level separation between major regions is 72px; the gap from the end of an article body to its footer apparatus is 96px; the 128px step is reserved for the top of the homepage and the 404.

Within prose, the rhythm is: 24 between paragraphs, 16 from `h2` to its first paragraph, 12 from `h3` to its first paragraph, 32 from prose to a block element, 56 from a paragraph to the next `h2`.

## 5.4 Alignment

- Everything aligns to the frame's left and right edges, or to a track boundary inside it.
- Content in the metadata gutter is left-aligned and top-aligned to its band, and is sticky within its band on desktop.
- Instrument tracks on the right of an item are **right-aligned** (project status, reading time, prev/next "next" side).
- Numeric table columns are right-aligned; the identifying column is left-aligned.
- Section headings baseline-align their mono number with the serif text (12px gap).

## 5.5 Full-bleed vs constrained

| Element | Desktop | Mobile |
|---|---|---|
| Prose, lists, quotes, headings | Constrained to the measure | Constrained to the 20px text margin |
| Code, terminal, tables, figures | Constrained to the measure | **Full-bleed** — spans the viewport, bounded by two hairlines |
| Hairlines and band separators | Full frame width | **Full viewport width** |
| Captions | Aligned to the measure | Aligned to the 20px text margin, *not* to the full-bleed block |
| Page bands with a ground colour (header, footer) | Full frame, content on the frame | Full viewport, content at 20px |

The caption rule is deliberate: it is what keeps a full-bleed table visibly attached to the article while its content moves.

## 5.6 How to compose a page

1. Masthead (fixed, full frame width, bottom hairline).
2. A **header band**: gutter label + title + optional lead + a metadata row closed above by a hairline.
3. One or more **content bands**, each with a gutter label, each closed by a hairline. Band content is a list, a prose block, a content+figure pair, or a content+instrument pair.
4. Optional **article apparatus** (references, author, prev/next, related) — hairline-separated blocks inside the measure.
5. Footer band (`--c-surface` ground, top hairline, two mono tracks).

A page is finished when every band is doing work. There is no filler band, no "features" band, no call-to-action band.

---

# 6. Component system

Twenty components, deliberately. If a page needs something not on this list, the page is wrong before the component is.

**Inventory:** 01 Header · 02 Navigation · 03 Text link · 04 Button · 05 Blog post item · 06 Section heading · 07 Project item · 08 Tag · 09 Metadata row · 10 Callout · 11 Quote · 12 Figure · 13 Caption · 14 Table · 15 Table of contents · 16 Breadcrumb · 17 Pagination · 18 Footer · 19 Code block · 20 Terminal block.

Components 01–04 are specified in §7 and §8; 14 in §15; 19–20 in §13; 12–13 in §14. The remainder follow here.

---

## 05 · Blog post item (index row)

**Purpose.** One article in a list. Designed so that forty articles read as a table of contents rather than a feed.

**Anatomy (desktop, blog index — five tracks).**
`52px` article number · `104px` ISO date · `minmax(0,1fr)` title + dek · `130px` primary tag · `80px` reading time (right-aligned).

**Variants.**

| Variant | Tracks | Used on |
|---|---|---|
| Index row, full | 5 | Blog index |
| Index row, compact | 4 (number, date, title+dek, reading time) | Homepage "latest writing" |
| Featured entry | Not a row — a block: metadata row, 27–28px serif title, lead paragraph, optional series line, paired with a lead figure | Blog index, homepage |
| Related item | Title 16.5 + one mono line | Article footer apparatus |

**Typography.** Number mono 11.5 accent · date mono 11.5 muted · title serif 600 17–17.5 / −0.006em · dek sans 13.5 `--c-text-2` on the same line, joined by an em dash · tag mono 11.5 accent · reading time mono 11.5 muted.

**Spacing.** 14–15px padding-y, 20px track gap, one hairline (`--c-rule`) between rows, `--c-rule-2` opening the group.

**States.** Default as above. **Hover:** row ground shifts to `--c-surface` *and* the title takes its accent underline — no lift, no scale, no shadow. **Focus:** the token ring on the whole row. **Visited:** no distinct treatment. **Current:** not applicable (a row never represents the current page).

**Interaction.** The entire row is the hit target, minimum 48px tall.

**Responsive.** Tablet: reading time joins the date line, tag track drops into the title line's trailing metadata. Mobile: **title first** at 16.5, then one wrapped mono line — `038 · 2026-07-28 · 14 min` — and the **dek is dropped** (the only datum in the system permitted to disappear). Hairlines go full-bleed; the row keeps 48px.

**Usage.** Any chronological or ranked list of articles.
**Don't use when** the entry needs more than one line of description — that is a featured entry, or a project item.

---

## 06 · Section heading

**Purpose.** Structure inside long-form content, and the anchor system.

**Anatomy.** A mono two-digit number in accent, baseline-aligned 12px before the serif heading text.

**Typography.** Number mono 400 13 (12 on mobile) accent; text `--t-h2` (serif 600 25/1.30/−0.010em).

**Spacing.** 56px above (48 tablet / 36 mobile), 16px below.

**Rules.** The number is **content, not decoration**: it is the anchor target and the TOC key. `h3` subsections are numbered `n.m` in the text itself (`2.1 · What the drift was hiding`) and carry no separate mono span. Levels never go deeper than `h3`.

**Responsive.** 25 → 24 → 21. Gap 12 → 10 at mobile.

---

## 07 · Project item

**Purpose.** One project in an index or a selected-work list. **Never a card, never a thumbnail grid.**

**Anatomy (projects index).** Three tracks: `44px` number · `minmax(0,1fr)` substance (max 640px) · `210px` instruments (right-aligned).
Substance: serif 600 21 title (underlined when linked) → description paragraph(s) sans 14.5/1.65 → an optional `**Why.**` paragraph → mono stack line.
Instruments: status (dot + word) → period → primary link (`case study →`) → source (`github.com/… ↗` or `client work · no source`).

**Variants.**

| Variant | Difference |
|---|---|
| Projects index item | Full: 3 tracks, 190–210px instrument track, 26px padding-y, description up to two paragraphs |
| Selected-work item (homepage) | 2 tracks, title 19, description 14 capped at 58ch, 22px padding-y, shorter instrument list |
| Compact project item | Number + title inline, one description line, one stack line, tags below |

**Typography.** Number mono 11.5–12 accent · title serif 600 18–21 / −0.007…−0.009em · description sans 14–14.5 / 1.62–1.65 `--c-text-2` · stack mono 11.5 muted, middot-joined · instruments mono 11.5 / 1.9–2.0 muted.

**Spacing.** 22–26px padding-y, 24–32px track gap, hairline between items, `--c-rule-2` opening the list.

**States.** Title link: accent underline permanent, `--c-accent-hi` on hover. Status is not interactive. The row is not a single link — the title and each instrument link are separate targets.

**Responsive.** The instrument track folds **under** the description as a single wrapped mono line with **status first** — the one sanctioned inversion of stacking law 01, because "is it alive" outranks the description. Tablet: same two tracks, narrower right track.

**Don't use when** the item has no status and no stack — that is a blog post item.

---

## 08 · Tag

**Purpose.** Taxonomy. Navigational on an index, descriptive on an article.

**Anatomy.** A lowercase, hash-prefixed mono token. **No chip, no background, no border, no radius.**

**Typography / colour.** Mono 400 12 (11.5 in dense contexts), `--c-accent`.

**Spacing.** 12–14px gaps, wrapping flex row.

**States.** Hover: accent underline. Focus: the token ring.

**Variants.** Plain tag (`#ansible`) · counted tag on an index filter row (`#infrastructure 11`) · the "all" pseudo-tag, which is the only tag rendered in `--c-text` with an accent underline to mark the current filter.

**Rules.** Max three per article in normal use. A tag is never coloured differently per taxonomy. **Why no chips:** chips add twenty boxes to an index page for no information gain — and, tested at 390 with eight tags, a plain wrapping flex still reads as one block precisely because there are no boxes to multiply.

---

## 09 · Metadata row

**Purpose.** The instrumentation line for any titled thing. The single most identity-carrying component after the gutter.

**Anatomy.** A wrapping flex row of mono tokens in **fixed order**, with a hairline above it.

**Fixed order:** *number → date → effort → revision → taxonomy.*
Canonical form: `038  2026-07-28  14 min  3,180 words  upd 2026-08-02  #ansible  #linux`

**Typography.** Mono 400 12 (11.5 at mobile) `--c-muted`; number and tags in `--c-accent`.

**Spacing.** 24px gaps at desktop (22 tablet / 14 mobile), 16px above the row from its hairline. **The gap is the separator** — no bullets, no pipes, no slashes.

**Datum specification.**

| Datum | Rendering | Rule |
|---|---|---|
| Date | `2026-07-28` | ISO 8601 always, never "Jul 28". Sortable, unambiguous, and it looks like a log line. |
| Updated | `upd 2026-08-02` | Only when it differs from publication by more than a day. |
| Article number | `038` | Three digits, zero-padded, accent, monotonic by publication. Doubles as the permalink `/w/038`. |
| Reading time | `14 min · 3,180 words` | Word count sits beside it — for technical readers it is the more honest number. |
| Tag | `#ansible` | Lowercase, hash-prefixed, accent, no chip. Max three. |
| Technologies | `ansible · debian · postgres` | Middot-joined, muted, **not links**. A stack is a fact, not navigation. |
| Project status | `● active` / `○ archived` | Four states: active · maintained · paused · archived. Dot filled or hollow **and** the word always present — never colour alone. |
| Section label | `SELECTED WORK` | `--t-label`. Lives in the gutter on desktop, paired with a count or date beneath it. |
| Series | `series: declarative homelab · 2 of 4` | Muted mono, below the lead or in the gutter. |
| Internal link | `Case study →` | Trailing arrow, accent underline on the text. |
| External link | `GitHub ↗` | North-east arrow, muted. The glyph is the affordance. |
| Repo line | `github.com/mo/homelab ↗` | Full path, not the word "GitHub", when the repository is the artifact. |
| Progress | `read 38%` + a 2px bar | Aside on desktop; a bar under the header below 1100. |

**Responsive.** Wraps to two lines below 760 **in the same fixed order** — never truncates, never re-orders, never drops a datum. Only the two sanctioned abbreviations in §3.6 are permitted.

---

## 10 · Callout

**Purpose.** A passage with a different reading mode from the prose around it — something you may skip, or must not.

**Anatomy.** 2px left marker · tinted ground · uppercase mono label · serif body one step down from prose.

**Variants — three only:**

| Kind | Marker + label | Ground |
|---|---|---|
| Note | `--c-accent` | `--c-sunken` |
| Warning | `--c-warn` | `--c-warn-bg` |
| Correction | `--c-warn` | `--c-warn-bg` |

**Typography.** Label `--t-label` in the marker colour; body serif 400 16 / 1.62 in `--c-text` at 0.30 lightness (light) / 0.88 (dark). Mobile body 15.5.

**Spacing.** 14–16px padding-y, 18–20px padding-x, 32px above and below, radius `0 4 4 0`.

**Rules.** **Not colour alone** — the label word carries the meaning and the tint is reinforcement; in greyscale the callout still reads correctly. A callout is never nested, never contains a code block, and never replaces a `h3`.

**Responsive.** Stays inside the text margin at every width (it is prose, not machine content — it does **not** go full-bleed). Body steps to 15.5 at mobile.

---

## 11 · Quote

**Purpose.** A line worth isolating. **A quote is prose, not an object.**

**Anatomy.** 2px neutral (`--c-rule-2`) left marker, 20px indent (16 at mobile), no ground, no radius.

**Typography.** Serif **italic** 400, 18–19 / 1.60, colour at 0.35 lightness (light) — one step lighter than prose. Attribution, when present, is a mono 12 line beneath with an em dash.

**Spacing.** 32px above and below.

**Don't use** for a callout (a quote has no label), and don't use a ground or a radius on it — those belong to callouts, whose reading mode is different.

---

## 15 · Table of contents

**Purpose.** Navigate a long article, and show its shape before reading.

**Anatomy.** A `CONTENTS` label, then a numbered list on a 1px hairline spine with 12–13px of left padding. `h3` entries indent a further 12px.

**Typography.** Mono 400 11.5 / 1.45; muted by default, `--c-text` for the active item.

**States.** **Active** = full-strength text **plus** a 2px accent tick on the spine. It updates on scroll with no transition and no smooth-scroll hijack. Hover: accent underline. Focus: token ring.

**Spacing.** 8–9px between items, 14px under the label.

**Responsive.**

| Width | Form |
|---|---|
| ≥1100 | Sticky list in the gutter |
| 760–1099 | Open disclosure below the lead, two columns, with a `CONTENTS — 6 SECTIONS` summary row in a hairline frame |
| <760 | **Closed** disclosure in a hairline frame; `+` when closed, `−` when open; 150px internal scroll cap above 20 sections |

**Conditional:** absent entirely below three `h2`s.

---

## 16 · Breadcrumb

**Purpose.** Locate the reader in the archive.

**Anatomy.** Slash-separated lowercase mono path; the current item at full strength.
`writing / infrastructure / 038`

**Typography.** Mono 400 11.5 (11 at mobile) muted; current item `--c-text`.

**Spacing.** 16–22px below, immediately above the title.

**Rules.** Present on article and project detail pages; **absent on top-level pages**. Shortens by dropping the article number at mobile (`writing / infrastructure`) — the number is still present in the metadata block, so law 02 holds.

---

## 17 · Pagination

**Purpose.** Sequence navigation. **Nothing on this site is "page 3 of 7".**

**Anatomy.** Two blocks: previous (left-aligned, kicker `← 037 · previous in series`) and next (right-aligned, kicker `039 · next in series →`), each with the target title beneath in serif 600 14–17 / 1.35, above a hairline.

**Variants.** Article prev/next · project "next project" (single, in the aside) · index archive row (`archive by year → 2024 (9) 2023 (6) rss ↗`) — the blog index uses an archive-by-year list instead of numbered pages.

**Responsive.** Stacks with previous above next, both full width, 48px targets, a hairline between them.

---

## 18 · Footer

**Purpose.** Machine facts and the four destinations. Nothing else.

**Anatomy.** `--c-surface` ground, one top hairline, two tracks: navigation left (name + `writing · projects · about`), machine facts right (`rss ↗ · github ↗ · pgp ↗`, then `© 2026 · built with Astro · colophon`).

**Typography.** Mono 400 11.5 / 1.9 throughout; the name in `--c-text`, everything else muted.

**Spacing.** 24px padding-y, page margins for padding-x.

**Rules.** No newsletter box. No social icon row. No sitemap columns. No "back to top".

**Responsive.** Stacks to one left-aligned column below 760; type and colour unchanged.

---

# 7. Navigation

## 7.1 The masthead (component 01)

**Purpose.** Identity and four destinations. **Not a navigation system — a masthead.**

**Anatomy.** Left: wordmark (the name, sans 600 14.5, −0.01em) + role text (mono 11 muted, `backend · infrastructure`), baseline-aligned with a 12px gap. Right: three page links + the theme control, 26px gaps.

There is **no logo and no logotype** — the wordmark is the name set in the interface font. There is no CTA in the masthead.

**Spacing.** 20px padding-y (60px fixed height), page margins for padding-x, 26px between links.

**Border and ground.** A single bottom hairline at full frame width. No background until scrolled, then `--c-surface` with the same hairline. It does **not** shrink, hide, or animate on scroll.

## 7.2 Navigation link states (component 02)

| State | Treatment |
|---|---|
| Default | `--c-nav` (0.45 lightness), no underline |
| Current page | `--c-text` at full strength **plus** a 1px accent underline, 2px below the baseline |
| Hover | Underline appears in `--c-accent-hi` over 120ms; **the text does not move** |
| Focus-visible | The token ring (2px accent, 2px offset, square) |
| Active (pressed) | `--c-accent-hi` text |
| Visited | No distinct treatment (these are site sections, not documents) |

There are no dropdowns, no mega-menus, no submenus anywhere in the system.

## 7.3 Desktop navigation (≥1100)

Wordmark + role text + `Writing` `Projects` `About` + `◐` theme control. Links at sans 13.5, 26px gaps. Height 60px.

## 7.4 Tablet navigation (760–1099)

**The role text drops** (it is the least load-bearing datum in the masthead and the wordmark alone still identifies the publication). Padding-y 18, margins 32, link gaps 22, links 13px, wordmark 14. The three links and the theme control remain inline.

## 7.5 Mobile navigation (<760)

The links collapse to a single mono `menu` control in a hairline frame (7/9 padding, 44px target). Wordmark 13.5, padding 14/20.

**Open state — an in-flow disclosure, not a drawer.**

- The panel **pushes the page down**. Nothing overlays the article.
- No scroll lock, no focus trap, no close-on-outside-click.
- The control label swaps `menu` → `close`, and its border swaps to `--c-accent`.
- Rows: 48px tall, the destination in sans 16 on the left, **a count in mono 11 muted on the right** (`Writing 38`, `Projects 6`, `About —`), hairline between rows.
- The current page keeps its accent underline in the panel.
- A final row carries `rss ↗ · github ↗ · pgp ↗` on the left and the `◐ theme` control on the right — **the theme control moves into the panel** at <760 rather than competing with the menu control in the masthead.

**Why counts.** The rows carry the same instrumentation the desktop index uses, which is what makes the panel read as *this* publication rather than a generic mobile menu.

## 7.6 Sticky and fixed behaviour

The masthead is sticky. Its only scroll behaviour is acquiring the `--c-surface` ground. Below 1100 a 2px reading-progress bar sits immediately under it on article pages (accent fill on a `--c-rule` track) — the only additional persistent chrome at any width.

---

# 8. Buttons and links

## 8.1 Buttons (component 04)

Exactly **two variants**, and no more may be added.

| | Primary (solid ink) | Secondary (hairline) |
|---|---|---|
| Ground | `--c-text` | none |
| Text | `--c-bg` | `--c-text` |
| Border | none | 1px `--c-rule-2` |
| Type | mono **500** 12.5 / 1 | mono **400** 12.5 / 1 |
| Padding | 10–11 / 14–15 | 10–11 / 14–15 |
| Radius | 4 | 4 |
| Height | ~34 desktop; **44 minimum on touch** | same |
| Hover | ground → `--c-accent-hi`… **no**: ground lightens one step; label unchanged | border → `--c-text`, ground → `--c-surface` |
| Focus | token ring | token ring |
| Active | ground one step darker | ground `--c-sunken` |
| Disabled | 55% opacity, no pointer, contrast still ≥4.5:1 | same |

**Rules.** One solid button per page maximum. **No accent-filled button exists anywhere in the system.** Button labels are lowercase mono with a trailing glyph (`read the article →`, `source ↗`) — never uppercase, never sentence-case sans. Buttons appear only at the end of a case study and in the article apparatus; they are never used for navigation that a text link could carry.

**Responsive.** Buttons sit in a 10px-gap flex row at all widths; at <760 a primary action may go full width. Height floor 44px on touch.

## 8.2 Text links (component 03)

**Inline prose link.** Inherits `--c-text`, takes a **permanent** 1px `--c-accent` underline at ~0.15em offset. Hover: text and underline both move to `--c-accent-hi` over 120ms. Focus: token ring. Active: `--c-accent-hi`. Visited: no change.

- **Never underline-on-hover** — it hides the affordance.
- The accent never colours the word itself.
- Where a link may break mid-URL, the underline is drawn as an offset rule rather than a text decoration, so both fragments keep their rule and the line height never changes.

**External link.** Same treatment plus a trailing `↗` after a hair space. In mono metadata contexts the whole token is muted and the arrow is the only affordance marker.

**Internal navigation link (mono).** `case study →`, `all writing →`, `archive by year →`: mono 12, `--c-text`, accent underline, 3px underline offset, trailing `→`.

**Title link.** An index-row or project title in serif 600: accent underline on hover, and permanently underlined when it is the featured entry (which is always a link).

**Nav link.** See §7.2.

## 8.3 Link inventory summary

| Kind | Family / size | Colour | Underline | Trailing glyph |
|---|---|---|---|---|
| Inline prose | serif, inherits | `--c-text` | permanent accent | — |
| External, in prose | serif, inherits | `--c-text` | permanent accent | `↗` |
| Mono navigation | mono 12 | `--c-text` | permanent accent | `→` |
| External, in metadata | mono 11.5–12 | `--c-muted` | none | `↗` |
| Title | serif 600 | `--c-text` | on hover (permanent if featured) | — |
| Nav | sans 13.5 | `--c-nav` | current + hover only | — |
| Tag | mono 12 | `--c-accent` | on hover | — |
| Footnote reference | mono 11 superscript | `--c-accent` | none | — |

---

# 9. Cards and content surfaces

## 9.1 There is no card system

This is the single most consequential structural decision in the design, so it is stated as a rule rather than an omission: **lists of peers are rows separated by hairlines, not grids of cards.** A list of six projects is not six objects — it is one list with five rules in it.

## 9.2 The box-or-rule test

Apply this before creating any bounded container.

**A box is justified when:**
- the content has a **different reading mode** from the prose around it (code, terminal output, a callout you may skip), **or**
- it is **interactive as a whole unit** (a button).

**A rule is correct when:**
- items are **peers in a sequence** — index rows, project entries, table rows, footnotes, experience entries, references, section bands. Peers get a shared rule and shared alignment, never individual containers.

## 9.3 The bounded surfaces that do exist

| Surface | Ground | Border | Radius | Purpose |
|---|---|---|---|---|
| Code block | `--c-code-bg` | 1px `--c-rule` (light only) | 4 (0 at <760) | Different reading mode |
| Terminal block | `--c-term-bg` | 1px `--c-rule` (light only) | 4 (0 at <760) | Different reading mode |
| Callout | `--c-sunken` / `--c-warn-bg` | 2px left marker only | `0 4 4 0` | Skippable passage |
| Button | `--c-text` / none | none / 1px | 4 | Interactive unit |
| Disclosure frame (TOC, menu summary) | none | 1px `--c-rule` | 4 | Interactive unit |
| Framed control (copy, theme) | none | 1px | 3 | Interactive unit |
| Figure | `--c-sunken` (placeholder hatch) | 1px `--c-rule` | **0** | Frames media, is not a card |
| Footer band | `--c-surface` | 1px top | 0 | A band, not a card |
| Row hover | `--c-surface` | — | 0 | A state, not a surface |

## 9.4 Content that must never be placed in a card

- An article, project, experience or reference entry in a list.
- A page section or band.
- Prose of any length.
- A heading, a metadata row, a tag set, a status.
- A figure or a table (both are framed by rules, not boxed).
- Anything whose only reason for a box is "to group it visually" — that is what a hairline and shared alignment are for.

## 9.5 The featured entry (the closest thing to a card)

Even the featured article is not a card: it is a band with a `minmax(0,680px) / 1fr` split — metadata row, serif 27–28px title with a permanent accent underline, lead paragraph, optional series line, paired with a hairline-framed lead figure (170–200px tall). No ground, no border around the whole, no radius. It is distinguished from the rows beneath it by **size and a figure**, not by a container.

---

# 10. Article system

The article page is the reference implementation of the entire design. Every other page is a reduction of it.

## 10.1 Article structure

1. **Masthead**
2. **Header band** — gutter (article number, section, series) · breadcrumb · `h1` · lead · metadata row above a hairline. Header content may run to 760px, wider than the measure.
3. **Body** — the three-track grid: TOC gutter, 680px measure, aside (share, progress).
4. **Apparatus** — references, author block, prev/next, related.
5. **Footer band.**

## 10.2 Header

| Element | Specification |
|---|---|
| Breadcrumb | mono 11.5 muted, slash-separated, current segment `--c-text`, 22px below |
| `h1` | `--t-display` — serif 400 42 / 1.20 / −0.015em, pretty wrapping, 20px below |
| Lead (dek) | `--t-lead` — serif 400 20 / 1.62, `--c-text-2`, capped at **62ch**, one paragraph only, 28px below |
| Metadata row | hairline above, 16px gap, mono 12, fixed order, 24px gaps |
| Gutter | article number (accent) / section name / series (`--c-faint`), mono 11 / 1.6 |
| Band padding | 56 top, 40 bottom, closed by a hairline |

## 10.3 Body typography and spacing

| Relationship | Value |
|---|---|
| Body text | serif 400 18.5 / 1.72, `--c-text`, pretty wrapping |
| Paragraph → paragraph | 24 |
| Paragraph → `h2` | 56 |
| `h2` → paragraph | 16 |
| `h3` → paragraph | 12 |
| Prose → block element (code, figure, table, callout, quote, list) | 32 |
| Block → prose | 32 (via the caption's own 32px bottom margin) |
| List item → list item | 12 |
| List indent | 26px, 4px item padding-left |
| Body → apparatus | 96 |

## 10.4 Lists

Ordered and unordered lists use the browser's markers, serif at body size, 26px indent, 12px between items, 32px above and below. No custom bullets, no icon bullets, no numbered circles. An ordered list is used when the order is the content (a four-step migration procedure); otherwise unordered.

## 10.5 Footnotes and references

- **Reference marker:** a mono 11 superscript numeral in `--c-accent`, immediately after the punctuation.
- **References block:** a `REFERENCES` label above a hairline, then rows of `number + text`, 12px gap, text sans 15 / 1.6 `--c-text-2`, accent mono numeral. External references carry `↗`. Repo paths are set in mono 13 with a `--c-rule-2` underline.
- Placed 56px after the body, before the author block.

## 10.6 Author block

A hairline above and below, `88px` grid track for a square portrait, 20px gap, then name (sans 600 14.5), a bio paragraph (sans 13.5 / 1.6 `--c-text-2`, max 64ch), and a mono 11.5 contact line with 16px gaps. Appears on articles only, never on the about page (which *is* the author).

## 10.7 Prev/next and related

- **Prev/next:** a two-column 32px-gap grid; kicker mono 10.5 muted (`← 037 · previous in series`), title serif 600 17 / 1.35. Next side right-aligned.
- **Related:** a `RELATED` label above a hairline, then a two-column 26px-gap grid of title (serif 600 16.5 / 1.35) + one mono 11.5 line (`036 · 2026-03-19 · 11 min`).

## 10.8 The aside (≥1100)

A sticky 200px column, mono 11.5 / 1.9 muted: `share ↗`, `reply by email ↗`, `edit on github ↗`, then above a hairline `read 38%` with a 2px progress bar (accent fill on a `--c-rule` track).

## 10.9 Article behaviour on mobile

This is the highest-priority responsive case in the system.

| Element | At <760 |
|---|---|
| Header | Breadcrumb shortens to two segments; `h1` 28px (26 above 90 chars); lead 17 / 1.60; metadata wraps to **two lines in fixed order** |
| TOC | Closed disclosure in a hairline frame, `+` / `−`, 150px scroll cap above 20 sections |
| Section label | A compressed uppercase mono running head (two tokens) with a hairline under it, above its section |
| Body | 17 / 1.70 → 38–40 characters per line |
| `h2` | 21 / 1.30, 36 above / 14 below |
| Code, terminal, figures, tables | **Full-bleed** (−20px each side), bounded by two hairlines, no radius |
| Captions | Stay inside the 20px text margin |
| Callouts and quotes | Stay inside the text margin (they are prose) |
| Progress | 2px bar under the masthead |
| Share | Moves to the end of the article |
| Apparatus | Prev/next stacks, related stacks, author block stacks with the portrait above |
| Consecutive blocks | Keep **24–26px of page ground** and their caption lines between them, so a sequence never fuses into one dark slab |

## 10.10 The eight difficult article cases, and their rules

Derived directly from the twelve stress tests at 390.

| Case | Rule |
|---|---|
| **Long title** (148 chars) | Steps 28 → 26px above 90 characters; pretty wrapping plus automatic hyphenation; wraps to as many lines as needed. Never truncated, never clamped. |
| **Long URL in prose** | Mono spans in flow break at any character; the underline is drawn as an offset rule so both fragments keep it and the line height never changes. |
| **Long code line** (210 chars) | The block scrolls horizontally; the page never does. No wrapping — a wrapped shell command is a broken shell command. |
| **Wide table** (7 columns) | Full-bleed contained scroll region, first column sticky, edge fade + `scroll →` marker. Never reflowed to cards. |
| **Very short article** (90 words) | No TOC (under three `h2`s), no author block, no related list. Article apparatus is conditional on there being an article to support. |
| **Very long article** (34 sections, 9,400 words) | TOC gains its 150px scroll cap; above 8,000 words the article splits into numbered parts with series navigation. |
| **Large image** (3840 × 2160) | Served at 780w in a modern format, lazy; capped at 65vh; tap opens a full-size view. |
| **No images at all** | Nothing is inserted to compensate. Rhythm comes from headings, a quote and the rules — an image-free article is normal, not a gap to fill. |
| **Four code blocks in a row** | 24px of page ground and a caption line between each; terminal grounds alternate with code grounds so the reader can see where the machine answers. |
| **Long caption** | No length limit; stays mono 11–11.5. Captions carry the argument. |

## 10.11 Horizontal scrolling policy

**The page never scrolls horizontally at any width.** Exactly three element types own a contained horizontal scroll: code blocks, terminal blocks, and tables. Each is focusable and arrow-scrollable, each shows two affordances (an edge fade and a mono direction marker), and each keeps its caption outside the scrolling region.

---

# 11. Project system

## 11.1 Projects index

**Structure.** Masthead → header band (gutter `Projects / 6 · 2 active`, `h1` `--t-title`, lead capped at 62ch) → an `INDEX` band containing project items → footer.

**Item.** See component 07. Three tracks (`44 / 1fr / 210`), 26px padding-y, `--c-rule-2` opening the list, `--c-rule` between items.

**Content order inside an item.** Number → title → what it is (one paragraph) → optionally `**Why.**` (one sentence, the motivation) → stack line. Instruments, right-aligned: status → period → primary link → source-or-absence.

**Deliberate consistency:** every project states *what it is, why it exists, and what it is built from*, in that order. An absent source is stated explicitly (`client work · no source`) rather than omitted, in `--c-faint`.

## 11.2 Project detail (case study)

**Uses the article grid exactly** — that is the point. The differences from an article are three:

1. `h1` at 40 rather than 42 (project titles are longer on average).
2. A **status band** replaces the metadata row: a hairline above, then a four-column grid of `LABEL` (mono 10.5 uppercase `--c-faint`) over value (mono 11.5 / 1.8 muted): **Status · Period · Stack · Links**.
3. The gutter carries `Project 01` + the status word in `--c-ok`, and the aside's third line is `next project` with the next project's title in serif 600 14.

**Canonical section sequence** (numbered `01`–`06`, mono accent, same section-heading component):
`Problem & motivation → Architecture → Implementation → Technical decisions → Results & lessons → (Lessons)`

**Section content conventions.**

| Section | Contains |
|---|---|
| Problem & motivation | Prose. States the cost of the status quo in concrete units ("a weekend" → "twelve minutes"). |
| Architecture | Prose + one architecture diagram (230px, hairline framed, `Fig. n` caption). |
| Implementation | Prose + screenshots (200px, on `--c-sunken` with a hairline — never a rounded browser mock). |
| Technical decisions | A three-column table: **Decision · Alternative · Why**. Decision and alternative in mono 13; the "why" column in sans 13.5 `--c-text-2`. Caption states what the table omits. |
| Results & lessons | Prose with measured numbers, then the two buttons (`read the article →` solid, `source ↗` hairline). |

**Responsive.** Identical to the article page (§10.9). The status band collapses from four columns to two at tablet and to a stacked two-line mono block at mobile; the gutter's `Project 01 / active` relocates to the first line of that block.

---

# 12. Forms and inputs

**The design contains no form system.** There is no search field, no newsletter signup, no comment form, no contact form — correspondence is an email address set in serif 22 with an accent underline, and a `mail@…` mono line in the footer apparatus. This is a deliberate consequence of principle 05 and the footer anti-patterns.

## 12.1 The interactive controls that do exist

| Control | Anatomy | States |
|---|---|---|
| **Copy** (code chrome) | Hairline frame (`oklch(0.34 0.010 75)`), radius 3, mono 11, muted label `copy`, 44px target | Hover: border and label lighten. Active/confirmed: label swaps to `copied` for 1.2s and the border takes the accent — a **text change**, not a toast, not an animation. Announced politely to assistive technology. |
| **Theme** | Hairline frame, radius 3, `◐` glyph, mono 11 | Hover: border → `--c-text`. Focus: token ring. Moves into the menu panel below 760. |
| **Disclosure** (TOC, mobile menu) | Hairline frame, radius 4, mono uppercase summary + `+` / `−` | Open/close animates height over 160ms. Open pushes content; never overlays. |
| **Menu row** | 48px row, sans 16 label + mono 11 count, hairline below | Hover: ground → `--c-surface`. Current: accent underline on the label. |
| **Scroll region** (code, table) | — | Focusable, arrow-scrollable, labelled by its caption. |

## 12.2 If a form is ever required

Derive it, do not invent it. The rules that already exist and would govern it:

- Label: `--t-label` (mono 10.5 uppercase) above the field.
- Field: 1px `--c-rule` border, square corners, `--c-bg` ground, sans 15 text, 10–12px padding-y, 44px minimum height.
- Focus: the token ring — nothing else changes.
- Error: `--c-warn` text **plus a word**, never a red border alone.
- Success: `--c-ok` **plus a word**.
- Disabled: 55% opacity, contrast maintained above 4.5:1.
- Submit: the primary button (§8.1), one per form.
- Mobile: full-width fields, 16px minimum text size to prevent zoom, 20px page margin.

---

# 13. Code and technical content

Code is a first-class citizen of the page, not an embed. The chrome is set in the publication's own type so the block reads as typeset here rather than pasted in.

## 13.1 Why code stays dark in both themes

A light code block on a light page needs a border to exist; a dark one is self-evidently a different kind of object. Keeping the ground constant also keeps the reader's mental model of "this is the machine talking" stable across a theme switch. Only the block's **border** changes between themes: a visible hairline in light, none in dark.

## 13.2 Code block (component 19)

**Anatomy.**
1. **Filename bar** — `--c-code-bg` lightened to `oklch(0.235 0.010 75)`, bottom hairline `oklch(0.30 0.010 75)`, 9/14 padding. Left: the **full repo-relative path** (mono 11.5, `oklch(0.70 0.012 75)`), not just the basename. Right: the language token (mono 10.5 muted) then the copy control.
2. **Line-number gutter** (conditional) — a separate track, right-aligned, mono at code size, `oklch(0.45 0.010 75)`, non-selectable, 16px left padding. **Appears only above twelve lines.**
3. **Code area** — mono 13.5 / 1.75, foreground `oklch(0.86 0.008 75)`, 16px padding-y / 18px padding-x, horizontal scroll.

**Typography.** `--t-code`: mono 400 13.5 / 1.75 (12.5 / 1.75 at <760).

**Syntax highlighting.** Five roles only — comment, keyword, string, literal, identifier — all held at 0.78–0.82 lightness so no token shouts. Punctuation and operators stay at foreground colour. Values in §2.3.

**Line highlighting.** An accent-tinted row (16–18% alpha) **plus** a 2px accent inset bar on the left edge — position *and* tint, so it survives greyscale and colour-blind vision. The tint spans the full scroll width and the bar is inset on the line rather than the container, so it remains visible at any scroll offset.

**Diff.** Leading `+` / `−` glyphs are **mandatory**; the tint is secondary. The two diff hues appear nowhere else in the system.

**Overflow.** Horizontal scroll inside the block — never wrapped, never shrunk. The scroll container is focusable and keyboard-scrollable, and a 24–26px ground-coloured fade marks the right edge while content continues.

**Copy control.** Hairline button, mono 11, radius 3, 44px target, always present. On activation the label swaps to `copied` for 1.2 seconds and the border takes the accent. A text change — not a toast, not an animation. Politely announced.

**Caption.** `Listing n — …` in mono 11.5 muted below the block, identical treatment to a figure caption, so code and diagrams are referenceable from prose in the same voice.

## 13.3 Terminal block (component 20)

A distinct component, not a variant.

| Property | Value |
|---|---|
| Ground | `--c-term-bg` `oklch(0.155 0.008 75)` — one step below code |
| Chrome | An uppercase mono host label (`TERMINAL — PI-02`), 10.5–11px, +0.1em, muted, above a `oklch(0.28 0.008 75)` hairline. No filename, no language token. |
| Prompt | `$` in `oklch(0.72 0.12 45)` (the dark-theme accent, at both themes) |
| Foreground | `oklch(0.82 0.008 75)` |
| Success token | `oklch(0.75 0.105 155)` |
| Line numbers | **None** |
| Copy control | **None** — output is not reusable |
| Type | mono 13 / 1.8 (12.5 at <760) |

**Identical at every width**, because output is not reusable at any size.

## 13.4 Inline code

Mono at **0.86em of the parent** (so it matches whether it sits in prose, a caption or a heading), on `--c-sunken` with a 1px `--c-rule` hairline, 1px/5px padding, 3px radius. Sized relatively — never a fixed pixel size.

## 13.5 Code at <760

| Rule | Detail |
|---|---|
| **Full-bleed, two hairlines** | The radius and side borders are dropped; the block spans the viewport bounded top and bottom. This buys ~40px of code width — two or three tokens. |
| **13.5 → 12.5px** | The single typographic concession on mobile, and the floor: below 12.5 the slashed zero stops being legible. Never wrap. |
| **Numbers pin, code scrolls** | The gutter is a separate track *outside* the scroll container with a hairline on its right, so line 4 is still line 4 sixty columns in. Numbers still appear only above twelve lines. |
| **Highlights survive scrolling** | Tint spans the full scroll width; the 2px bar is inset on the line, not the container. |
| **Chrome stays put** | The filename truncates with an ellipsis (the only truncation permitted besides digests); the language token and copy control never shrink and never wrap. Copy targets 44px. |
| **Terminal unchanged** | Same ground, label, prompt, no numbers, no copy. |
| **Sequences breathe** | Consecutive blocks keep 24px of page ground and their caption lines between them. |

---

# 14. Images, diagrams and media

## 14.1 Figure (component 12)

**Anatomy.** A hairline-bordered, **square-cornered** frame containing the media, with a caption beneath.

- No shadow, no radius, no rounded screenshot frame, no device mock, no browser chrome.
- **Screenshots** sit on `--c-sunken` with a 1px `--c-rule` border, so light UI screenshots do not bleed into the page.
- **Placeholders** (in the design itself) are a 135° hairline hatch — `oklch(0.955 0.008 75)` / `oklch(0.975 0.006 75)` at 7px — with a mono 11–11.5 centred label stating what belongs there and at what size.
- In dark mode, photographs and diagrams are dimmed to ~92% brightness; **UI screenshots are not**, because dimming them misrepresents the software.

**Sizes by role.** Homepage lead figure 170px · index lead figure 200px · case-study screenshot 200px · case-study architecture diagram 230px · article diagram 250px · about portrait 200 × 220 · author portrait 88 × 88. Height cap **65vh** at every width.

**Spacing.** 32px above; 10px to the caption; 32px from the caption to the following prose.

## 14.2 Caption (component 13)

Mono 11.5 (11 at mobile) `--c-muted`, 1.6 line height, 10px below the figure, numbered `Fig. n —` (`Listing n —` for code, `Table n —` for tables).

**Captions state what to notice, not what the image obviously is.** They have no length limit — a caption may run four lines if it carries the argument. Alt text carries the same information for screen readers and is never empty on a content image; diagrams additionally have a prose equivalent in the surrounding text, because a dependency graph cannot be summarised in an alt attribute.

## 14.3 Constrained vs extended media

| Width | Behaviour |
|---|---|
| ≥1100 | Inside the 680px measure, hairline framed, 65vh cap |
| 760–1099 | Same, inside the measure |
| <760 | **Full-bleed** (−20px each side), bounded by two hairlines; the **caption keeps the 20px text margin**; wide diagrams tap to a full-size view |

Media never extends beyond the measure at desktop. There is no "wide figure" or "full-bleed figure" variant at desktop widths — the measure is the frame, and the gutter and aside are not available to media.

## 14.4 Media performance rules

Large sources are served at the delivered width (e.g. a 3840 × 2160 screenshot served at 780w) in a modern format, lazily, with a tap-to-full-size affordance on narrow screens.

## 14.5 Galleries

There is no gallery component. Multiple images are consecutive figures, each with its own caption, separated by 32px. If a sequence of images needs comparison rather than sequence, that is a table.

---

# 15. Tables

## 15.1 Table (component 14)

**Anatomy.** A `--c-rule-2` top rule → an uppercase mono head row → body rows separated by `--c-rule-in` hairlines → no bottom rule on the last row.

| Property | Value |
|---|---|
| Head | `--t-label` (mono 500 10.5 uppercase +0.1em `--c-muted`), 9–10px padding-y, above a `--c-rule` hairline |
| Cells | **mono 13** (12.5 at mobile) — so digits align |
| Prose cells | Where a column carries an explanation rather than data, that cell only is sans 13.5 `--c-text-2` |
| Row padding | 9–11px vertical |
| Column gap | 16–20px |
| Vertical rules | **None, ever** |
| Zebra striping | **None** |
| Alignment | Identifying column left; numeric and date columns **right** |
| Semantic colour | A bad number takes `--c-warn`; an ok state takes `--c-ok`; both alongside their value, never replacing it |
| Caption | `Table n —` mono 11.5 muted below, 32px to the following prose |

**Hover.** Table rows do **not** have a hover state (they are data, not targets). Only *interactive* rows — index and project rows — take the `--c-surface` hover.

## 15.2 Tables at <760 — one treatment only

Tables do **not** shrink and do **not** reflow.

| Rule | Detail |
|---|---|
| **Full-bleed, contained** | The scroll region spans the viewport (−20px each side), bounded by two hairlines. Only that element scrolls; the page never scrolls sideways. |
| **First column sticks** | The identifying column pins to the left edge on the page ground, so a value is never orphaned from its row label. |
| **Two affordances** | A 24–28px ground-coloured fade on the overflowing edge, and a mono `scroll →` marker on the caption line that flips to `← scroll` at the end. Both disappear when everything fits. |
| **No reflow to cards** | Stacked key/value cards destroy column comparison, which is the only reason a technical table exists. |
| **Cell type floor** | mono 12.5, never smaller. |
| **Caption anchors it** | The caption sits inside the 20px text margin, *outside* the scroll region, so the table stays visibly attached to the article while its content moves. |
| **Keyboard** | The region is focusable and arrow-scrollable, exposed as a labelled region with the caption as its accessible name. |

**At tablet:** in the measure normally; becomes a scroll region early if it has more than five columns.

## 15.3 The one permitted truncation

Opaque machine identifiers (content digests, hashes) may be **middle-truncated** in a cell — `sha256:9f2b1c7ae4…d0c81a` — with the full value available on hover and on copy. This is the only truncation permitted anywhere in the system apart from a code block's filename label. Human-readable content is never truncated.

---

# 16. States and interaction

## 16.1 The global state system

Interaction feedback is deliberately narrow: **colour and ground change; nothing moves.** No element translates, scales, lifts, rotates or gains a shadow on any state.

| State | Universal treatment |
|---|---|
| **Default** | As specified per component |
| **Hover** | The smallest possible change: an underline appears, a text colour steps to `--c-accent-hi`, or a row ground steps to `--c-surface`. 120ms, one curve. Text never moves. |
| **Focus-visible** | The single focus token: 2px `--c-accent`, 2px offset, square. Identical everywhere, both themes. Never removed without replacement. |
| **Active (pressed)** | One step further in the hover direction: `--c-accent-hi` text, or a ground one step darker. Instant. |
| **Current / selected** | Full-strength text **plus** an accent marker (nav underline, TOC spine tick, index filter underline). Never a filled background. |
| **Visited** | No distinct treatment anywhere. |
| **Disabled** | 55% opacity, no pointer affordance, contrast maintained above 4.5:1. |
| **Loading** | Does not exist. The site is static; navigation is a document load. No skeletons, no spinners, no shimmer. |
| **Success** | A **text change** (`copy` → `copied`, 1.2s) or `--c-ok` **plus a word**. Never a toast. |
| **Error / warning** | `--c-warn` **plus a word** (a callout label, a table value). No banners. |

## 16.2 Hover state inventory

| Element | Hover |
|---|---|
| Prose link | Text and underline → `--c-accent-hi` |
| Nav link | Underline appears in `--c-accent-hi` |
| Index row | Ground → `--c-surface`, title gains its accent underline |
| Project title | Accent underline appears |
| Tag | Accent underline appears |
| Primary button | Ground steps one level |
| Secondary button | Border → `--c-text`, ground → `--c-surface` |
| Copy control | Border and label lighten |
| TOC item | Accent underline appears |
| Menu row | Ground → `--c-surface` |
| Table data row | **No hover** |
| Figure, caption, metadata, status | **No hover** |

## 16.3 Touch

On touch, hover states are not relied upon: every interactive element is identifiable at rest (permanent underlines, framed controls, `→`/`↗` glyphs). Targets are 44px minimum; index and menu rows are 48px.

---

# 17. Motion

## 17.1 What animates — exhaustive

- Link and nav colour and underline.
- Row ground on hover.
- Button border and ground.
- Disclosure open/close (height, 160ms).
- Theme switch (colour only).
- Copy-button label swap.

## 17.2 What never animates — exhaustive

Page loads · scroll reveals · headings · images · the TOC active state · numbers counting up · anything on first paint. No parallax, no sticky-header shrink, no smooth-scroll override, no page transitions, no carousels, no autoplay, no auto-advance, no scroll-jacking.

## 17.3 Duration and easing

| Case | Duration |
|---|---|
| State change on an element the pointer is already on | **120ms** |
| Anything that changes layout | **160ms** |
| Ceiling | **200ms** — nothing exceeds it |

One easing curve for everything: `cubic-bezier(.2, 0, 0, 1)`. No bounce, no spring, no per-component curve.

## 17.4 Page transitions

**None.** Navigation is a full document load, which on a static site is faster than any crossfade and leaves scroll position and the back button behaving exactly as the reader expects. The only continuity device is that the masthead and the gutter occupy identical positions on every page, so they appear not to move.

## 17.5 Reduced motion

Honoured globally: when a reduced-motion preference is set, all transition and animation durations collapse to effectively zero and any smooth scrolling reverts to instant. Nothing in the design depends on motion to be understood, so this removes nothing.

---

# 18. Accessibility

## 18.1 Contrast

| Role | Light | Dark |
|---|---|---|
| Body text | 13.4:1 | ≈13:1 |
| Secondary text | 8.1:1 | 7.9:1 |
| Muted / metadata | 4.6:1 at 12px minimum | 5.2:1 |
| Accent | 5.1:1 | ≥5:1 |
| Accent hover | 7.2:1 | — |

All AA or better, most AAA. **Nothing on the site is below 4.5:1**, including placeholder and disabled states. Metadata brightens in dark mode specifically because small mono at low contrast is the first thing to fail on a dark screen.

## 18.2 Focus and keyboard

- **One ring, everywhere:** 2px accent, 2px offset, square, clearing the element in both themes. Nothing removes an outline without replacing it.
- Focus order follows the document order, which follows the reading order.
- **Skip-to-content** is the first focusable element on every page.
- The TOC is a real list of links.
- Code blocks and table regions that scroll are focusable and arrow-scrollable — the part usually missed.
- The mobile menu is a native disclosure: no focus trap to get wrong, no scroll lock, no close-on-outside-click.

## 18.3 Semantic structure

- **One `h1` per page** (the title). Body sections are `h2`, subsections `h3`, never deeper. Levels are never skipped and never chosen for size — size comes from the token, structure from the tag.
- Landmark structure: header, nav, main, article, aside, footer.
- Figures use a figure/caption pairing; every date carries a machine-readable value; tables use real table semantics with scoped headers.
- The metadata row is a description list with visually hidden terms, so `14 min` is announced as "reading time, 14 minutes".
- Scroll regions are exposed as labelled regions, with the caption as the accessible name.

## 18.4 Colour independence

Never colour alone, in every instance:

| Signal | Redundant carrier |
|---|---|
| Project status | The word (`active`) **and** the dot shape (filled/hollow) |
| Diff | Leading `+` / `−` glyphs |
| Callout kind | The uppercase label word |
| Highlighted code line | A 2px position marker on the left edge |
| Links | A permanent underline |
| Current nav item | Full-strength text plus an underline |
| Warning value in a table | Alongside the value, which remains readable |

## 18.5 Targets, typography, motion

- **44px minimum** on every interactive element on touch; index and menu rows are **48px**.
- **Type floors:** body 17px, metadata 11.5px, code 12.5px, label 10.5px.
- **Line length:** 68 characters at desktop, 38–40 at mobile — both inside the comfortable range.
- Reduced motion honoured globally; nothing auto-plays, auto-advances or steals scroll.

## 18.6 Images

Alt text describes what the reader is meant to take from the image. Diagrams additionally have a prose equivalent in the surrounding text. **Decorative images do not exist in this design**, so an empty alt attribute should never appear.

---

# 19. Page-level composition

Component specifications are not repeated here; each page is described as a composition of the primitives in §5 and §6.

## 19.1 Homepage

**Purpose.** A front page, not a landing page: four lines of introduction, then the work. **No hero, no pitch, no call to action.**

**Bands, in order:**

| Band | Gutter label | Content |
|---|---|---|
| Index | `Index / 2026-08` | An opening statement (serif 400 **24** / 1.50 / −0.008em) then one paragraph of context (serif 17.5 `--c-text-2`), paired with a mono "Now" panel on a left hairline: a current-work sentence in sans 13.5, then three live facts (`homelab uptime 214 d`, `11 services ok`, `last deploy 2026-08-19`) |
| Featured | `Featured / 038` | Featured entry (§9.5) + lead figure 170px |
| Latest writing | `Latest writing / 38 total` | Four compact index rows + an `all writing →` / `rss ↗` line |
| Selected work | `Selected work / 3 of 6` | Three selected-work project items + `all projects (6) →` |
| Interests | `Interests / —` | One middot-joined line, sans 15 / **2.0**, `--c-text-2` |
| About & contact | `About & contact / —` | One paragraph (max 600px) + the email address in serif 22 with an accent underline, and a mono link line |

**Container behaviour.** Every band is layout B (`148 / 1fr`, 44px gap). Band padding 44–64px; the first band uses the reserved 128px top step at page level. Each band is closed by a full-frame hairline.

**Responsive.** Band order is **identical at every width** — the introduction stays four lines and there is no mobile hero. Bands go to 32px padding at mobile; the "Now" panel moves below the intro paragraph and drops its left hairline for a top one; the two lists become stacked rows.

## 19.2 Blog index (Writing)

**Purpose.** A publication index: one featured entry, then numbered rows grouped by year. **An archive, not pagination.**

**Bands:**

1. **Header** — gutter `Writing / 38 articles`; `h1` `--t-title`; lead 19px capped at 62ch; a filter row of counted tags (`all 38` current, then `#infrastructure 11`, `#security 9`, …, `rss ↗`) in mono 12.
2. **Featured** — gutter `FEATURED` label; featured entry + 200px lead figure.
3. **Year groups** — one band per year; gutter carries the year in **serif 22** with the count beneath in `--c-faint`; body is a `--c-rule-2`-opened list of five-track index rows.
4. **Archive row** — `archive by year → 2024 (9) 2023 (6) rss ↗` above a hairline, aligned to the content column.

**Responsive.** Five tracks → three (tag and reading time join line 2) → stacked title with one mono line and the dek dropped. Year headers move from the gutter to a sticky row spanning the list.

## 19.3 Article page

See §10 in full. Layout A. The reference implementation of the system.

## 19.4 Projects index

See §11.1. Layout B with a `44 / 1fr / 210` item grid.

## 19.5 Project detail

See §11.2. Layout A, exactly the article grid, plus a status band.

## 19.6 About

**Purpose.** A colophon-style record, not a professional summary.

**Bands:**

1. **Header** — gutter `About / upd 2026-08-02`; `h1` is the person's name at `--t-title`; two body-size serif paragraphs (18.5 / 1.72, the second in `--c-text-2`) beside a 200 × 220 portrait.
2. **Working on** — one middot-joined line, sans 15 / 2.0.
3. **Experience** — gutter `Experience / selected`; **the same row system as the blog index**: a `150px` mono period track (`2024 — now`) beside a role title (sans 600 15) and a description (sans 13.5 / 1.6, max 66ch). Three rows, hairline-separated.
4. **Elsewhere** — a four-column grid of `LABEL` over value in mono 12 / 1.9: Email · Code · Social · Keys.

**No author block** (this page *is* the author), no CV download, no skill bars, no timeline graphic.

**Responsive.** Portrait drops below the intro paragraphs; the experience rows stack period-above-role; the Elsewhere grid goes four → two → one column.

## 19.7 404

The masthead plus a route list. Gutter carries `404 / not found` with the number in accent. `h1` at `--t-title` (`This page does not exist`), one explanatory paragraph including the permalink pattern in inline code, then a hairline-opened list of routes in mono 12 / 2.1 — each route in `--c-text` with an accent underline, followed by an em-dashed description (`/writing — 38 articles, newest first`).

Uses the **128px** band padding step, top and bottom — the only other place besides the homepage where it appears.

## 19.8 Contact

**There is no contact page.** Contact is an email address on the homepage and about page, plus a mono link line. Documented here so it is not accidentally invented.

## 19.9 What makes the seven pages one publication

Four things are identical on every page, and they are the things a reader notices without looking:

1. **The masthead.**
2. **The 148px metadata gutter.**
3. **The 680px measure.**
4. **The mono/serif split.**

Change the content and the page changes; the frame does not move. That is the entire coherence mechanism — no shared brand element, no repeated graphic, no logo.

Three supporting invariants:

- **Numbering is site-wide.** Articles 001–038, projects 01–06, article sections 01–06. A number is always mono, always accent, always a link target.
- **Every list is the same list.** Writing, projects, experience and references are hairline-separated rows on the same tracks — learn one, read all four.
- **The gutter is the spine.** It carries section labels on the homepage, year headers on the index, status on a project, and the contents on an article — one column, one grammar, four jobs.
- **Nothing is page-specific.** No component appears on only one page. If a future page needs one, it belongs in the system first.

---

# 20. Responsive examples

These are worked examples of the rules above, not separate designs. Every change below is a consequence of §3.2's four stacking laws.

## 20.1 Masthead

**Desktop (1320).** Wordmark 14.5 + role text mono 11 + three links at 13.5 with 26px gaps + theme control. 60px tall, bottom hairline, 56px margins.

**Tablet (900).** Role text removed; margins 32, padding-y 18, link gaps 22, links 13, wordmark 14. Everything else identical. *Rule applied: law 02 — the role text is the one datum whose information is fully carried by the wordmark beside it.*

**Mobile (390).** Wordmark 13.5 + a framed mono `menu` control. Padding 14/20. Open: an in-flow disclosure pushing content down, 48px rows carrying destination + count, theme control inside the panel. *Rules applied: law 04 (rules full-bleed), and the disclosure-not-drawer decision in §7.5.*

## 20.2 Article page

**Desktop (1320).** `148 / 680 / 200` with 44px gaps. Gutter: `038 / Infrastructure / series 2/4` and a sticky TOC. Measure: 42px title, 20px lead at 62ch, 18.5/1.72 body, code and figures inside 680. Aside: share links and `read 38%` with a 2px bar.

**Tablet (900).** One column capped at 680, margins 32. Title 36/1.22, lead 19/1.60, body unchanged at 18.5/1.72. The TOC becomes an **open** disclosure below the lead with a `CONTENTS — 6 SECTIONS` summary row; the gutter's three data become one uppercase mono running head above the section with a hairline under it; share moves to the article end; progress becomes a bar under the header. Code and figures stay in the measure.

**Mobile (390, shown in dark).** Margins 20. Progress bar under the masthead. Breadcrumb shortens. Title 28/1.24. Lead 17/1.60. Metadata **wraps to two lines in fixed order**. TOC is a **closed** framed disclosure. A compressed running head (`SECURITY · EXPLOITATION`) sits above the section over a hairline. Body 17/1.70. Code, terminal and table go **full-bleed** with two hairlines, 12.5px type, pinned line numbers, and `scroll →` markers on their caption lines. Callouts and quotes stay in the 20px margin. Prev/next stacks.

*What changes and why:* one column is lost (law: the column was never the identity); every datum survives (law 02); machine content scrolls while prose reflows (law 03); every hairline spans the viewport while text keeps 20px (law 04).

## 20.3 Blog index

**Desktop.** Featured entry + 200px figure; year bands with the year in the gutter; five-track rows.
**Tablet.** Three-track rows (tag and reading time move to a second line); year headers become sticky rows spanning the list.
**Mobile.** Stacked rows: title at 16.5 first, then one wrapped mono line (`038 · 2026-07-28 · 14 min`), dek dropped, hairline full-bleed, 48px target.

## 20.4 Homepage

**Desktop.** Six bands, each `148 / 1fr`, the "Now" panel on a left hairline beside the intro.
**Tablet.** Same six bands in the same order; gutter labels become running heads above their band; the Now panel narrows.
**Mobile.** Same six bands in the same order, 32px padding; the Now panel moves below the intro with a top hairline; lists stack. **No mobile hero, no reordering, no band removed.**

## 20.5 Projects

**Desktop.** `44 / 1fr / 210` items; status, period, links right-aligned.
**Tablet.** Same two-track structure with a narrower right track.
**Mobile.** Single column: number + **status first** (the sanctioned exception to law 01), then title, description, stack, links as a wrapped mono block.

## 20.6 Project detail

Identical to the article page at all three widths. The four-column status band goes four → two → a stacked two-line mono block.

## 20.7 About

**Desktop.** `680 / 200` intro with the portrait right; experience rows on a `150 / 1fr` grid; Elsewhere in four columns.
**Tablet.** Portrait drops below the intro; experience rows keep both tracks; Elsewhere in two columns.
**Mobile.** Portrait below the intro at full bleed width; experience rows stack (period above role); Elsewhere in one column.

## 20.8 Wide table at 390 — the worked case

Resting state: a full-bleed scroll region bounded by two hairlines, seven columns at their true widths inside a 760px minimum, the `Host` column pinned to the left on the page ground, a 28px fade on the right edge, and `scroll →` on the caption line beside `Table 2 — seven columns, six drills.` Scrolled state: the fade moves to the left edge, the marker flips to `← scroll`, and the pinned column still carries every row's identity. The caption never moves.

## 20.9 Code block at 390 — the worked case

Full-bleed, two hairlines, no radius. Chrome: `roles/monitoring/templates/prometheus.yml.j2` truncated with an ellipsis at ~210px, then `jinja`, then a 44px `copy` control. A pinned line-number track with a hairline on its right; a 12.5/1.8 scroll area beside it; a highlighted line whose tint spans the full scroll width with a 2px accent bar inset on the line; a 26px right-edge fade; `Listing 3 — filename truncates, code does not.` and `scroll →` on the caption line.

---

# 21. Content guidelines

These rules exist because the visual system depends on them. They are the design's tolerance for real content.

## 21.1 Length budgets

| Content | Recommended | Hard behaviour beyond it |
|---|---|---|
| Article title | 45–75 characters | Wraps freely; steps 28 → 26px above 90 characters at mobile; never truncated |
| Article dek / lead | One paragraph, 25–40 words, ≤62ch per line | **Never two paragraphs** |
| Index row dek | 4–10 words | Dropped entirely below 760 |
| Project title | 30–60 characters | Wraps to three lines rather than shrinking further |
| Project description | 25–45 words, capped at 58ch | A second paragraph is permitted only for the `**Why.**` sentence |
| Navigation label | One word | Four destinations maximum |
| Section heading | 2–6 words | — |
| Caption | No limit | Stays mono 11–11.5; carries the argument |
| Stack line | 3–6 technologies, middot-joined | Wraps |
| Interests / working-on line | One middot-joined line, 6–10 items | Wraps at 2.0 line height |
| Experience description | 15–30 words, max 66ch | — |

## 21.2 Metadata rules

- Dates are **ISO 8601**, always.
- Article numbers are three digits, zero-padded, monotonic by publication, and permanent (they are the permalink).
- Reading time is always paired with a word count.
- `upd` appears only when the update is more than a day after publication.
- **Maximum three tags per article.** Eight has been tested and survives at 390, but three is the design intent.
- Status is one of four words: `active · maintained · paused · archived`.
- Absence is stated, not omitted: `client work · no source`, `About —`.

## 21.3 Structural rules

- **Heading depth stops at `h3`.** If content needs `h4`, it needs to be split into more `h2`s or restructured.
- An article with fewer than three `h2`s gets **no TOC**.
- An article over 8,000 words is **split into numbered parts** with series navigation.
- An article with no images is normal. Do not insert imagery to fill it.
- Consecutive code blocks each need a caption line; four in a row is fine, four fused into one slab is not.

## 21.4 Writing voice as a design constraint

The design assumes prose that admits cost, states measurements, and names dead ends. Deks describe what the piece actually contains ("what reproducible actually costs"), not what it promises. Captions state what to notice. Table captions state what the table omits. This matters visually: it is why the system needs no decorative content — the writing supplies the interest that a hero image would otherwise be asked to fake.

## 21.5 Density expectations

| Surface | Target |
|---|---|
| Blog index | 20–40 rows visible per year group without feeling crowded |
| Projects index | 4–8 items; each with two paragraphs maximum |
| Homepage | Six bands; four rows of writing; three projects |
| About | Three experience rows; four Elsewhere columns |
| Article | 5–8 `h2` sections at ~3,000 words |

---

# 22. Design consistency rules

A checklist for anyone adding a component or a page.

**Tokens**
1. Prefer an existing token over a new value, always.
2. Never introduce a colour outside §2.1–2.3. If a new semantic role is genuinely needed, it must be added to the token tables for **both** themes with a stated contrast ratio.
3. Never introduce a spacing value outside the 4px scale in §2.6. If a gap looks wrong, the fix is the next step up or down, not a new number.
4. Never introduce a type size outside §2.5 and its derived table. If a size is needed between two steps, use the nearer step.
5. Never introduce a second radius scale, a border weight above 2px, or any shadow.

**Components**
6. Prefer an existing component over a new variant; prefer a new variant over a new component; prefer changing the page over adding a component.
7. Every new component must state: purpose, anatomy, variants, all applicable states, responsive behaviour at all three widths, spacing, type tokens, colour roles, and when *not* to use it.
8. If a component would appear on exactly one page, it does not belong in the system — and neither does the page as designed.

**Layout**
9. Use one of the three column structures in §5.2. Do not invent a fourth.
10. Maintain the 680px measure. It does not grow, and it is never traded for anything.
11. Every band gets a gutter label and a closing hairline.
12. Peers get a shared rule, never individual containers (§9.2).

**Responsive**
13. Use the two named breakpoints. Do not add a third.
14. Apply the four stacking laws (§3.2) instead of writing per-component responsive rules.
15. Relocate, never delete — except the index-row dek.
16. Machine content scrolls; prose reflows. The page never scrolls sideways.
17. Respect the type floors: body 17, metadata 11.5, code 12.5, targets 44/48.

**Restraint**
18. Do not add a decorative element without a stated purpose. There are no decorative elements in the current design.
19. Do not manufacture visual interest for a thin page. A thin page is a content problem.
20. Preserve article readability above every other consideration, without exception.
21. Keep the accent budget: at most three accented elements per viewport.
22. Never signal with colour alone.

---

# 23. Exceptions register

Distinguishing system-wide rules from local ones matters more than forcing everything into a token. These are all the intentional exceptions in the design, and there are no others.

## 23.1 System-wide rules

Everything in §2 (tokens), §3.2 (stacking laws), §16 (states), §17 (motion), §18 (accessibility), §22 (consistency).

## 23.2 Registered exceptions

| # | Exception | Scope | Why it is not a rule |
|---|---|---|---|
| E1 | **44px grid gap** | Layout | The only spacing value off the 4px scale. Set by the 12-column arithmetic of a 1320px frame, not by rhythm. |
| E2 | **Code blocks stay dark in light mode** | Component 19, 20 | Deliberate: the reader's model of "the machine talking" must survive a theme switch. |
| E3 | **Project status leads on mobile** | Component 07 | The single sanctioned inversion of stacking law 01 — "is it alive" outranks the description. |
| E4 | **TOC gains a 150px scroll cap above 20 sections** | Component 15 | A content-length rule, not a width rule. |
| E5 | **Display type steps 28 → 26px above 90 characters** | `--t-display` at <760 | The only length-conditional type rule in the system. |
| E6 | **The container query for figures, code and tables** | Three components | The only place the system reasons about container width rather than viewport width. |
| E7 | **Middle-truncated digests** | Table cells | The only truncation of content permitted anywhere; only for opaque machine identifiers. |
| E8 | **Truncated filename in code chrome** | Component 19 at <760 | The only other truncation; the code itself never truncates. |
| E9 | **Index-row dek may disappear at <760** | Component 05 | The only datum in the system permitted to be deleted rather than relocated. |
| E10 | **Two metadata abbreviations** (`last deploy 2026-08-19` → `dep 08-19`; section label to two tokens) | Metadata row, gutter | The only compressions allowed; both stay mono, muted, and in fixed order. |
| E11 | **Article header content may exceed the measure (760px)** | Article, project detail | The header is not running prose; the measure governs prose only. |
| E12 | **The 128px spacing step is reserved** | Homepage and 404 only | It exists to make exactly two pages feel like a cover. |
| E13 | **Component interior 2px sub-steps** (14, 18, 22, 28) | Inside components only | Optical padding for controls and rows; never used between components or on a band. |
| E14 | **Above 8,000 words an article splits into parts** | Article | A length rule, not a layout rule. |
| E15 | **Dark mode dims diagrams but not screenshots** | Media | Dimming a UI screenshot misrepresents the software. |

## 23.3 Page-specific rules (not exceptions — local composition)

- Homepage: the "Now" panel, the 24px opening statement, the 2.0-line-height interests line.
- Blog index: the counted-tag filter row, the year-in-serif gutter, the archive-by-year row.
- Project detail: the four-column status band, the Decision/Alternative/Why table.
- About: the 150px period track, the four-column Elsewhere grid, no author block.
- 404: the route list.

Each of these is a *composition* of existing components and tokens, not a new component.

## 23.4 Components that look similar but behave differently

Documented explicitly because they are easy to conflate:

| Pair | Looks the same | Actually differs |
|---|---|---|
| Index row vs table row | Both are hairline-separated multi-track rows | The index row is a link with a hover ground and a 48px target; the table row is data with **no hover** and no target. |
| Callout vs quote | Both have a 2px left marker | The callout has a ground, a radius, a label and serif roman at 16; the quote has no ground, no radius, no label, and serif **italic** at 18–19. The quote is prose; the callout is a different reading mode. |
| Code block vs terminal block | Both dark, both mono, both scroll | Different ground (0.20 vs 0.155), different chrome (filename+language vs uppercase host label), and the terminal has **no line numbers and no copy control**. |
| Figure vs card | Both are bordered rectangles | The figure has square corners, no ground of its own beyond the sunken placeholder, and is never interactive. There are no cards. |
| Tag vs metadata token | Both mono, both small | The tag is accent-coloured, hash-prefixed and a link; the technology token is muted, middot-joined and **not** a link. |
| Featured entry vs project item | Both a title plus a description | The featured entry has a permanent title underline and a paired figure; the project item has a status/instrument track and no figure. |
| Disclosure summary vs button | Both a framed mono control | The disclosure toggles in-flow content and swaps `+`/`−`; the button navigates or acts and never changes shape. |

---

# 24. Implementation independence

This document specifies **appearance, structure and behaviour**, not implementation.

**What is normative here:** token names and values; type, spacing and size relationships; the three column structures; component anatomy, variants, states and responsive behaviour; the breakpoints and the four stacking laws; the accessibility requirements; the anti-patterns and the exceptions register.

**What is deliberately not specified:** the framework, the template language, the styling mechanism, the build pipeline, the component API, the state management, the syntax-highlighting engine, and the font-delivery strategy beyond "self-hosted, subsettable, no runtime third-party requests".

**Two implementation-shaped facts are worth carrying over** because they are design decisions, not technical ones:

1. Tokens are declared once and overridden **wholesale** for the dark theme in a single block — not per component. This is what guarantees the two themes stay in step.
2. Colour is authored in a perceptual colour space (oklch) so both themes share hue and chroma while lightness is tuned independently. Values in this document are authoritative in that space; any conversion is a fallback, not the source of truth.

---

# 25. Accuracy audit and reconciliation

This specification was checked against every frame in the three source boards. The following discrepancies between the original 14-token colour table and the built pages were found and resolved rather than ignored.

## 25.1 Colours present in the design but absent from the original token table

Each was classified and is now documented in §2.1–2.3.

| Value | Classification | Resolution |
|---|---|---|
| `oklch(0.93 0.008 75)` | **Missing token** — used on every inner row hairline across all three boards | Added as `--c-rule-in` |
| `oklch(0.72 0.012 75)` | **Missing token** — third-level mono data in the gutter, "client work", "… 26 more" | Added as `--c-faint` (light); is also `--c-text-2` in dark, which is intentional |
| `oklch(0.45 0.012 75)` | **Missing token** — inactive nav link, frame chrome labels | Added as `--c-nav` |
| `oklch(0.155 0.008 75)` | **Missing token** — terminal ground in light theme (it is `--c-sunken` in dark) | Added as `--c-term-bg` |
| `oklch(0.30 0.012 75)` | **Component-specific** — callout body text | Documented under callout typography |
| `oklch(0.35 0.012 75)` | **Component-specific** — quote text | Documented under quote typography |
| `oklch(0.50 0.012 75)` | **Spec-document only** — the value column in token tables | Not part of the product palette |
| `oklch(0.88 0.008 75)` (dark) | **Component-specific** — article running prose sits one step under headings in dark | Added as `--c-text-prose` (dark only) |
| `oklch(0.27 0.008 75)` (dark) | **Missing token** — inner row hairline, dark | Added as dark `--c-rule-in` |
| `0.235 / 0.30 / 0.34 / 0.28 / 0.45 0.010 75` | **Component-specific** — code and terminal chrome, borders, line numbers | Documented in §2.3 |
| `0.82 0.09 200`, `0.80 0.09 60` | **Missing tokens** — function and number syntax roles (bringing the palette to seven rather than the stated five) | Documented in §2.3; see 25.4 |

## 25.2 Spacing values outside the stated twelve-step scale

| Values | Classification | Resolution |
|---|---|---|
| 44 | **Intentional exception** (grid arithmetic) | E1 |
| 26, 36, 48 | **Responsive scale steps** introduced by the responsive pass, all on the 4px base | Documented in §3.3 |
| 14, 18, 22, 28 | **Component interior sub-steps** (callout, code chrome, index row, masthead, band padding) | E13, bounded to component interiors |
| 34, 52, 64 | Band padding values on the specification boards themselves, not on product pages | Not normative |

## 25.3 Type values outside the stated eleven-step scale

The scale covers eleven canonical tokens. The built pages use **fourteen additional serif sizes** for item titles (14, 16, 16.5, 17, 17.5, 18, 19, 21, 22, 24, 26, 27, 28, 36, 40) and several mono sizes (10, 10.5, 11, 11.5, 12.5, 13). These are not arbitrary: they form a consistent ladder for *titles of things inside lists* and for *metadata at three densities*. They are documented as the derived table in §2.5 rather than being flattened into the eleven tokens, because flattening them would misrepresent the design.

**Two gaps in the original responsive type table** were filled from the built frames: `--t-title` (34 / 30 / 26) and `--t-h3` (19.5 / 19 / 18) had no responsive row; the mobile values are taken from the 390 frames, where page titles render at 26 and mobile `h2`s at 20–21.

## 25.4 Behavioural findings

| Finding | Resolution |
|---|---|
| The syntax palette is described as "five roles" but the frames use **seven** (adding function/identifier and number) | Documented as seven in §2.3. The 0.78–0.82 lightness discipline holds across all seven, so the intent is intact. |
| The original spec says tablet TOC is a "collapsed disclosure"; the responsive board specifies an **open, two-column** disclosure at tablet and closed only at mobile | The responsive board is later and more specific; §3.5 and §6/15 follow it. |
| The original spec's grid table says "Aside (TOC): collapsed after the lead" for tablet; the responsive board splits TOC and aside into two separate relocations | Resolved in §3.6 as two independent jobs. |
| Table rows and index rows share a visual language but only one has a hover state | Made explicit in §15.1 and §23.4. |
| The masthead is specified at "height 60px fixed" but tablet and mobile frames render 56 and 48 | Documented as 60 desktop, with padding-y 18 (tablet) and 14 (mobile) producing the smaller heights. Height is a consequence of padding, not an independent token. |
| Line numbers "appear only above twelve lines", yet several demo frames show them on 4–6 line blocks | The rule is normative; the demo frames are illustrating the number treatment. Implementations follow the rule. |
| The mobile menu's theme control placement was unspecified in the original component note | Resolved from the responsive board: it moves into the panel at <760. |
| Dark mode has no `--c-rule-2` equivalent | Confirmed intentional: dark uses `--c-rule` for group openers, since the dark hairline is already proportionally stronger. |

## 25.5 Deliberate absences confirmed

No form system · no search · no card component · no shadow scale · no icon set · no logo · no gallery · no pagination · no loading states · no error pages beyond the 404 · no contact page · no `h4` · no third breakpoint · no page transitions. Each is documented in place so it is not reintroduced by accident.

## 25.6 Final quality check

| Criterion | Assessment |
|---|---|
| **Completeness** | All 20 components, both themes, three viewport categories, seven page types, twelve edge cases and fifteen registered exceptions are specified. |
| **Consistency** | Every value traces to a token or a registered exception. The four unnamed colours and three unnamed spacing families found in the audit are now named. |
| **Responsiveness** | Two breakpoints, one container query, four stacking laws, six responsive type rows, five type floors, and a per-job relocation table for the gutter and aside. Desktop, tablet and mobile behaviour is stated for every component. |
| **Reusability** | Rules are expressed as laws over component classes (rows, blocks, prose, machine content), not as per-screen notes. |
| **Fidelity** | No new design decisions were introduced. Where the sources disagreed (25.4), the later and more specific source was followed and the divergence recorded. |
| **Practicality** | Remaining undocumented decisions are limited to: exact serif optical-size settings per size, the syntax-highlighter's mapping of language grammars onto the seven roles, and image art direction. All three are content or tooling decisions, not design decisions. |
| **Content resilience** | Verified against twelve stress tests: 148-character titles, eight tags, 210-character code lines, seven-column tables, 90-word and 9,400-word articles, 4K screenshots, image-free articles, and four consecutive code blocks. |

---

*End of specification.*
