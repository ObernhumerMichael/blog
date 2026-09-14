import { test, expect } from '@playwright/test';

// Phase 4.7 exit criteria (IMPLEMENTATION_PLAN.md §4.7), minus the two
// scroll-edge affordances (fade + `scroll →` marker) — built per §15.2,
// then deliberately removed from tables; see blocks.css's and rehype-
// table-region.ts's own comments on the TABLE section for why. What's left
// of the exit criteria: "the 7-column fixture at 390 pins its first
// column, and the page does not scroll sideways; the region is reachable
// by Tab and scrollable by arrow key; no data row has a hover state; a
// digest cell copies its full value."
//
// /dev/fixtures/article carries two real GFM tables (Phase 4.7's own
// addition to that fixture): a narrow four-column one that never overflows
// above mobile, and a seven-column inventory table — numeric columns, an
// explicit prose column, and a `sha256:` digest — that overflows at every
// width in the matrix. Tests that need genuine overflow target the second
// one specifically; the first is the contrasting "fits" case, used only by
// the alignment/prose-cell tests below where overflow is irrelevant.
const PAGE = '/dev/fixtures/article';

// `.table-region` is a single element: both the `overflow-x: auto` scroll
// container and the `tabindex`/`role`/`aria-label` landmark.
async function wideTable(page: import('@playwright/test').Page) {
  const region = page.locator('.table-region').nth(1);
  const overflowing = await region.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(
    overflowing,
    'the seven-column fixture table must overflow to test anything here',
  ).toBe(true);
  return { region };
}

test('region is a labelled, focusable landmark', async ({ page }) => {
  await page.goto(PAGE);
  const { region } = await wideTable(page);
  await expect(region).toHaveAttribute('role', 'region');
  await expect(region).toHaveAttribute('tabindex', '0');
  const label = await region.getAttribute('aria-label');
  // OD-13's convention, read directly off the caption paragraph — not the
  // generic "Table" fallback, since this fixture table DOES have one.
  expect(label).toMatch(/^Table 2 —/);
});

test('first column stays pinned while the region scrolls', async ({ page }) => {
  await page.goto(PAGE);
  const { region } = await wideTable(page);
  const firstCell = region.locator('td:first-child, th:first-child').first();

  const before = await firstCell.boundingBox();
  await region.evaluate((el) => {
    el.scrollLeft = el.scrollWidth;
  });
  const after = await firstCell.boundingBox();

  expect(before).not.toBeNull();
  expect(after).not.toBeNull();
  // §15.2: "First column sticks ... a value is never orphaned from its row
  // label" — its on-screen x position must not move at all, not just stay
  // "close", while the rest of the row scrolls out from under it.
  expect(after!.x).toBeCloseTo(before!.x, 0);
});

test('keyboard: the region is reachable by Tab and scrollable by arrow key', async ({
  page,
}) => {
  await page.goto(PAGE);
  const { region } = await wideTable(page);

  await region.evaluate((el) => {
    el.scrollLeft = 0;
  });
  await region.focus();
  await expect(region).toBeFocused();

  await page.keyboard.press('ArrowRight');
  // §15.2/§18.2: "focusable and arrow-scrollable" — the native behaviour a
  // scrollable, tabbable container gets for free from `overflow-x: auto` +
  // `tabindex="0"`, asserted directly rather than assumed to still work
  // after this file's other CSS (sticky column). Assertion-based wait, not
  // a fixed sleep (copy.spec.ts's own convention) — the scroll itself is a
  // real, but not synchronous, browser response to the keypress.
  await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
});

test('no hover state on a data row', async ({ page }) => {
  await page.goto(PAGE);
  const { region } = await wideTable(page);
  const row = region.locator('tbody tr').first();

  const before = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
  await row.hover();
  const after = await row.evaluate((el) => getComputedStyle(el).backgroundColor);
  // §15.1: "Table rows do NOT have a hover state (they are data, not
  // targets)" — §23.4's own confusion risk against index rows, which DO
  // get one and look identical otherwise.
  expect(after).toBe(before);
});

test('E7: a digest cell is visually truncated but copies its full value', async ({
  page,
}) => {
  await page.goto(PAGE);
  const { region } = await wideTable(page);
  const digest = region.locator('code:has(.table-region__digest-head)').first();

  const full = await digest.evaluate((el) => el.textContent);
  expect(full).toMatch(/^sha256:[0-9a-f]{20,}$/);

  // Hover — §15.3's own "full value available on hover", via `title`.
  await expect(digest).toHaveAttribute('title', full!);

  // Visually truncated — the head span's rendered width is genuinely
  // smaller than its own text content, not merely styled-but-inert CSS.
  const clipped = await digest.evaluate((el) => {
    const head = el.querySelector('.table-region__digest-head')!;
    return head.scrollWidth > head.clientWidth;
  });
  expect(clipped, 'the digest head must actually be clipped, not just styled to be').toBe(
    true,
  );

  // Copy — §15.3's own "full value available ... on copy": selecting the
  // whole chip and copying it yields the untruncated string, because the
  // head span's DOM text was never shortened, only painted with an
  // ellipsis past its own edge.
  await page.evaluate(
    (el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
    },
    await digest.elementHandle(),
  );
  const selected = await page.evaluate(() => window.getSelection()?.toString());
  expect(selected).toBe(full);
});

test('an explicitly left-aligned data column renders as prose, not mono data', async ({
  page,
}) => {
  await page.goto(PAGE);
  const { region } = await wideTable(page);
  const proseCell = region.locator('td.table-region__cell--prose').first();
  const dataCell = region.locator('tbody td').nth(1); // Role — mono, unmarked

  const proseFont = await proseCell.evaluate((el) => getComputedStyle(el).fontFamily);
  const dataFont = await dataCell.evaluate((el) => getComputedStyle(el).fontFamily);
  // §15.1: "a column carrying an explanation rather than data ... sans
  // 13.5 --c-text-2" — the whole point of the distinction is that it reads
  // differently from an ordinary mono data cell right next to it.
  expect(proseFont).toContain('IBM Plex Sans');
  expect(dataFont).toContain('IBM Plex Mono');

  // §15.1's own alignment rule, scoped to head cells only: a marked
  // column's `<th>` keeps the uniform uppercase-mono head treatment
  // regardless of its alignment — the prose override is a DATA-cell
  // distinction, not a column-wide one.
  const headCell = region.locator('thead th').filter({ hasText: 'Notes' });
  await expect(headCell).not.toHaveClass(/table-region__cell--prose/);
  const headFont = await headCell.evaluate((el) => getComputedStyle(el).fontFamily);
  expect(headFont).toContain('IBM Plex Mono');
});

test("numeric columns stay right-aligned (GFM alignment survives this file's own CSS)", async ({
  page,
}) => {
  await page.goto(PAGE);
  const { region } = await wideTable(page);
  // Real bug, caught building this phase: a blanket `text-align: left` on
  // every head cell silently outranked GFM's own `align="right"`
  // presentational hint (author CSS of any specificity beats a
  // presentational attribute) — this is the regression test for it.
  const cpuHeader = region.locator('thead th').filter({ hasText: 'CPU %' });
  await expect(cpuHeader).toHaveCSS('text-align', /right/);
  const cpuCell = region.locator('tbody td').nth(3);
  await expect(cpuCell).toHaveCSS('text-align', /right/);
});

test('mobile: full-bleed, bounded by two hairlines', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto(PAGE);
  const { region } = await wideTable(page);

  const box = await region.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      left: r.left,
      right: window.innerWidth - r.right,
      borderTop: cs.borderTopStyle,
      borderBottom: cs.borderBottomStyle,
    };
  });
  // §15.2: "Full-bleed, contained ... bounded by two hairlines." Same
  // escape formula as code/figure (negative margin-inline by
  // --page-margin), asserted geometrically rather than by CSS value.
  expect(box.left).toBeCloseTo(0, 0);
  expect(box.right).toBeCloseTo(0, 0);
  expect(box.borderTop).toBe('solid');
  expect(box.borderBottom).toBe('solid');
});
