// Shared loader for the content invariant tests (IMPLEMENTATION_PLAN.md
// §5.3). Reads Markdown files directly with node:fs + gray-matter and
// validates frontmatter against the real Zod schemas from
// src/content.schemas.ts — not `astro:content`, which is a Vite virtual
// module `node --test` can't import. See that file's header comment.

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

// Throws on the first invalid entry, naming the offending file — this
// suite is a build gate (T1), not a report; a schema failure here means the
// real Astro build would also fail once it reaches the content layer.
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
