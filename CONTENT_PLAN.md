# Content plan — replacing the demo content with the real thing

Work through the steps in order. Each step ends with a check, and each is
one commit. Only step 1 needs input from you, and steps 6–8 need what you gathered there.

Today's site is **demo content wired into real code**. The prose is easy to
swap, but a few tests, one dev page and the visual baselines point at
specific demo entries by number or slug. Deleting the articles alone breaks
`pnpm verify` and the build. Step 5 covers this and is the easiest to miss.

---

## Step 1 · Gather what only you can supply

Do this first. The later steps are mechanical once these are written down.

- [ ] **Identity**: name (already `Michael Obernhumer`), role line for the masthead, contact email, GitHub URL, whether you want a public PGP key.
- [ ] **Bio**: a short version (2–3 sentences, used on the home page and in every article footer) and a long version (2 paragraphs, about page).
- [ ] **Experience**: real roles and periods, newest first. Three rows fit the layout.
- [ ] **Interests**: 5–8 short phrases for the home page band.
- [ ] **"Working on" / "Now" sentence**: what you are doing right now.
- [ ] **Portrait photo**, 200 × 220 or a larger file with the same ratio. See step 6.
- [ ] **Two articles**: topic, rough outline, and any code, terminal output or images they need.
- [ ] **One or two projects**: title, one-line description, stack (3–6 items), status, start date, source URL (or the reason there is none).
- [ ] **Employer boundary**: if a project is professional work, write down what may not appear (customer names, numbers, schemas, screenshots) _before_ drafting. IMPLEMENTATION_PLAN.md OD-04 / §7.4 says to get this in writing.

Rule from the design brief: **no invented numbers.** That includes "28 writeups", "11 services" and "uptime 214 d". If a figure is not real, leave it out.

---

## Step 2 · Delete the demo content

```sh
git rm src/content/writing/*.md src/content/projects/*.md
```

That removes 7 articles and 4 projects. Before you run it, keep three of the
articles' _shapes_, because they are the T4 stress tests from
IMPLEMENTATION_PLAN.md §25.6:

| Demo entry                            | What it stress-tests                                         | Keep as                                                 |
| ------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| `005-tmux-pane-title-fix.md` (90 wds) | Short article: no TOC, no author block, no related list      | `src/pages/dev/fixtures/short-article.md`               |
| `006-34-lessons-homelab.md` (9k wds)  | 34 sections: TOC's 150px scroll cap, the 8,000-word warning  | `src/pages/dev/fixtures/long-article.md`                |
| `007-…-ssh-config.md` (8 tags)        | 8 tags wrapping at 390px                                     | `src/pages/dev/fixtures/eight-tags.md`                  |
| `004-industrial-…` (no source)        | Project with `sourceAbsence` and no source link (T4 fixture) | Covered by your own project if it has no public source. |

Move them like this. It follows the precedent of `dev/fixtures/image-free.md`.

1. `git mv` the file into `src/pages/dev/fixtures/`.
2. Replace `tags`/`section` frontmatter as needed. Fixtures are not schema-validated (`image-free.md` uses `section: 'Fixtures'` and `tags: ['fixture']`).
3. Add `layout: ../../../layouts/ProseLayout.astro` and a `number: 90x` that no real entry can take.
4. Keep `draft: true`.

Do **not** keep them as `draft: true` entries in `src/content/writing/`.
Numbering is checked across drafts too, so a parked fixture would take
number `001` and push your real first article to `002`. Permalinks are
`/w/<number>` and permanent.

`src/pages/dev/` is stripped from `dist/` at build time by the
`strip-dev-pages` hook in [astro.config.mjs](astro.config.mjs), so fixtures
never ship.

**Keep**: `public/dev/` (used by the dev fixtures and the specimen page),
`src/pages/dev/**`, `src/content/site/now-fallback.json` (see step 4).

**Check**: `ls src/content/writing src/content/projects` shows nothing.
Don't run `pnpm verify` yet. It is expected to fail until step 5.

---

## Step 3 · Reset [src/consts.ts](src/consts.ts)

This file is structural, so only these values change.

| Constant        | Now                                                                         | Do                                                                                                                                                                                  |
| --------------- | --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SITE_URL`      | `https://obernhumer.com`                                                    | Confirm it is the real domain. It must also match `site` in [astro.config.mjs](astro.config.mjs). These are the only two places a URL literal is allowed.                           |
| `GITHUB_URL`    | `https://github.com/ObernhumerMichael`                                      | Confirm.                                                                                                                                                                            |
| `CONTACT_EMAIL` | `mail@obernhumer.com`                                                       | Confirm it is a real, monitored address.                                                                                                                                            |
| `PGP_URL`       | `/TODO-set-real-pgp-key.asc` (a 404, excluded in `lychee.toml`)             | **Decide.** Either put the key at `public/pgp.asc` and set `'/pgp.asc'`, or drop PGP everywhere (see the note below). Then delete the `exclude` line in [lychee.toml](lychee.toml). |
| `NOW_PANEL_URL` | `https://now.internal.invalid/status.json`                                  | Leave until the deploy phase has a real endpoint. See step 4.                                                                                                                       |
| `TAGS`          | `ansible, infrastructure, homelab, ctf, security, notes, linux, networking` | Reduce to the tags your two articles actually use. Add one line whenever a new article needs a tag. The comments describing 5.9/6.1 fixtures are demo history, so trim them.        |
| `NAV_LINKS`     | Writing / Projects / About                                                  | Keep.                                                                                                                                                                               |
| `CODE_LANGS`    | 27 languages                                                                | Keep. Only add a language if an article needs one, because an unknown fence language fails the build.                                                                               |
| `FIGURE_KINDS`  | diagram / screenshot / photo                                                | Keep.                                                                                                                                                                               |

**Dropping PGP**: `SITE_LINKS.pgp` is rendered in
[Footer.astro](src/components/chrome/Footer.astro),
[Masthead.astro](src/components/chrome/Masthead.astro) and
[index.astro](src/pages/index.astro), and as `Keys` in `COPY.about.elsewhere`.
Removing it means editing all four. Publishing a real key is less work.

**Section enum**: `SECTIONS` in [src/content.schemas.ts](src/content.schemas.ts) is
`['Infrastructure', 'Security']`. If either article doesn't fit one of
those, add a section there. It is a closed set on purpose.

---

## Step 4 · Rewrite [src/copy.ts](src/copy.ts)

Every entry says where it renders. Replace each value; keep the keys. The
`experience`, `elsewhere` and `interests` entries currently describe a
homelab / CTF persona that may not be yours.

| Key                        | Renders at                              | Notes                                                                                          |
| -------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `site.name`                | Masthead, footer, `<title>`, RSS, about | Probably unchanged.                                                                            |
| `site.role`                | Masthead under the wordmark             | Short: `backend · infrastructure` style.                                                       |
| `site.feedDescription`     | RSS `<description>`                     | One sentence.                                                                                  |
| `site.authorBio`           | Home "About & contact", article footers | Short bio from step 1.                                                                         |
| `home.metaDescription`     | Search snippet                          | Around 150 characters.                                                                         |
| `home.statement`           | Home `<h1>`                             | One sentence. This is the most visible line on the site.                                       |
| `home.context`             | Paragraph under the statement           |                                                                                                |
| `home.nowSentence`         | Home "Now" panel                        | What you are doing _now_. Update it whenever it stops being true.                              |
| `home.interests`           | Home interests band                     | Joined with `·`.                                                                               |
| `about.metaDescription`    | About search snippet                    |                                                                                                |
| `about.updated`            | "upd …" on the about page               | **Set by hand**, e.g. `2026-09-21`, whenever the about text changes.                           |
| `about.bio`                | About, two paragraphs (second is muted) | Long bio from step 1. Keep exactly two entries.                                                |
| `about.workingOn`          | About "Working on" band                 | Real, current items.                                                                           |
| `about.experience`         | About experience rows                   | `period` is free text (`'2024 — now'`). Newest first.                                          |
| `about.elsewhere`          | About three-column grid                 | Email, Code, Keys.                                                                             |
| `projects.metaDescription` | Projects search snippet                 |                                                                                                |
| `writing.metaDescription`  | Writing search snippet                  | A function that embeds the live count. Check that the sentence reads well with a count of `2`. |

**Now panel facts** ("homelab uptime 214 d", "11 services ok", "last deploy
…"): these three numbers come from
[now-fallback.json](src/content/site/now-fallback.json) whenever
`NOW_PANEL_URL` fails, which is every build until a real endpoint exists.
Today they are the design spec's example numbers, so publishing as-is
publishes invented metrics. The label text `homelab uptime` is also
hard-coded in [index.astro](src/pages/index.astro). Pick one:

- **A. You will build the endpoint** (Phase 9 in the plan): put the _true_ current values in `now-fallback.json` now, and re-check them on each release.
- **B. You won't have live data soon**: remove the `<ul class="now-facts">` block from [index.astro](src/pages/index.astro), and then `NOW_PANEL_URL`, [src/lib/now.ts](src/lib/now.ts), `nowFallbackSchema`, `now-fallback.json` and [tests/invariants/now.test.ts](tests/invariants/now.test.ts) become dead code. Delete them in the same commit.

I recommend **B** unless a real homelab endpoint is imminent. Deleting is
less work than keeping the numbers honest.

**Check**: `pnpm check:astro` passes (`ElsewhereLink` and `ExperienceRow` types).

---

## Step 5 · Repair the code that points at demo entries

These break after step 2. Fix them before writing articles so you can build
while you write.

1. **[src/pages/dev/specimen.astro](src/pages/dev/specimen.astro)** — it builds like any page.
   - Line ~114: `published.find((e) => e.number === 3)!` throws when fewer than 3 articles are published, which fails the build. Change it to use a fixed synthetic entry, or `published.at(-1)`. Note that prev/next/related then render empty with only two articles, which is fine for a layout page.
   - Line ~157: `published.find((e) => e.featured)` returns `undefined`. It is already guarded with `&&`, so the featured-entry block just won't render. Decide whether that is acceptable.
   - Line ~1022: `projects[0]` crashes if there are no projects. Keep at least one project, or guard it.
2. **[tests/e2e/pages.ts](tests/e2e/pages.ts)** — the T3 page matrix:
   - `/w/001` stays valid (your first article is 001).
   - `/w/007`, `/w/006`, `/w/004` no longer exist. Replace them with the three fixtures from step 2: `/dev/fixtures/eight-tags`, `/dev/fixtures/long-article`, `/dev/fixtures/short-article`.
   - The two `/projects/<slug>` entries: slugs are **derived from the title** (`slugify`), so they change with the new project title. Update them, or drop the second.
3. **[tests/e2e/visual.spec.ts](tests/e2e/visual.spec.ts)** and **[lighthouserc.cjs](lighthouserc.cjs)** — both hard-code `/projects/self-hosted-homelab-infrastructure-automation`. Point them at your real project's slug.
4. **Visual baselines** (`tests/baselines/{home,about,article,article/index,projects,projects/index}/*.png`) are screenshots of the demo content and will all fail. Regenerate them at the end (step 9). 404 and `specimen/*` don't need it.
5. **README.md** still says "Phase 0 … Not yet buildable" — one line to fix while you're here.

**Check**: `pnpm check:astro && pnpm check:content` passes on an empty collection. Numbering tests pass trivially. If `check:content` fails on an empty directory, that is a small bug in `loadCollection` to fix, not to work around.

---

## Step 6 · Images

**Portrait.** There are two placeholders and neither accepts an image yet.
Both need a small code change:

- [about.astro](src/pages/about.astro) `.portrait` — a labelled empty box (`[ portrait ] 200 × 220`), `aria-hidden`.
- [ArticleApparatus.astro](src/components/article/ArticleApparatus.astro) `.author-portrait` — an empty `div`, sized by `--portrait-author`.

Put the file in `src/assets/` (not `public/`) and use Astro's `<Image>`, so it
gets resized and converted to a modern format. Give it real `alt` text and
drop `aria-hidden` (the design bans decorative images, §18.6). The dark-mode
92% dimming rule applies to photos, so check it there. Use the same file in
both places.

**Article images.** Use the figure directive. `kind` and the alt text are
required, and the build fails without them:

```md
:::figure{kind="diagram"}
![Alt text describing the diagram](./architecture.svg)

Fig. 1 — Caption text. Numbered per kind, contiguous from 1.
:::
```

- `kind`: `diagram` (dimmed in dark mode), `photo` (dimmed), `screenshot` (not dimmed, sits on a sunken ground).
- A **relative** path from the Markdown file goes through `astro:assets` (resized, modern format). An absolute `/x.svg` path is served untouched from `public/`. Prefer relative for photos and screenshots.
- Captions are `Fig. n — …`, `Listing n — …` or `Table n — …`, numbered separately per kind. Skipping a number fails the build.
- Screenshots: check them in both themes, and crop out anything private (hostnames, tokens, email).

**Site icons.** [public/favicon.svg](public/favicon.svg) and `favicon.ico`
exist. Confirm they are what you want. There is **no Open Graph image or
`og:` meta tag** anywhere in [BaseLayout.astro](src/layouts/BaseLayout.astro),
so links shared on social platforms render as plain text. That is a
feature, not a content fix. Add it separately if you want it.

---

## Step 7 · The two articles

Create `src/content/writing/001-<slug>.md` and `002-<slug>.md`. The file
name is free-form, since the number in frontmatter is what counts.

**Pick two different shapes** so the real content exercises the design:

1. **A long-form article**: at least three numbered sections, one code block, one table or figure, ideally a terminal block. Three or more `##` headings turn on the TOC and the author block.
2. **A shorter one** (a note, a fix, an experiment): one or two sections. This checks that the page gates its apparatus correctly with real content.

Suggested type mix from IMPLEMENTATION_PLAN.md Phase 10: problem-solving,
reasoning-process (e.g. a writeup), experiment, technical explanation. Choose
whichever two you have most to say about, not what the demo content covered.

**Frontmatter template**

```yaml
---
number: 1
title: 'Your title'
lead: 'One paragraph. No blank line inside it.'
section: 'Infrastructure' # must be in SECTIONS
date: 2026-09-21
tags: ['ansible'] # 1–8, lowercase, must be in TAGS (aim for ≤3)
featured: true # at most ONE article site-wide
draft: false # the default is true. Forgetting this hides the article
---
```

Optional: `updated:` (must be more than one day after `date`),
`series: { id, name, part, total }`.

**Authoring rules the build enforces**

- Headings: `## 01 · Title`, numbered from 01 with no gaps. Subsections `### 1.1 · Title`. **No `h4`.** The page title is the `h1`, so never write one.
- Fences: language must be in `CODE_LANGS`, else the build fails. Use ` ```yaml title="path/in/repo.yml" `. A highlight is `{14-16}`. For shell sessions use ` ```terminal host="pi-02" `.
- Callouts: `:::note` / `:::warning` (no code blocks inside them).
- Internal links: `[text](/w/001)` must resolve to a real route.
- Every image needs non-empty alt text.
- Keep it under 8,000 words or the build warns.
- Numbers are permanent permalinks and contiguous from 1. Never renumber a published article.

Consider making 001 the `featured` article. It fills the home page's
Featured band and the top of the writing index. Only one may be featured.

**Check**: `pnpm dev`, open `/w/001` and `/w/002` at 390 / 900 / 1320 wide and in both themes. Confirm the counts on the home page, `/writing` and the mobile menu read `2`, and `/rss.xml` lists both.

---

## Step 8 · One or two projects

Create `src/content/projects/001-<slug>.md`. Fields (see
`projectsSchema`):

```yaml
---
number: 1
title: 'Project title' # slug is derived from this
description: 'What it is and why it exists.'
why: 'One line on the motivation.' # optional
stack: ['a', 'b', 'c'] # 3–6 items
status: 'active' # active | maintained | paused | archived
period: { from: 2024-02-01, to: null } # null = ongoing
caseStudy: true # true = has a detail page with the 5 canonical sections
links:
  article: '/w/001' # optional; can point at one of your articles
  source: 'https://github.com/…' # if absent, sourceAbsence is required
sourceAbsence: 'client work · no source'
featured: true # up to three, shown on the home page
draft: false # default is false here, unlike writing
---
```

- `caseStudy: true` means the body needs the five sections from IMPLEMENTATION_PLAN.md §11.2: `01 · Problem & motivation`, `02 · Architecture`, `03 · Implementation`, `04 · Technical decisions` (a table), `05 · Results & lessons`.
- `caseStudy: false` is a list entry only, with a short body.
- The home page's "Selected work" band shows `featured: true` projects. Zero renders "0 of 0" without crashing, but it looks empty, so feature at least one.
- If it is professional work, follow the publication boundary from step 1 and use `sourceAbsence`.

**Check**: `/projects` and `/projects/<slug>` render at all three widths. Update the slugs from step 5.

---

## Step 9 · Full verification

```sh
pnpm verify                       # format, astro check, css, tokens, fonts, content, e2e, svelte
pnpm build && pnpm check:links    # lychee against dist/
```

Then regenerate the screenshot baselines. Do it once, after the content is
final, and **look at every new image** before committing. A baseline you
didn't look at can lock in a bug.

```sh
astro dev --background
pnpm exec playwright test tests/e2e/visual.spec.ts --update-snapshots
astro dev stop
```

If Playwright can't launch a browser, use the Nix devShell. It exports
`PLAYWRIGHT_CHROMIUM_EXECUTABLE`, and `playwright.config.ts` already reads
it (see [CLAUDE.md](CLAUDE.md)).

Do the three manual checks in [CHECKLIST.md](CHECKLIST.md) on the home,
about, article and projects pages: **accent budget** (max 3 accented items
per viewport), **box-or-rule**, **does every band do work**. With only two
articles, the home page's "Latest writing" band is short. Decide whether
that reads as honest or empty.

---

## Things to pay attention to

- **`draft` defaults differ.** Articles default to `draft: true` (forgetting it hides the piece), projects to `false`.
- **Numbers are forever.** `/w/001` is a permalink. No gaps, no renumbering, and drafts count.
- **Titles become URLs.** Article slugs (`/writing/<slug>`, a redirect to `/w/<num>`) and project slugs come from `title`. Changing a title later changes the project's URL, so settle titles before publishing.
- **`/writing/<slug>` is a meta-refresh, not a real 301.** That is a known limit of static output with no adapter, tracked for the deploy phase. Share `/w/<num>` links.
- **Tags are a closed list.** A typo fails `check:content`. That is the point.
- **`about.updated` is manual.** Nothing updates it for you.
- **Dates**: use real publication dates. RSS sorts by them, and the home page's "latest" band does too.
- **Language**: everything is English-only (OD-05). Don't add German text without deciding on the multi-language structure first.
- **Licence**: README states article content is © you, all rights reserved. Confirm that is what you want for the two articles and any photos.
- **Third-party assets**: no external fonts, scripts or embeds. The site relies on a strict CSP later, so don't paste an `<iframe>` or a hosted image URL into an article.
- **No `ViewTransitions`/`ClientRouter`, no Tailwind, no literal colours or spacings** ([CLAUDE.md](CLAUDE.md)). None of the content work above should need them.
- **Deploy is not in this plan.** Phase 9 (Caddy, rsync, real 301s, Now endpoint, analytics) is separate. Publishing content and deploying are independent tasks.

---

## Suggested commits

1. `docs: add the content plan`
2. `chore: remove the demo articles and projects` (step 2, fixtures moved)
3. `refactor: point tests and the specimen page away from demo entries` (step 5)
4. `feat: real site copy` (steps 3–4)
5. `feat: real portrait` (step 6)
6. `feat: first two articles` (step 7)
7. `feat: first project` (step 8)
8. `test: regenerate visual baselines` (step 9)
