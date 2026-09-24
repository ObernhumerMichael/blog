// Every piece of hand-written prose on the site, in one place.
//
// Edit the text here; nothing else needs to change. Grouped by where it
// appears, and every entry says exactly which spot on the page it fills.
// Structural values (URLs, nav links, code-language and tag registries)
// stay in consts.ts — this file is words only, except `about.elsewhere`,
// which reuses the URL constants so a link is only ever defined once.
//
// Not here on purpose: text computed from live data (article/project
// counts), and the 404 page / UI labels ("Latest writing", "all projects
// →"), which are interface chrome rather than copy.

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
  href: string;
}

const experience: ExperienceRow[] = [
  {
    period: 'Oct 2025 — now',
    role: 'Computer Science — TU Wien',
    description:
      'Undergraduate CS degree, started after working full-time at Hargassner.',
  },
  {
    period: 'May 2025 — now',
    role: 'Backend developer — Hargassner Ges.m.b.H.',
    description:
      'Spring Boot end-of-line testing system and a Laravel-based translation platform; full-time before the degree started, part-time during term, full-time again over the summer breaks.',
  },
  {
    period: 'Jul 2024 — Mar 2025',
    role: 'Civil service',
    description: 'Compulsory Zivildienst.',
  },
  {
    period: 'Jul–Aug 2022 & 2023',
    role: 'Network technician (internship) — Ocilion IPTV Technologies',
    description: 'Two-month internships, one each summer.',
  },
  {
    period: '2019 — 2024',
    role: 'HTL Braunau — Cyber Security',
    description: 'Secondary technical education, Cyber Security branch.',
  },
];

const elsewhere: ElsewhereLink[] = [
  { label: 'Email', value: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { label: 'Code', value: 'github.com/ObernhumerMichael', href: GITHUB_URL },
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
    feedDescription:
      'Writing on backend development, self-hosted infrastructure and Linux.',
    /**
     * SHORT bio: the home page's "About & contact" band and the article-footer
     * author block. (The about page has its own longer one, `about.bio`.)
     */
    authorBio:
      'CS student at TU Wien and backend developer at Hargassner (Spring Boot, Laravel). Writes about what comes out of building things privately — a homelab rebuilt to be reproducible with Ansible, and ongoing interests in Linux, privacy and security.',
  },

  // ── Home page (/) ───────────────────────────────────────────────────
  home: {
    /** `<meta name="description">`; the search-result snippet. */
    metaDescription:
      'Backend systems built professionally and for myself — Spring Boot and Laravel by day, a reproducible homelab and Linux internals the rest of the time.',
    /** Big serif `<h1>` at the top of the page. */
    statement:
      'I build backend systems and write down what actually happens while building them.',
    /** Paragraph directly under the statement. */
    context:
      "Day to day that's Spring Boot and Laravel at Hargassner, alongside a CS degree at TU Wien. The same instinct applies to my own infrastructure outside of work — a homelab rebuilt to be reproducible with Ansible, and the Linux and privacy questions that come with running it.",
    /** Sentence in the "Now" panel. */
    nowSentence:
      'Rebuilding the homelab on Ansible, and studying for the CS degree at TU Wien.',
    /** "Interests" band — a general list, joined with " · " at render time. */
    interests: [
      'self-hosted infrastructure',
      'ansible',
      'linux internals',
      'privacy & data protection',
      'NixOS',
      'backend systems',
      'problem solving',
    ],
  },

  // ── About page (/about) ─────────────────────────────────────────────
  about: {
    /** `<meta name="description">`. */
    metaDescription:
      'A colophon, not a résumé — who writes this, what they work on, and how to reach them.',
    /** "upd …" date in the header gutter. Update by hand when the text below changes. */
    updated: '2026-09-23',
    /** LONG bio: the two paragraphs under the name (the second one is muted). */
    bio: [
      "I'm a CS student at TU Wien, and an avid Linux and privacy/security enthusiast — NixOS on my daily setup after a few years each on Arch and Fedora, Debian on the homelab. Most of what ends up on this site comes out of what I build in my own time: rebuilding that homelab to be fully reproducible with Ansible rather than something I just hope stays up, and thinking through what data collection actually costs people. I write things down here mostly because it's the only way I actually remember what I learned — the problems, the wrong turns, and how I got past them.",
      'Day to day I work as a backend developer at Hargassner: an end-of-line testing system in Spring Boot, and a Laravel-based platform where clients and translation offices upload language files, get them machine-translated by an LLM, and run them through a versioning and review workflow.',
    ] as const,
    /** "Working on" band — what is in progress right now; joined with " · ". */
    workingOn: ['rebuilding the homelab on Ansible', 'the CS degree at TU Wien'],
    /** "Experience" band — one row each, newest first. */
    experience,
    /** "Elsewhere" band — three-column grid of label over value. */
    elsewhere,
  },

  // ── Projects index (/projects) ──────────────────────────────────────
  projects: {
    /** `<meta name="description">`. */
    metaDescription:
      'Projects worth writing about — what each one is, why it exists and what it is built from.',
    /** Lead paragraph under the "Projects" `<h1>`. */
    lead: "Each entry states what it is, why it exists and what it is built from; where there's more to say, it links to the write-up.",
  },

  // ── Writing index (/writing) ────────────────────────────────────────
  writing: {
    /** `<meta name="description">`; a function because it embeds the live article count. */
    metaDescription: (total: number) =>
      `${total} articles on backend development, infrastructure and Linux.`,
  },
};
