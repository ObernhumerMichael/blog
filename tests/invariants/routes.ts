// Route helper for the internal-link invariant (§5.3, check 5). Two
// sources of valid routes:
//   - every real file under src/pages, converted from file path to URL —
//     no dynamic ([num].astro-style) routes exist yet, so this is a plain
//     path conversion, not a param-aware router.
//   - `/w/<padded number>` per writing entry, per AD-10's decided permalink
//     pattern — a naming rule, not a lookup against /w/[num].astro, which
//     Phase 5.4 hasn't built yet.
// `projects` has no decided permalink pattern yet (its slug field is a
// Phase 6 concern), so no collection-derived routes are added for it here.

import { readdirSync, statSync } from 'node:fs';
import { join, extname, sep } from 'node:path';

const PAGES_DIR = 'src/pages';
const PAGE_EXT = new Set(['.astro', '.md', '.mdx']);

function walkPages(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walkPages(full));
    else if (PAGE_EXT.has(extname(full))) out.push(full);
  }
  return out;
}

export function staticPageRoutes(): Set<string> {
  const routes = new Set<string>();
  for (const file of walkPages(PAGES_DIR)) {
    const rel = file.slice(PAGES_DIR.length + 1).replace(/\.(astro|md|mdx)$/, '');
    const segments = rel.split(sep).filter((s) => s !== 'index');
    routes.add('/' + segments.join('/'));
  }
  return routes;
}

export function writingRoute(number: number): string {
  return `/w/${String(number).padStart(3, '0')}`;
}
