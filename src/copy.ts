// Every piece of hand-written prose on the site, in one place.
//
// Edit the text here; nothing else needs to change. Grouped by where it
// appears, and every entry says exactly which spot on the page it fills.
// Structural values (URLs, nav links, code-language and tag registries)
// stay in consts.ts — this file is words only, except `about.elsewhere`,
// which reuses the URL constants so a link is only ever defined once.
//
// Not here on purpose: text computed from live data (article/project
// counts, the Now panel's uptime numbers — see src/lib/now.ts and
// src/content/site/now-fallback.json), and the 404 page / UI labels
// ("Latest writing", "all projects →"), which are interface chrome rather
// than copy.

import { CONTACT_EMAIL, GITHUB_URL, PGP_URL } from './consts.ts';

export interface ExperienceRow {
  /** Display string, rendered as-is in the 150px mono period track. */
  period: string;
  role: string;
  description: string;
}

export interface ElsewhereLink {
  label: string;
  value: string;
  /** Omit to state an absence ("—") instead of linking nowhere. */
  href?: string;
}

const experience: ExperienceRow[] = [
  {
    period: '2024 — now',
    role: 'Independent — homelab & infrastructure',
    description:
      'Design and operate a self-hosted service stack end to end, Ansible-driven, measured in minutes-to-rebuild rather than hoped-for uptime.',
  },
  {
    period: '2021 — 2024',
    role: 'Backend engineer',
    description:
      'Built and operated distributed backend services in production; owned the on-call rotation and the postmortems that came out of it.',
  },
  {
    period: '2019 — 2021',
    role: 'Security research & CTF',
    description:
      'Competitive CTF play — heap exploitation, format strings, and a first serious attempt at kernel-land bugs.',
  },
];

const elsewhere: ElsewhereLink[] = [
  { label: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { label: 'Code', value: 'github.com/ObernhumerMichael', href: GITHUB_URL },
  { label: 'Social', value: '—' },
  { label: 'Keys', value: 'PGP', href: PGP_URL },
];

export const COPY = {
  // ── Whole site ──────────────────────────────────────────────────────
  site: {
    /**
     * Masthead wordmark, footer, the `<title>` suffix ("Page · Name"), the
     * RSS feed title, the article-footer author block and the about page's
     * `<h1>`.
     */
    name: 'Michael Obernhumer',
    /** Small text under the wordmark in the masthead. */
    role: 'backend · infrastructure',
    /** RSS feed `<description>`. */
    feedDescription: 'Writing on backend development and infrastructure automation.',
    /**
     * SHORT bio: the home page's "About & contact" band and the article-footer
     * author block. (The about page has its own longer one, `about.bio`.)
     */
    authorBio:
      'Backend developer working on distributed systems and infrastructure automation. Writes about homelab engineering, security research and the tooling that holds both together. Corrections and disagreements are welcome by email.',
  },

  // ── Home page (/) ───────────────────────────────────────────────────
  home: {
    /** `<meta name="description">`; the search-result snippet. */
    metaDescription:
      'Backend systems and the infrastructure they run on, written down as they actually behave.',
    /** Big serif `<h1>` at the top of the page. */
    statement:
      'I build backend systems and the infrastructure they run on, and I write down how they actually behave.',
    /** Paragraph directly under the statement. */
    context:
      'Most of my time goes to services, data flow and the parts that decide whether a system survives production: provisioning, observability, failure modes, and the migration you have to do without downtime. Outside of that: Linux, self-hosting, security research.',
    /** Sentence in the "Now" panel, above the live uptime/services/deploy facts. */
    nowSentence:
      "Rebuilding the homelab's secrets pipeline and restore drills; reading the Linux network stack from netfilter down.",
    /** "Interests" band — a general list, joined with " · " at render time. */
    interests: [
      'self-hosted infrastructure',
      'ansible',
      'CTF & exploitation',
      'distributed systems',
      'terminal tooling',
      'home networking',
      'type systems',
    ],
  },

  // ── About page (/about) ─────────────────────────────────────────────
  about: {
    /** `<meta name="description">`. */
    metaDescription:
      'A colophon, not a résumé — who writes this, what they work on, and how to reach them.',
    /** "upd …" date in the header gutter. Update by hand when the text below changes. */
    updated: '2026-08-02',
    /** LONG bio: the two paragraphs under the name (the second one is muted). */
    bio: [
      'I build backend systems and the infrastructure they run on, mostly for services that are supposed to keep running long after the interesting part of building them is over. Most of what ends up on this site comes out of that work: provisioning, observability, migrations without downtime, and the failure modes you only find by hitting them.',
      'Outside of work hours it is the same territory at smaller scale — a homelab run the way I would want production run, security research and CTF play, and enough Linux internals to be dangerous. I write things down here because it is the only way I actually remember what I learned.',
    ] as const,
    /** "Working on" band — what is in progress right now; joined with " · ". */
    workingOn: [
      'rebuilding the homelab secrets pipeline',
      'restore drills',
      'the Linux network stack from netfilter down',
    ],
    /** "Experience" band — one row each, newest first. */
    experience,
    /** "Elsewhere" band — four-column grid of label over value. */
    elsewhere,
  },

  // ── Projects index (/projects) ──────────────────────────────────────
  projects: {
    /** `<meta name="description">`. */
    metaDescription:
      'Projects worth writing about — what each one is, why it exists and what it is built from.',
  },

  // ── Writing index (/writing) ────────────────────────────────────────
  writing: {
    /** `<meta name="description">`; a function because it embeds the live article count. */
    metaDescription: (total: number) =>
      `${total} articles on backend development and infrastructure automation.`,
  },
};
