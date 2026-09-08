import { test, expect, type Page } from '@playwright/test';

// 2.7 — bringing T3 checks 1, 4, 5 forward (IMPLEMENTATION_PLAN.md §2.7).
// Targets /dev/layout-check: the only page currently wired to BaseLayout,
// so the only place the real Masthead/Footer/mobile-menu chrome renders.
//
// Element enumeration uses page.evaluate + native querySelectorAll rather
// than Playwright's own $$/$$eval: Playwright's selector engine pierces
// open shadow roots by design, which picks up Astro's dev-toolbar overlay
// (<astro-dev-toolbar>, injected by `astro dev` on every page) as if it
// were page content. Native querySelectorAll doesn't cross shadow
// boundaries, so the toolbar's shadow-DOM children are excluded for free.

const PAGE = '/dev/layout-check';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

test('no horizontal page scroll', async ({ page }) => {
  await page.goto(PAGE);
  const overflows = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
  );
  expect(overflows).toBe(false);
});

test('touch targets: controls ≥44px, menu rows ≥48px, at 390', async ({ page }) => {
  test.skip(page.viewportSize()?.width !== 390, 'only meaningful at mobile width');

  await page.goto(PAGE);
  await page.click('.menu-trigger');
  // Assertion-based wait, not a fixed sleep: the dev server compiles routes
  // on demand, so the island's hydration time varies (fast once Vite's
  // cache is warm, much slower on a cold first hit) — a fixed timeout was
  // observed to race and miss the panel on a cold compile.
  await expect(page.locator('.menu-trigger')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.menu-row').first()).toBeVisible();

  // Scoped to controls (<button>), not plain <a> links: the wordmark and
  // footer links are real, already-shipped text links well under 44px, and
  // §7.3's own exit criterion ("every control clears 44px") is narrower
  // than §18.5's general wording. That link-sizing gap is a known, deferred
  // item for full T3 in Phase 8 — not this check's job.
  const controls = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll(
        'header button:not([disabled]), footer button:not([disabled])',
      ),
    )
      .filter((el) => el.getClientRects().length > 0)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { cls: el.className, w: r.width, h: r.height };
      }),
  );
  expect(controls.length).toBeGreaterThan(0);
  for (const c of controls) {
    expect(c.w, `"${c.cls}" width`).toBeGreaterThanOrEqual(44);
    expect(c.h, `"${c.cls}" height`).toBeGreaterThanOrEqual(44);
  }

  const rowHeights = await page.evaluate(() =>
    Array.from(document.querySelectorAll('header .menu-row')).map(
      (el) => el.getBoundingClientRect().height,
    ),
  );
  expect(rowHeights.length).toBeGreaterThan(0);
  for (const h of rowHeights) {
    expect(h).toBeGreaterThanOrEqual(48);
  }
});

async function countFocusable(page: Page) {
  return page.evaluate(
    (sel) =>
      Array.from(document.querySelectorAll(sel)).filter(
        (el) => el.getClientRects().length > 0,
      ).length,
    FOCUSABLE,
  );
}

async function tabAndAssertRing(page: Page, stop: number) {
  await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => {
    const el = document.activeElement as Element;
    const cs = getComputedStyle(el);
    return { style: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
  });
  expect(ring.style, `tab stop ${stop}`).not.toBe('none');
  expect(ring.width, `tab stop ${stop}`).toBeGreaterThan(0);
}

test('focus ring is visible on every focusable element', async ({ page }) => {
  await page.goto(PAGE);

  // Unscoped: base.css's :focus-visible rule is unconditional — no stated
  // exception for any element — so this deliberately also exercises the
  // skip link and the diagnostic page's own controls, not just
  // Masthead/Footer.
  if (page.viewportSize()?.width !== 390) {
    const count = await countFocusable(page);
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await tabAndAssertRing(page, i + 1);
    }
    return;
  }

  // At 390, the panel's links/theme-control only exist in the DOM once
  // open, inserted in document order right where .menu-trigger sits — not
  // appended at the end — so opening it partway through a single pass only
  // works if we know exactly which tab stop it is: its 0-based index among
  // closed-state focusables. Tab there for real, verifying the ring at
  // every stop including the trigger itself, then click that
  // *already-focused* trigger to open it. Clicking an element that already
  // holds keyboard focus fires a real click without moving focus anywhere
  // — confirmed directly — so Tab's own sequence anchor stays exactly where
  // it was and the rest of the (now-open) tab order continues correctly.
  //
  // Two things this deliberately avoids, both confirmed as real problems:
  // page.click() as the FIRST touch on the trigger jumps focus straight to
  // it, desyncing Tab's anchor from a count computed beforehand — the loop
  // then overshoots past the last real element into Astro's dev-toolbar
  // custom element (Tab-reachable via a JS `tabIndex` property, invisible
  // to the selector-based count here). And pressing Enter/Space on the
  // trigger via the keyboard, rather than clicking it, doesn't reliably
  // fire a click in this headless engine once a page.evaluate() call has
  // happened in between — an engine quirk, not a real accessibility gap.
  const triggerIndex = await page.evaluate((sel) => {
    const list = Array.from(document.querySelectorAll(sel)).filter(
      (el) => el.getClientRects().length > 0,
    );
    return list.indexOf(document.querySelector('.menu-trigger')!);
  }, FOCUSABLE);
  expect(triggerIndex).toBeGreaterThanOrEqual(0);

  for (let i = 0; i <= triggerIndex; i++) {
    await tabAndAssertRing(page, i + 1);
  }
  await page.click('.menu-trigger');
  await expect(page.locator('.menu-trigger')).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.menu-row').first()).toBeVisible();

  const totalCount = await countFocusable(page);
  for (let i = triggerIndex + 1; i < totalCount; i++) {
    await tabAndAssertRing(page, i + 1);
  }
});
