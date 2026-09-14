// IMPLEMENTATION_PLAN.md §5.3, invariant 1: numbers unique and contiguous
// from 1, per collection, including drafts — a draft occupies its number
// the moment it's authored (5.0's resolved note).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCollection, WRITING_DIR, PROJECTS_DIR } from './load.ts';
import { writingSchema, projectsSchema } from '../../src/content.schemas.ts';

function assertContiguous(numbers: number[]) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const dupes = sorted.filter((n, i) => sorted.indexOf(n) !== i);
  assert.deepEqual([...new Set(dupes)], [], `duplicate number(s): ${dupes.join(', ')}`);
  sorted.forEach((n, i) => {
    assert.equal(n, i + 1, `numbering gap: expected ${i + 1}, found ${n}`);
  });
}

test('writing numbers are unique and contiguous from 1', () => {
  const entries = loadCollection(WRITING_DIR, writingSchema);
  assertContiguous(entries.map((e) => e.data.number));
});

test('projects numbers are unique and contiguous from 1', () => {
  const entries = loadCollection(PROJECTS_DIR, projectsSchema);
  assertContiguous(entries.map((e) => e.data.number));
});
