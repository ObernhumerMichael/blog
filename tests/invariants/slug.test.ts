// IMPLEMENTATION_PLAN.md §5.5 point 2 — the title → slug transform backing
// /writing/[slug].astro. Not a content invariant, but the same "logic easy
// to get subtly wrong" bar §5.8 applies to related.ts.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slugify } from '../../src/lib/slug.ts';

test('slugify kebab-cases and strips punctuation', () => {
  assert.equal(
    slugify('A reproducible homelab: what ansible-playbook actually guarantees'),
    'a-reproducible-homelab-what-ansible-playbook-actually-guarantees',
  );
});

test('slugify ASCII-folds diacritics', () => {
  assert.equal(slugify('Über Ärger'), 'uber-arger');
});

test('slugify has no leading, trailing, or doubled hyphens', () => {
  assert.equal(slugify('  --weird:: title--  '), 'weird-title');
});
