// IMPLEMENTATION_PLAN.md §5.3, invariant 2: at most one `featured: true`
// writing entry (the blog index's single featured-entry band, §19.2). OD-16
// / ADR-0024 extends this to `projects`: at most three, matching the
// homepage's three-slot Selected-work band (§19.1) rather than the
// single-slot cap `writing`'s own UI needs.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCollection, WRITING_DIR, PROJECTS_DIR } from './load.ts';
import { writingSchema, projectsSchema } from '../../src/content.schemas.ts';

test('at most one featured writing entry', () => {
  const featured = loadCollection(WRITING_DIR, writingSchema).filter(
    (e) => e.data.featured,
  );
  assert.ok(
    featured.length <= 1,
    `more than one featured writing entry: ${featured.map((e) => e.file).join(', ')}`,
  );
});

test('at most three featured projects', () => {
  const featured = loadCollection(PROJECTS_DIR, projectsSchema).filter(
    (e) => e.data.featured,
  );
  assert.ok(
    featured.length <= 3,
    `more than three featured projects: ${featured.map((e) => e.file).join(', ')}`,
  );
});
