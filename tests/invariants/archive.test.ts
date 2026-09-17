// IMPLEMENTATION_PLAN.md 6.5 point 3 — year-band grouping (descending by
// year, newest-first within a year) and per-tag counts for the Writing
// index's filter row. Same "logic easy to get subtly wrong" bar
// related.test.ts already sets for findRelated.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupByYear, countTags } from '../../src/lib/archive.ts';

function entry(date: string, tags: string[] = []) {
  return { date: new Date(date), tags };
}

test('groups entries by calendar year', () => {
  const groups = groupByYear([
    entry('2026-01-01'),
    entry('2024-06-01'),
    entry('2026-06-01'),
  ]);

  assert.deepEqual(
    groups.map((g) => g.year),
    [2026, 2024],
  );
  assert.deepEqual(
    groups.map((g) => g.count),
    [2, 1],
  );
});

test('sorts groups descending by year', () => {
  const groups = groupByYear([
    entry('2023-01-01'),
    entry('2025-01-01'),
    entry('2024-01-01'),
  ]);

  assert.deepEqual(
    groups.map((g) => g.year),
    [2025, 2024, 2023],
  );
});

test('sorts entries within a year newest-first', () => {
  const groups = groupByYear([
    entry('2026-01-01'),
    entry('2026-09-01'),
    entry('2026-05-01'),
  ]);

  assert.deepEqual(
    groups[0].entries.map((e) => e.date.toISOString().slice(0, 10)),
    ['2026-09-01', '2026-05-01', '2026-01-01'],
  );
});

test('countTags counts every occurrence across entries', () => {
  const counts = countTags([
    entry('2026-01-01', ['ansible', 'homelab']),
    entry('2026-01-02', ['ansible']),
    entry('2026-01-03', ['ctf']),
  ]);

  assert.equal(counts.get('ansible'), 2);
  assert.equal(counts.get('homelab'), 1);
  assert.equal(counts.get('ctf'), 1);
  assert.equal(counts.get('security'), undefined);
});
