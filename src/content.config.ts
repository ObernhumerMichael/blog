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
// The actual Zod schemas live in content.schemas.ts, not here — §5.3's
// content invariant tests need to import them without going through the
// `astro:content` virtual module this file depends on. See that file's
// header comment.
//
// Cross-entry invariants (unique numbering, tag registry membership, series
// contiguity, etc.) are §5.3's job, run separately against the raw Markdown
// files — not here.

import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { writingSchema, projectsSchema } from './content.schemas.ts';

const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: writingSchema,
});

const projects = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/projects' }),
  schema: projectsSchema,
});

export const collections = { writing, projects };
