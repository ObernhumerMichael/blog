// IMPLEMENTATION_PLAN.md §5.3, invariant 4: every tag used is in the
// registry (src/consts.ts's TAGS, Phase 5.2). `tags` only exists on
// `writing` entries.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCollection, WRITING_DIR } from './load.ts';
import { writingSchema } from '../../src/content.schemas.ts';
import { TAGS } from '../../src/consts.ts';

test('every writing tag is in the TAGS registry', () => {
  const registry = new Set<string>(TAGS);
  for (const entry of loadCollection(WRITING_DIR, writingSchema)) {
    for (const tag of entry.data.tags) {
      assert.ok(
        registry.has(tag),
        `${entry.file}: tag "${tag}" is not in TAGS (src/consts.ts)`,
      );
    }
  }
});
