// Content Collection schemas.
//
// NOTE — location matters: Astro 5+ requires this file at `src/content.config.ts`
// (project-root-adjacent to src/pages), NOT `src/content/config.ts`. That's a
// change from older Astro Content Collections docs/tutorials; verified against
// the installed Astro 7.2.6 by running a real build (Phase 0 scaffold), not
// assumed from memory. Each collection also now requires an explicit `loader`
// rather than an implicit `type: 'content'`.
//
// AD-03: exactly two collections — `writing` and `projects` — not three.
// There is no separate `ctf` collection: CTF writeups are `writing` entries
// tagged `#ctf` (OD-02). This keeps the single monotonic article-numbering
// invariant in DESIGN_SYSTEM.md §19.9 intact.
//
// Real Zod schemas, per IMPLEMENTATION_PLAN.md §5.1. Cross-entry invariants
// (unique numbering, tag registry membership, series contiguity, etc.) are
// §5.3's job, run separately against the raw Markdown files — not here.

import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

// §5.1 point 4: not stated anywhere in DESIGN_SYSTEM.md as a closed set
// beyond the worked examples — treated as closed anyway, same drift-
// prevention reasoning as CODE_LANGS/TAGS. Extend the first time a real
// article needs a section that isn't here yet.
const SECTIONS = ['Infrastructure', 'Security'] as const;

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z
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
      tags: z.array(z.string()).min(1).max(3),
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
    ),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
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
      article: z.url().optional(),
      source: z.url().optional(),
    }),
    // Required-when-source-is-missing is a §5.3 invariant, not a schema
    // shape rule — a named test gives a better message than superRefine.
    sourceAbsence: z.string().optional(),
  }),
});

export const collections = { writing, projects };
