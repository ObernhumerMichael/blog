// IMPLEMENTATION_PLAN.md §5.3, invariant 2: at most one `featured: true`
// per collection. Only `writing` has a `featured` field (§6's frontmatter
// table) — `projects` doesn't carry one, so there's nothing to check there.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCollection, WRITING_DIR } from './load.ts';
import { writingSchema } from '../../src/content.schemas.ts';

test('at most one featured writing entry', () => {
  const featured = loadCollection(WRITING_DIR, writingSchema).filter(
    (e) => e.data.featured,
  );
  assert.ok(
    featured.length <= 1,
    `more than one featured writing entry: ${featured.map((e) => e.file).join(', ')}`,
  );
});
