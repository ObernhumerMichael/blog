// AD-12/ADR-0012, OD-17/ADR-0025. Build-time-only fetch against
// NOW_PANEL_URL with a 2s timeout, falling back to the committed
// now-fallback.json on any failure — network error, timeout, non-2xx, or a
// response that doesn't validate against nowFallbackSchema, one catch-all
// rather than a per-failure-mode branch, since every branch has the
// identical outcome. Reads the fallback file directly with node:fs, the
// same reasoning src/lib/load-content.ts gives for not going through
// `astro:content`: this needs to run under plain `node --test` too (7.2's
// own exit criterion), which can't resolve that virtual module.

import { readFileSync } from 'node:fs';
import { nowFallbackSchema, type NowPanelData } from '../content.schemas.ts';
import { NOW_PANEL_URL } from '../consts.ts';

const FALLBACK_PATH = 'src/content/site/now-fallback.json';

export async function getNowPanelData(): Promise<NowPanelData> {
  try {
    const res = await fetch(NOW_PANEL_URL, { signal: AbortSignal.timeout(2000) });
    if (!res.ok) throw new Error(`Now panel fetch failed: ${res.status}`);
    return nowFallbackSchema.parse(await res.json());
  } catch {
    return nowFallbackSchema.parse(JSON.parse(readFileSync(FALLBACK_PATH, 'utf8')));
  }
}
