// IMPLEMENTATION_PLAN.md §5.3, invariant 6: `sourceAbsence` is present
// whenever `links.source` is absent — `projects` only (§11.1: absence must
// be stated, e.g. "client work · no source").

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadCollection, PROJECTS_DIR } from './load.ts';
import { projectsSchema } from '../../src/content.schemas.ts';

test('every project without links.source states sourceAbsence', () => {
  for (const entry of loadCollection(PROJECTS_DIR, projectsSchema)) {
    if (!entry.data.links.source) {
      assert.ok(
        entry.data.sourceAbsence,
        `${entry.file}: no links.source and no sourceAbsence stating why (§11.1)`,
      );
    }
  }
});
