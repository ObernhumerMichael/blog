import { test, expect } from '@playwright/test';

// 8.3 — T5's screenshot baseline (IMPLEMENTATION_PLAN.md §8.3, carried over
// from Phase 7.8's own unmet exit criterion). Separate file from
// chrome.spec.ts/prose.spec.ts on purpose (§8.3 point 2): this is the one
// T3/T5 file whose failure mode is "update the baseline", not "fix the
// code" — keeping it apart matches §8's own instruction that a deliberate
// design change updates baselines in the same reviewable commit as the
// change that caused them to move.
//
// One representative URL per page type — §0.3's original 7×3×2 = 42
// definition, not 8.1's broader stress-case matrix (a fixture is meant to
// look unusual; that's not what a visual-regression baseline is for).
// Slugs reuse docs/reference/'s own taxonomy verbatim (CLAUDE.md: "captured
// design screenshots per page type") rather than inventing a second one:
// the writing index sits under article/index (it's a reduction of the
// article page, §19.3), the projects index under projects/index.
const VISUAL_PAGES = [
  { slug: 'home', url: '/' },
  { slug: 'article/index', url: '/writing' },
  { slug: 'article', url: '/w/001' },
  { slug: 'projects/index', url: '/projects' },
  { slug: 'projects', url: '/projects/self-hosted-homelab-infrastructure-automation' },
  { slug: 'about', url: '/about' },
  { slug: '404', url: '/404' },
] as const;

for (const { slug, url } of VISUAL_PAGES) {
  test(`visual baseline — ${url}`, async ({ page }) => {
    await page.goto(url);
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

// 8.4: dev/specimen.astro's `current`/`disabled`/`draft` states are already
// prop-driven per component (ProjectItem's `forceMobile`, Tag's `current`
// variant, none of them pseudo-classes) — nothing to capture there beyond
// the page loads above. `:hover`/`:focus` are the two states nothing on the
// page forces yet; captured here via Playwright's own real
// `locator.hover()`/`.focus()` rather than a parallel `.force-hover` CSS
// class across twenty components (real pointer/focus events, no class a
// lint rule could satisfy that an event doesn't). `:active` is deliberately
// skipped — checked directly, no component's CSS gives it a rule `:hover`
// doesn't already share. Desktop only, both themes: the state itself is
// what's being proven, not layout at other widths (already covered above).
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
    await page.goto('/dev/specimen');
    await interact(page);
    const width = page.viewportSize()!.width;
    const theme = test.info().project.name.endsWith('dark') ? 'dark' : 'light';
    await expect(page).toHaveScreenshot([slug, `${width}-${theme}.png`], {
      fullPage: true,
      maxDiffPixelRatio: 0.001,
    });
  });
}
