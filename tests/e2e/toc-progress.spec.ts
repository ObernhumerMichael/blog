import { test, expect, type Page } from '@playwright/test';

// Phase 5.6 exit criterion (IMPLEMENTATION_PLAN.md §5.6, AD-11): "scrolling
// the fixture article through its sections updates exactly one active TOC
// entry with no visible transition; `read n%` and the bar track scroll
// position at all three widths; still three islands total."
//
// /dev/fixtures/article is the only page with a real numbered-heading TOC
// (>=3 h2s) — same page copy.spec.ts and prose.spec.ts already use for the
// same reason (tests/e2e/pages.ts's own note).
const PAGE = '/dev/fixtures/article';

// Scrolls so `id`'s heading sits just above TocProgress.svelte's own
// activation line (25% down the viewport) — a plain `scrollIntoView` lands
// a heading at the very top (0%), which is also above the line and would
// work, but this pins the position precisely rather than relying on
// `scrollIntoView`'s own alignment rules.
async function scrollHeadingIntoBand(page: Page, id: string) {
  await page.evaluate((headingId) => {
    const el = document.getElementById(headingId);
    if (!el) throw new Error(`no heading #${headingId} on the page`);
    const rect = el.getBoundingClientRect();
    const target = window.scrollY + rect.top - window.innerHeight * 0.25;
    window.scrollTo(0, Math.max(0, target));
  }, id);
}

test('one TocProgress island on the article page', async ({ page }) => {
  await page.goto(PAGE);
  const islands = await page
    .locator('astro-island[component-url*="TocProgress"]')
    .count();
  expect(islands).toBe(1);
});

test('scrolling a section into view marks exactly one TOC entry active', async ({
  page,
}) => {
  await page.goto(PAGE);

  const ids = await page
    .locator('.prose [data-section-num]')
    .evaluateAll((els) => els.map((el) => el.id));
  expect(ids.length).toBeGreaterThan(2); // the fixture's own 8 h2s + h3s

  // Third heading, not the first: avoids the "nothing has crossed the band
  // yet" state right after load being indistinguishable from "the first
  // section is active" by coincidence.
  const targetId = ids[2];
  await scrollHeadingIntoBand(page, targetId);

  // Class presence, not visibility — ArticleToc.astro renders both the
  // wide and narrow disclosures unconditionally, and below 760 the narrow
  // one is a CLOSED `<details>` by default (§15), so its content is
  // legitimately not visible even with `.is-active` correctly applied.
  // Below 760 is exactly the width this repo's own breakpoint discipline
  // (§4.1/ADR-0016) puts outside the desktop/tablet-open TOC forms.
  await expect(page.locator(`.toc-item.is-active a[href="#${targetId}"]`)).toHaveCount(2);

  // At >=760 at least one of the two DOM copies is actually rendered open
  // and visible; below that, the assertion above is the whole story.
  if ((page.viewportSize()?.width ?? 0) >= 760) {
    await expect(
      page.locator(`.toc-item.is-active a[href="#${targetId}"]:visible`),
    ).toBeVisible();
  }

  // Exactly one entry active per rendered TOC variant (wide + narrow both
  // exist in the DOM; only one is visible per width, but both get the
  // class, so this counts within a single variant).
  const wideActive = await page.locator('.toc--wide .toc-item.is-active').count();
  const narrowActive = await page.locator('.toc--narrow .toc-item.is-active').count();
  expect(wideActive).toBeLessThanOrEqual(1);
  expect(narrowActive).toBeLessThanOrEqual(1);

  // Regression: the active entry must stay lit through the WHOLE section
  // body, not just while the heading line itself is on screen. Scroll
  // further down, into the middle of this section's body (well past the
  // heading, well before the next one) — an earlier IntersectionObserver-
  // based implementation went dark here, only ever lighting up while a
  // heading was inside its own thin observation band.
  await page.evaluate((headingId) => {
    const el = document.getElementById(headingId)!;
    window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top + 400);
  }, targetId);
  await expect(page.locator(`.toc-item.is-active a[href="#${targetId}"]`)).toHaveCount(2);

  // Scrolling on to a later section moves the active entry rather than
  // accumulating a second one.
  const laterId = ids[ids.length - 1];
  await scrollHeadingIntoBand(page, laterId);
  await expect(page.locator(`.toc-item.is-active a[href="#${targetId}"]`)).toHaveCount(0);
  await expect(page.locator(`.toc-item.is-active a[href="#${laterId}"]`)).toHaveCount(2);
  if ((page.viewportSize()?.width ?? 0) >= 760) {
    await expect(
      page.locator(`.toc-item.is-active a[href="#${laterId}"]:visible`),
    ).toBeVisible();
  }
});

test('reading progress tracks scroll position, in the aside at desktop and under the masthead below 1280', async ({
  page,
}) => {
  await page.goto(PAGE);
  const isDesktop = (page.viewportSize()?.width ?? 0) >= 1280;

  const asideProgress = page.locator('.aside .progress');
  const mastheadProgress = page.locator('header.masthead .reading-progress');

  if (isDesktop) {
    await expect(asideProgress).toBeVisible();
    await expect(mastheadProgress).toBeHidden();
  } else {
    await expect(asideProgress).toBeHidden();
    await expect(mastheadProgress).toBeVisible();
  }

  // At the top of the page, 0%.
  await expect(page.locator('[data-progress-text]').first()).toHaveText('0');

  // Scrolled to the bottom, ~100% — every `[data-progress-fill]` on the
  // page updates together, aside and masthead copies alike.
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(page.locator('[data-progress-text]').first()).toHaveText('100');

  const fillWidths = await page
    .locator('[data-progress-fill]')
    .evaluateAll((els) => els.map((el) => (el as HTMLElement).style.width));
  for (const width of fillWidths) {
    expect(width).toBe('100%');
  }
});
