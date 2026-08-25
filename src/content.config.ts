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
// Real Zod schemas land in Phase 5 (IMPLEMENTATION_PLAN.md §6: field table,
// cross-entry invariants). This stub exists now so the directory structure
// is real and the build has something valid to check against from Phase 0
// onward, rather than an empty file nothing imports.

import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    // TODO Phase 5 — full schema per IMPLEMENTATION_PLAN.md §6:
    // number, title, lead, section, date, updated?, tags, series?,
    // featured?, draft.
    title: z.string(),
    draft: z.boolean().default(true),
  }),
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: z.object({
    // TODO Phase 5 — full schema per IMPLEMENTATION_PLAN.md §6:
    // number, title, description, why?, stack, status, period,
    // caseStudy, links, sourceAbsence?.
    title: z.string(),
    draft: z.boolean().default(true),
  }),
});

export const collections = { writing, projects };
