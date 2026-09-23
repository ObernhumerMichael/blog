// IMPLEMENTATION_PLAN.md §5.3, invariant 5: every internal link in prose
// resolves to a real route. Links live in the Markdown body, not
// frontmatter, so this walks the raw body with a regex for `](/...)`-shaped
// targets rather than a full Markdown parse (the body is trusted authored
// content, not user input — a real parse is overkill for "does this path
// exist as a file/route").

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { loadCollection, WRITING_DIR, PROJECTS_DIR } from './load.ts';
import { writingSchema, projectsSchema } from '../../src/content.schemas.ts';
import { staticPageRoutes, writingRoute } from './routes.ts';

// Matches both `[text](/path)` and `![alt](/path)` — an absolute internal
// target starting with `/`. Fragment/query stripped before lookup. A target
// may be a route or a file served from public/ (MARKDOWN_SYNTAX.md: absolute
// diagram paths are the ones that get tap-to-full-size).
const INTERNAL_LINK = /\]\((\/[^)\s]*)\)/g;

function internalLinks(body: string): string[] {
  return [...body.matchAll(INTERNAL_LINK)].map((m) => m[1].split(/[#?]/)[0]);
}

test('every internal link in prose resolves to a real route', () => {
  const writing = loadCollection(WRITING_DIR, writingSchema);
  const projects = loadCollection(PROJECTS_DIR, projectsSchema);

  const validRoutes = staticPageRoutes();
  for (const entry of writing) validRoutes.add(writingRoute(entry.data.number));

  for (const entry of [...writing, ...projects]) {
    for (const link of internalLinks(entry.body)) {
      assert.ok(
        validRoutes.has(link) || existsSync(join('public', link)),
        `${entry.file}: internal link "${link}" has no matching route`,
      );
    }
  }
});
