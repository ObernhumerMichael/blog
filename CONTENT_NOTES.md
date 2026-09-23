# Content notes — step 1 answers

The gathered facts from [CONTENT_PLAN.md](CONTENT_PLAN.md) step 1, written
down so steps 2–9 don't have to re-derive them. Source of truth for the
real copy going into `src/copy.ts`, `src/consts.ts` and the first
article/project. Delete this file once steps 3–8 are done and the real
content is committed — it's a working note, not a permanent doc.

## Identity

- Name: Michael Obernhumer
- Role line (masthead): `backend · infrastructure`
- Contact email: `mail@obernhumer.com`
- GitHub: `https://github.com/ObernhumerMichael`
- Domain: `obernhumer.com` (confirmed real)
- PGP: yes — key to be supplied later (step 6), `PGP_URL` becomes `/pgp.asc`

## Bios

**Short** (home page + article footers, `site.authorBio`):

> CS student at TU Wien and backend developer at Hargassner (Spring Boot,
> Laravel). Writes about what comes out of building things privately — a
> homelab rebuilt to be reproducible with Ansible, and ongoing interests in
> Linux, privacy and security.

**Long** (about page, `about.bio`, two entries, second renders muted):

> I'm a CS student at TU Wien, and an avid Linux and privacy/security
> enthusiast — NixOS on my daily setup after a few years each on Arch and
> Fedora, Debian on the homelab. Most of what ends up on this site comes
> out of what I build in my own time: rebuilding that homelab to be fully
> reproducible with Ansible rather than something I just hope stays up,
> and thinking through what data collection actually costs people. I write
> things down here mostly because it's the only way I actually remember
> what I learned — the problems, the wrong turns, and how I got past them.
>
> Day to day I work as a backend developer at Hargassner: an end-of-line
> testing system in Spring Boot, and a Laravel-based platform where
> clients and translation offices upload language files, get them
> machine-translated by an LLM, and run them through a versioning and
> review workflow.

## Experience (`about.experience`, newest first)

| period | role | description |
|---|---|---|
| `Oct 2025 — now` | Computer Science — TU Wien | Undergraduate CS degree, started after working full-time at Hargassner for the year prior. |
| `May 2025 — now` | Backend developer — Hargassner Ges.m.b.H. | Spring Boot end-of-line testing system and a Laravel-based translation platform; full-time before the degree started, part-time during term, full-time again over the summer breaks. |
| `Jul 2024 — Mar 2025` | Civil service | Compulsory Zivildienst. |
| `2019 — 2024` | HTL Braunau — Cyber Security | Secondary technical education, Cyber Security branch. |
| `Jul–Aug 2022 & 2023` | Network technician (internship) — Ocilion IPTV Technologies | Two-month internships, one each summer. |

## Interests (`home.interests`)

`self-hosted infrastructure`, `ansible`, `linux internals`,
`privacy & data protection`, `NixOS`, `backend systems`, `problem solving`

## Home page

- `home.statement`: "I build backend systems and write down what actually
  happens while building them."
- `home.context`: "Day to day that's Spring Boot and Laravel at
  Hargassner, alongside a CS degree at TU Wien. The same instinct applies
  to my own infrastructure outside of work — a homelab rebuilt to be
  reproducible with Ansible, and the Linux and privacy questions that come
  with running it."
- `home.nowSentence`: "Rebuilding the homelab on Ansible, and studying for
  the CS degree at TU Wien."
- `home.metaDescription`: "Backend systems built professionally and for
  myself — Spring Boot and Laravel by day, a reproducible homelab and
  Linux internals the rest of the time."

## About page

- `about.metaDescription`: unchanged — "A colophon, not a résumé — who
  writes this, what they work on, and how to reach them."
- `about.workingOn`: `['rebuilding the homelab on Ansible', 'the CS degree
  at TU Wien']`

## Site-wide

- `site.feedDescription`: "Writing on backend development, self-hosted
  infrastructure and Linux."
- `writing.metaDescription` (fn): `` `${total} articles on backend
  development, infrastructure and Linux.` ``
- `projects.metaDescription`: unchanged.

## Now panel numbers

**Decision: drop entirely** (step 4 option B). Remove the `now-facts`
block from `index.astro`, then `NOW_PANEL_URL`, `src/lib/now.ts`,
`nowFallbackSchema`, `now-fallback.json` and
`tests/invariants/now.test.ts` become dead code — delete in the same
commit. `home.nowSentence` itself stays (see above).

## Portrait

Done — cropped and saved to `src/assets/portrait.jpg` (1150×1265, 10:11
ratio, headshot tightly framed for a small avatar size). Raw upload
removed from `public/`. Still needs wiring into `about.astro`'s
`.portrait` and `ArticleApparatus.astro`'s `.author-portrait` with
Astro's `<Image>` (step 6) — real alt text, no `aria-hidden`, check the
dark-mode 92% dimming.

## Article 001 (long-form, `Infrastructure`, featured)

**Working title area:** switching the homelab to Ansible.

Outline:

1. The problem with the old way — manual SSH + `docker compose` per box,
   drift between hosts
2. Idempotent isn't reproducible — the distinction, and why it mattered
3. Structuring the playbook for backups — the structured layout, a real
   snippet
4. What went wrong — the idempotency mistakes / dead ends
5. Where it stands now — Caddy, Uptime Kuma, Nextcloud, Immich,
   SimpleLogin, the backup job, ntfy, all under Ansible

Code/terminal/image material: not yet supplied — to be gathered when
actually drafting (step 7).

## Article 002 (short, `Security`)

**Working title area:** a year of SimpleLogin.

Outline (1–2 sections, no TOC):

1. The workflow cost — overhead of per-service aliases day to day
2. What it actually caught — spam sources identified, control gained over
   which addresses are real

Substance: workflow cost vs. gained control over spam/valid-address
tracking. No invented numbers — only counts actually tracked.

## Project (`src/content/projects/001-<slug>.md`)

```yaml
title: 'Self-hosted homelab on Ansible' # or close variant — not finalized
description: 'A self-hosted service stack — Caddy, Uptime Kuma, Nextcloud, Immich, SimpleLogin and a backup job — rebuilt on Ansible to be reproducible from an empty disk instead of hand-configured.'
why: 'Wanted rebuilds measured in minutes, not hoped-for uptime.'
stack: ['Ansible', 'Docker Compose', 'Debian', 'Caddy']
status: 'active'
period: { from: 2023-10-28, to: null }
caseStudy: true
links:
  article: '/w/001'
sourceAbsence: 'private repo · encrypted vault, kept private for reduced exposure'
featured: true
draft: false
```

The Laravel translation platform is **not** a project entry — not yet
allowed to write about it publicly. Revisit later if that changes.

## Employer boundary (Hargassner)

Written down per IMPLEMENTATION_PLAN.md OD-04/§7.4, before any of the
copy above referencing work was finalized. **Never include:**

- client/customer names
- translation office names
- specific numbers (file counts, client counts, pricing)
- real screenshots
- internal system names

Applies to the long bio, the experience row, and any future article or
about-page text that touches the Hargassner work.
