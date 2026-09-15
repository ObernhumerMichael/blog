// IMPLEMENTATION_PLAN.md §5.8 point 3 — tag-overlap count, ties broken by
// same section then recency, top four. Same "logic easy to get subtly
// wrong" bar as slug.test.ts (§5.8's own header comment names this exact
// file as the one piece of the sub-phase that earns it).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  findRelated,
  RELATED_COUNT,
  type RelatableEntry,
} from '../../src/lib/related.ts';

function entry(
  number: number,
  tags: string[],
  section: string,
  date: string,
): RelatableEntry {
  return { number, tags, section, date: new Date(date) };
}

test('ranks by tag-overlap count first', () => {
  const current = entry(
    10,
    ['ansible', 'homelab', 'infrastructure'],
    'Infrastructure',
    '2026-01-01',
  );
  const oneTag = entry(1, ['ansible'], 'Infrastructure', '2026-01-01');
  const twoTags = entry(2, ['ansible', 'homelab'], 'Infrastructure', '2026-01-01');

  const result = findRelated(current, [oneTag, twoTags]);

  assert.deepEqual(
    result.map((e) => e.number),
    [2, 1],
  );
});

test('breaks a tag-overlap tie by matching section', () => {
  const current = entry(10, ['ctf'], 'Security', '2026-01-01');
  const sameSection = entry(1, ['ctf'], 'Security', '2026-01-01');
  const otherSection = entry(2, ['ctf'], 'Infrastructure', '2026-01-01');

  const result = findRelated(current, [otherSection, sameSection]);

  assert.deepEqual(
    result.map((e) => e.number),
    [1, 2],
  );
});

test('breaks a remaining tie by recency', () => {
  const current = entry(10, ['ctf'], 'Security', '2026-01-01');
  const older = entry(1, ['ctf'], 'Security', '2026-01-01');
  const newer = entry(2, ['ctf'], 'Security', '2026-06-01');

  const result = findRelated(current, [older, newer]);

  assert.deepEqual(
    result.map((e) => e.number),
    [2, 1],
  );
});

test('excludes the current entry and anything with zero tag overlap', () => {
  const current = entry(10, ['ansible'], 'Infrastructure', '2026-01-01');
  const self = entry(10, ['ansible'], 'Infrastructure', '2026-01-01');
  const noOverlap = entry(3, ['ctf'], 'Security', '2026-01-01');

  assert.deepEqual(findRelated(current, [self, noOverlap]), []);
});

test('caps at RELATED_COUNT entries', () => {
  const current = entry(0, ['ansible'], 'Infrastructure', '2026-01-01');
  const candidates = Array.from({ length: RELATED_COUNT + 3 }, (_, i) =>
    entry(
      i + 1,
      ['ansible'],
      'Infrastructure',
      `2026-01-${String(i + 1).padStart(2, '0')}`,
    ),
  );

  assert.equal(findRelated(current, candidates).length, RELATED_COUNT);
});
