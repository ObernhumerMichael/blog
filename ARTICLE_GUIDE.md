# Article writing guide (for an AI agent)

How to draft an article for this site. Read this before writing prose;
read [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) §21 and
[src/content.schemas.ts](src/content.schemas.ts) before finalizing
frontmatter — those are the enforced rules, this file is the voice and
judgment calls a schema can't check.

## Who this is for

One author, writing about their own backend/infrastructure and security
work. Not a company blog, not a tutorial site, not content marketing.
Every article is a first-person account of something the author actually
built, broke, or measured. If a draft could have been written by someone
who didn't do the work, it's wrong for this site.

## Voice

The design system states it as a hard constraint (§21.4): **prose that
admits cost, states measurements, and names dead ends.** Concretely:

- **State the real problem before the solution.** Article
  [001](src/content/writing/001-a-reproducible-homelab.md) opens with
  "provisioning meant SSHing in and typing commands until the box looked
  right. It worked." — not "provisioning was inefficient." Name what was
  actually happening.
- **Distinguish what you claim from what you don't.** "`ansible-playbook`
  is idempotent... That is not the same claim as reproducible" — the
  article draws the line itself instead of leaving it implied.
- **Cost is part of the story, not an afterthought.** Every real technique
  has a price — more resource use, more run time, more failure modes. Say
  what it is. "Reproducibility isn't free... a trade this setup makes on
  purpose, and would make again" is the target shape: cost stated, verdict
  given, no hedging.
- **Name dead ends.** What didn't work, and why, is often more useful than
  what did. Don't quietly omit the approach that failed.
- **First person, plain register.** "I build backend systems..." — not
  "we're excited to share," not "in this article, you will learn."
  Contractions are fine. No forum-post filler ("So basically...", "Anyway,
  let's dive in").

## What a good article does

- Picks one real thing the author did — a build, a bug, a writeup, an
  experiment — and follows it end to end.
- Uses the type mix from IMPLEMENTATION_PLAN.md Phase 10 as a menu:
  problem-solving, reasoning-process (e.g. a CTF writeup), experiment,
  technical explanation. Pick whichever fits what actually happened;
  don't force a shape onto content that doesn't have one.
- Ends where the work actually ended — a result, a lesson, a trade-off
  accepted — not a summary paragraph restating the intro.

## Structural mechanics (enforced, not stylistic)

These are checked by the build; get them right in the draft so review
isn't spent on formatting. Full detail in DESIGN_SYSTEM.md §21 and the
Zod schema — this is the shortlist:

| Rule           | Detail                                                                                                                                                                                                                                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Frontmatter    | `number` (permanent, contiguous), `title`, `lead`, `section` (`Infrastructure` \| `Security`), `date`, `tags` (1–8, from the closed list in `consts.ts`, aim ≤3), `featured` (at most one site-wide), `draft` (defaults `true` — set `false` to publish) |
| Headings       | `## 01 · Title`, numbered from 01, no gaps; `### 1.1 · Title` for subsections; **no h4**. No h1 — the title is the frontmatter.                                                                                                                          |
| Dek/lead       | One paragraph, 25–40 words. Never two paragraphs.                                                                                                                                                                                                        |
| Length         | Under 8,000 words or the build warns; past that it splits into series parts.                                                                                                                                                                             |
| Code fences    | Language must be in `CODE_LANGS`; use `title="path"` for real files, ` ```terminal host="..." ` for sessions.                                                                                                                                            |
| Callouts       | `:::note` / `:::warning`, no code blocks inside them.                                                                                                                                                                                                    |
| Figures        | `:::figure{kind=...}` — `diagram`, `photo`, or `screenshot`; alt text required; captions numbered contiguously per kind.                                                                                                                                 |
| Internal links | `[text](/w/001)` must resolve to a real published article.                                                                                                                                                                                               |

## Things to avoid

- **No invented numbers.** No "28 writeups," no "11 services," no
  fabricated uptime or benchmark figures. If a number isn't real and
  checkable, leave it out — this is a hard rule from the content plan, not
  a style preference.
- **No emoji.** Explicitly excluded from the site's voice (DESIGN_SYSTEM.md
  §1.12).
- **No marketing register.** No "game-changing," "seamless,"
  "cutting-edge," no rhetorical questions as section openers, no
  "let's dive in."
- **No manufactured drama or padding.** If the piece is short, let it be
  short — the design explicitly allows articles with no TOC and no images
  rather than have content padded to fill a template.
- **No employer-confidential detail.** Customer names, internal numbers,
  schemas, or screenshots from professional work stay out unless the
  boundary was explicitly cleared first — see the "Employer boundary" note
  in CONTENT_PLAN.md.
- **No hedged conclusions.** Say what happened and what you'd do again,
  not "your results may vary" disclaimers.
- **Don't reuse a fixture or demo article as source material.** Files
  under `src/pages/dev/fixtures/` and any remaining `src/content/writing/`
  demo entries exist only to stress-test the layout — they are placeholder
  content, not source of truth for voice or fact.

## Before calling a draft done

- `pnpm check:content` passes (frontmatter validates against the schema).
- Word count is real prose, not padding to hit a target.
- Every code block, figure, and internal link actually works.
- Every claimed number is one the author can stand behind.
- `draft: false` is set, or the article silently won't appear.
