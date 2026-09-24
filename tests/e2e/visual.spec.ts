import { test, expect } from '@playwright/test';

// 8.3/8.4 — T5's screenshot baseline, narrowed to dev/specimen.astro by
// ADR-0026: real pages' baselines tracked content (every article edit or
// new entry moved them), not design. The specimen page's content is fixed
// and renders every component, so a diff here is a design change — update
// the baseline in the same commit as that change (§8's reviewable diff).
//
// `current`/`disabled`/`draft` states are already prop-driven per component
// (ProjectItem's `forceMobile`, Tag's `current` variant, none of them
// pseudo-classes) — a plain page load covers them. `:hover`/`:focus` are the
// two states nothing on the page forces; captured here via Playwright's own
// real `locator.hover()`/`.focus()` rather than a parallel `.force-hover` CSS
// class across twenty components (real pointer/focus events, no class a
// lint rule could satisfy that an event doesn't). `:active` is deliberately
// skipped — checked directly, no component's CSS gives it a rule `:hover`
// doesn't already share. Desktop only, both themes: layout at other widths
// is chrome.spec.ts/prose.spec.ts's job.
const SPECIMEN_STATES = [
  {
    slug: 'specimen/hover',
    interact: (page: import('@playwright/test').Page) =>
      page.locator('.row-list .row').first().hover(),
  },
  {
    slug: 'specimen/focus',
    interact: (page: import('@playwright/test').Page) =>
      page.locator('#focus-demo').focus(),
  },
] as const;

for (const { slug, interact } of SPECIMEN_STATES) {
  test(`visual baseline — /dev/specimen (${slug})`, async ({ page }) => {
    test.skip(
      !test.info().project.name.startsWith('desktop-'),
      'desktop only, see header',
    );
    // networkidle, not `load`: under `astro dev` the islands' modules and
    // their injected CSS keep arriving after `load`, racing the capture.
    await page.goto('/dev/specimen', { waitUntil: 'networkidle' });
    await interact(page);
    const width = page.viewportSize()!.width;
    const theme = test.info().project.name.endsWith('dark') ? 'dark' : 'light';
    // ~0.1% per §8's own table — anti-aliasing headroom, not a licence to
    // ignore a real regression.
    await expect(page).toHaveScreenshot([slug, `${width}-${theme}.png`], {
      fullPage: true,
      maxDiffPixelRatio: 0.001,
    });
  });
}
