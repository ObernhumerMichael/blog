// IMPLEMENTATION_PLAN.md 7.2 exit criterion: prove the fallback is used
// when the fetch promise rejects, without a real network call in CI. Global
// `fetch` is stubbed and restored per test — NOW_PANEL_URL is a `.invalid`
// placeholder that would fail DNS on its own, but the test must not depend
// on that timing.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getNowPanelData } from '../../src/lib/now.ts';
import { nowFallbackSchema } from '../../src/content.schemas.ts';

function stubFetch(impl: typeof fetch) {
  const original = globalThis.fetch;
  globalThis.fetch = impl;
  return () => {
    globalThis.fetch = original;
  };
}

test('falls back to the committed file when the fetch rejects', async () => {
  const restore = stubFetch(async () => {
    throw new Error('simulated network failure');
  });
  try {
    const fallback = nowFallbackSchema.parse(
      JSON.parse(readFileSync('src/content/site/now-fallback.json', 'utf8')),
    );
    assert.deepEqual(await getNowPanelData(), fallback);
  } finally {
    restore();
  }
});

test('falls back when the response is not ok', async () => {
  const restore = stubFetch(async () => new Response('', { status: 500 }));
  try {
    const data = await getNowPanelData();
    assert.equal(data.uptimeDays, 214);
  } finally {
    restore();
  }
});

test('falls back when the response fails schema validation', async () => {
  const restore = stubFetch(async () => new Response(JSON.stringify({ bogus: true })));
  try {
    const data = await getNowPanelData();
    assert.equal(data.servicesOk, 11);
  } finally {
    restore();
  }
});

test('uses the live response when it validates', async () => {
  const live = { uptimeDays: 1, servicesOk: 12, lastDeploy: '2026-09-01' };
  const restore = stubFetch(async () => new Response(JSON.stringify(live)));
  try {
    const data = await getNowPanelData();
    assert.equal(data.uptimeDays, 1);
    assert.equal(data.servicesOk, 12);
  } finally {
    restore();
  }
});
