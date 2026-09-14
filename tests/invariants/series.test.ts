// IMPLEMENTATION_PLAN.md §5.3, invariant 3: every `series.id` groups a
// contiguous 1…total with no duplicate `part`, and every member's `total`
// agrees. `series` only exists on `writing` entries.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCollection, WRITING_DIR } from './load.ts';
import { writingSchema } from '../../src/content.schemas.ts';

test('every series is contiguous, has no duplicate parts, and agrees on total', () => {
  const entries = loadCollection(WRITING_DIR, writingSchema).filter((e) => e.data.series);

  const bySeries = new Map<string, typeof entries>();
  for (const entry of entries) {
    const id = entry.data.series!.id;
    bySeries.set(id, [...(bySeries.get(id) ?? []), entry]);
  }

  for (const [id, members] of bySeries) {
    const totals = new Set(members.map((e) => e.data.series!.total));
    assert.equal(
      totals.size,
      1,
      `series "${id}": members disagree on total (${[...totals]})`,
    );

    const [total] = totals;
    const parts = members.map((e) => e.data.series!.part).sort((a, b) => a - b);
    const dupes = parts.filter((p, i) => parts.indexOf(p) !== i);
    assert.deepEqual(
      [...new Set(dupes)],
      [],
      `series "${id}": duplicate part(s) ${dupes.join(', ')}`,
    );
    assert.deepEqual(
      parts,
      Array.from({ length: total }, (_, i) => i + 1),
      `series "${id}": parts ${JSON.stringify(parts)} don't cover 1…${total}`,
    );
  }
});
