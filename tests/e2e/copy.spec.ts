import { test, expect } from '@playwright/test';

// Phase 4.4 exit criterion (IMPLEMENTATION_PLAN.md §4.4, ADR-0020): "copy
// works from every block on the page with one island in the bundle; with
// JS disabled no control is shown; the label change is announced".
//
// /dev/fixtures/article is the only page with real code blocks (four
// non-terminal fences plus one ```terminal — see tests/e2e/pages.ts's own
// note on why prose.spec.ts scopes the same way). Clipboard permissions
// have to be granted explicitly: Playwright's Chromium starts every
// context with no clipboard access at all, and CodeCopy.svelte's
// `navigator.clipboard.writeText` would otherwise exercise the `failed`
// path (a real rejection) rather than the `copied` one this file means to
// test.
test.use({ permissions: ['clipboard-read', 'clipboard-write'] });

const PAGE = '/dev/fixtures/article';

test('copy control stays hidden with JS disabled', async ({ browser }) => {
  // A dedicated JS-disabled context, not `page.context()` — the shared
  // `browser` fixture lets this one test opt out of the permissions grant
  // above too, which needs Chrome's permissions API (unavailable without
  // JS anyway) and would otherwise throw setting up a context that can
  // never use it.
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(PAGE);

  const buttons = page.locator('[data-copy]');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await expect(buttons.nth(i)).toBeHidden();
  }

  await context.close();
});

test('copy control reveals on hydration, once, for every code block', async ({
  page,
}) => {
  await page.goto(PAGE);

  const buttons = page.locator('.code-block .code-block__copy');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0); // the fixture's four non-terminal fences

  for (let i = 0; i < count; i++) {
    await expect(buttons.nth(i)).toBeVisible();
  }

  // Terminal fences (§23.4) get no copy control at all — not a hidden
  // one, none.
  expect(await page.locator('.term-block [data-copy]').count()).toBe(0);

  // ADR-0020: one delegating island regardless of block count.
  const islands = await page.locator('astro-island[component-url*="CodeCopy"]').count();
  expect(islands).toBe(1);
});

test('activating the control copies the block text and announces it', async ({
  page,
}) => {
  await page.goto(PAGE);

  const block = page.locator('.code-block').first();
  const button = block.locator('.code-block__copy');
  // `.textContent()`, not `.innerText()` — CodeCopy.svelte reads
  // `pre code`'s `textContent` (ADR-0020), and this fence has genuine
  // blank lines between YAML list items that `innerText()`'s rendered-text
  // approximation collapses. `textContent` is also the correct baseline on
  // the merits: §13.2 calls the code area "verbatim machine content", and
  // a diff that drops blank lines on copy would be a real bug, not a test
  // artifact.
  const expected = await block.locator('pre code').textContent();

  await button.click();

  await expect(button).toHaveAttribute('data-copy-state', 'copied');
  await expect(button).toHaveText('copied');

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toBe(expected);

  // §13.2: "politely announced" — a dedicated aria-live region, not just
  // the (already-verified) visible label change. CodeCopy.svelte's live
  // region is the page's one delegating island (ADR-0020), not scoped
  // under `block`, so it's found by its `.visually-hidden-inline` class —
  // ArticleAside.astro's own `[aria-live="polite"]` share-announce span
  // uses plain `.visually-hidden` instead.
  const live = page.locator('.visually-hidden-inline[aria-live="polite"]');
  await expect(live).toHaveText('copied');

  // 1.2s label swap (§13.2), not permanent.
  await expect(button).toHaveText('copy', { timeout: 2000 });
  await expect(button).not.toHaveAttribute('data-copy-state', 'copied');
});
