// The two collection schemas, split out from content.config.ts so 5.3's
// invariant tests can import them directly. content.config.ts itself has to
// import `defineCollection` from the virtual module `astro:content`, which
// only resolves inside Astro's Vite pipeline — a plain `node:test` run
// outside that pipeline can't import that file at all. A Zod schema built
// only from `astro/zod` (a real package export) has no such problem.
//
// IMPLEMENTATION_PLAN.md §5.1.

import { z } from 'astro/zod';

// §5.1 point 4: not stated anywhere in DESIGN_SYSTEM.md as a closed set
// beyond the worked examples — treated as closed anyway, same drift-
// prevention reasoning as CODE_LANGS/TAGS. Extend the first time a real
// article needs a section that isn't here yet.
const SECTIONS = ['Infrastructure', 'Security'] as const;

export const writingSchema = z
  .object({
    number: z.number().int().min(1).max(999),
    title: z.string(),
    // §21.1: the lead is never two paragraphs.
    lead: z.string().refine((s) => !s.includes('\n\n'), {
      message: 'lead must be a single paragraph (no blank line)',
    }),
    section: z.enum(SECTIONS),
    date: z.coerce.date(),
    updated: z.coerce.date().optional(),
    // §21.2: "eight has been tested and survives at 390" is the enforced
    // ceiling; three is the editorial target stated in the same sentence,
    // not a hard limit — Phase 6 Finding A corrects the schema, which had
    // enforced the guideline as if it were the ceiling.
    tags: z.array(z.string()).min(1).max(8),
    series: z
      .object({
        // Finding D: a stable slug-shaped grouping key, separate from
        // the display `name` — invariant 3 groups by this, not by name.
        id: z.string(),
        name: z.string(),
        part: z.number().int(),
        total: z.number().int(),
      })
      .refine((s) => s.part <= s.total, {
        message: 'series.part must be <= series.total',
      })
      .optional(),
    featured: z.boolean().optional(),
    // OD-03 "drafts exempt": default stays true so a forgotten `draft:`
    // line fails closed, not silently publishes.
    draft: z.boolean().default(true),
  })
  .refine(
    (e) => !e.updated || e.updated.getTime() > e.date.getTime() + 24 * 60 * 60 * 1000,
    { message: 'updated must be more than a day after date', path: ['updated'] },
  );

export const projectsSchema = z.object({
  number: z.number().int().min(1).max(99),
  title: z.string(),
  // 58ch guidance, not enforced — a Zod max would fight real titles the
  // design's own "wraps to three lines" rule already accepts.
  description: z.string(),
  why: z.string().optional(),
  stack: z.array(z.string()).min(3).max(6),
  status: z.enum(['active', 'maintained', 'paused', 'archived']),
  period: z.object({
    from: z.coerce.date(),
    to: z.coerce.date().nullable(),
  }),
  caseStudy: z.boolean(),
  links: z.object({
    // Not `z.url()` (ADR-0022, OD-14): the primary link's href doubles as
    // whatever `links.article` holds, which is sometimes an internal route
    // rather than an external URL (`/writing/tag/ctf`, `browse 28 →`) — a
    // real `z.url()` rejects a path with no scheme.
    article: z.string().optional(),
    source: z.url().optional(),
    // ADR-0022 (OD-14): a live demo and a written case study are
    // independent things a project can have.
    demo: z.url().optional(),
    // ADR-0022 (OD-14): the primary link's label is content, not a fixed
    // "case study →" string — component 07 derives that default only when
    // this is absent.
    primaryLabel: z.string().optional(),
  }),
  // Required-when-source-is-missing is a §5.3 invariant, not a schema
  // shape rule — a named test gives a better message than superRefine.
  sourceAbsence: z.string().optional(),
  // OD-16 / ADR-0024: mirrors `writing`'s own `featured` field exactly.
  // Capped at three (not one) by tests/invariants/featured.test.ts, to
  // match the homepage's three-slot Selected-work band (§19.1).
  featured: z.boolean().optional(),
  // ADR-0023 (OD-15): default false, unlike `writing`'s default-true —
  // writing's "drafts exempt, fail closed" was guarding against a forgotten
  // flag silently publishing unready prose; a project's forgotten flag
  // would silently withhold one that's actually fine to ship, so the
  // fail-safe direction is reversed here.
  draft: z.boolean().default(false),
});

export type WritingEntry = z.infer<typeof writingSchema>;
export type ProjectEntry = z.infer<typeof projectsSchema>;

// The `site` data collection (7.1, AD-03's own collections table, Finding
// A). Four files, four unrelated shapes — one schema per file rather than
// forcing a union member into an object wrapper it doesn't need. Each is
// still a first draft (same "worth a real pass before launch" status as
// consts.ts's AUTHOR_BIO), not a structural placeholder like GITHUB_URL.

// About §19.6 point 3: "150px mono period track (`2024 — now`) beside a
// role title ... and a description." `period` is the literal display
// string, not a date range — the row never computes it (unlike
// ProjectItem's `periodText`), because the design's own worked example is
// already exactly the rendered text.
export const experienceSchema = z.array(
  z.object({
    period: z.string(),
    role: z.string(),
    description: z.string(),
  }),
);

// About §19.6 point 4: "a four-column grid of LABEL over value ... Email ·
// Code · Social · Keys." `href` is optional so an entry can state an
// absence (§21.2: "absence is stated, not omitted") rather than link
// nowhere.
export const elsewhereSchema = z.array(
  z.object({
    label: z.string(),
    value: z.string(),
    href: z.string().optional(),
  }),
);

// Homepage §19.1 / About §19.6: "one middot-joined line" — stored as an
// array (6–10 items, §21.1) and joined with middots at render time, not
// pre-joined, so the render side owns the separator.
export const interestsSchema = z.array(z.string());

// OD-17 / ADR-0025: the Now panel's committed fallback — §19.1's own
// worked numbers (`homelab uptime 214 d`, `11 services ok`,
// `last deploy 2026-08-19`). Raw values, not pre-formatted strings — the
// Now panel owns the "uptime ___ d" / "___ services ok" phrasing, the same
// division of labour as ProjectItem's `periodText`. This is also the shape
// the live endpoint's own response is validated against (src/lib/now.ts) —
// one schema, whichever source produced the data.
export const nowFallbackSchema = z.object({
  uptimeDays: z.number().int().min(0),
  servicesOk: z.number().int().min(0),
  lastDeploy: z.coerce.date(),
});

// The `site` collection's own schema: whichever of the four shapes above,
// keyed by the entry `id` Astro's glob loader derives from each filename
// (`experience`, `elsewhere`, `interests`, `now-fallback`) — Astro's
// `schema` option is one validator for the whole collection, not one per
// entry, so a union is the direct fit for four files this different in
// shape rather than four separate collections (AD-03's table names exactly
// one `site` collection).
export const siteSchema = z.union([
  experienceSchema,
  elsewhereSchema,
  interestsSchema,
  nowFallbackSchema,
]);

export type ExperienceEntry = z.infer<typeof experienceSchema>[number];
export type ElsewhereEntry = z.infer<typeof elsewhereSchema>[number];
export type NowPanelData = z.infer<typeof nowFallbackSchema>;
