// Shared file-system loader for the two content collections, read directly
// with node:fs + gray-matter rather than through `astro:content` — that
// virtual module only resolves inside Astro's own Vite pipeline (Finding B,
// IMPLEMENTATION_PLAN.md §5.10), which neither `node --test` (§5.3) nor
// astro.config.mjs itself (evaluated before the content layer exists) can
// reach. Originally §5.3's test-only helper; astro.config.mjs's sitemap
// filter (5.10) needs the same file list, so it lives here instead of under
// tests/.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import matter from 'gray-matter';
import type { z } from 'astro/zod';

export const WRITING_DIR = 'src/content/writing';
export const PROJECTS_DIR = 'src/content/projects';

export interface LoadedEntry<T> {
  file: string;
  data: T;
  body: string;
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (extname(full) === '.md' || extname(full) === '.mdx') out.push(full);
  }
  return out;
}

// Throws on the first invalid entry, naming the offending file — this is a
// build gate (T1), not a report; a schema failure here means the real
// Astro build would also fail once it reaches the content layer.
export function loadCollection<T extends z.ZodTypeAny>(
  dir: string,
  schema: T,
): LoadedEntry<z.infer<T>>[] {
  return walk(dir).map((file) => {
    const { data, content } = matter(readFileSync(file, 'utf8'));
    const result = schema.safeParse(data);
    if (!result.success) {
      throw new Error(`${file}: ${result.error.message}`);
    }
    return { file, data: result.data, body: content };
  });
}
