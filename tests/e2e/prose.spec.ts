import { test, expect } from '@playwright/test';
import { PAGES } from './pages';

// 3.8 — T3 checks 2, 3, 6, 7 and 10 (IMPLEMENTATION_PLAN.md §3.8), the ones
// §2.7 deferred by name because they "assert things (type floors in prose,
// measure width, scroll regions) that don't exist yet". Checks 1, 4, 5 live
// in chrome.spec.ts; these five join them in the same `pnpm check:e2e` run
// across the same PAGES × 3-widths × 2-themes matrix (playwright.config.ts).
//
// Same shadow-DOM note as chrome.spec.ts: native querySelectorAll, not
// Playwright's $$/$$eval, so Astro's dev-toolbar custom element is excluded
// for free rather than counted as page content.

// A "visible, text-bearing" element: has its own direct text (not just
// text inherited from descendants) and is actually rendered — two
// separate filters, not one:
//
// - .checkVisibility() catches content inside a CLOSED <details> (the
//   mobile TOC disclosure). Found via chrome.spec.ts's own version of this
//   bug: Chromium still lays out a closed <details>'s hidden content, so
//   it has a real, non-zero getBoundingClientRect() despite never being
//   painted — a plain rect-size check alone would still count it.
// - the rect-size check on top catches the OTHER direction:
//   .visually-hidden (base.css)'s 1x1px clip-rect for screen-reader-only
//   text passes checkVisibility() (nothing about it is display:none or
//   content-visibility:hidden), but it has no real visual size for a
//   sighted reader to misjudge, so it's out of scope for a *type floor*
//   check specifically (unlike the touch-target check in chrome.spec.ts,
//   which cares about hit-boxes, not legibility, and rightly filters
//   differently).
function collectTextElements() {
  return Array.from(document.querySelectorAll<HTMLElement>('*'))
    .filter((el) =>
      Array.from(el.childNodes).some(
        (n) => n.nodeType === Node.TEXT_NODE && (n.textContent ?? '').trim().length > 0,
      ),
    )
    .filter((el) => el.checkVisibility())
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 2 && r.height > 2;
    })
    .map((el) => ({
      tag: el.tagName,
      cls: el.className,
      fontSize: parseFloat(getComputedStyle(el).fontSize),
    }));
}

for (const PAGE of PAGES) {
  test(`check 2a — no computed font-size below 10.5px anywhere — ${PAGE}`, async ({
    page,
  }) => {
    await page.goto(PAGE);
    const elements = await page.evaluate(collectTextElements);
    expect(elements.length).toBeGreaterThan(0);
    for (const el of elements) {
      expect(el.fontSize, `${el.tag}.${el.cls || '(no class)'}`).toBeGreaterThanOrEqual(
        10.5,
      );
    }
  });
}

for (const PAGE of PAGES) {
  test(`check 2b — prose body text ≥17px — ${PAGE}`, async ({ page }) => {
    await page.goto(PAGE);
    // Scoped to `.prose > p` — DIRECT children only, not `.prose p` — for
    // the same reason 2c is scoped to `pre code`: a first attempt here
    // used the unscoped selector and failed with a received value of 12px,
    // which turned out to be the QUOTE ATTRIBUTION line, not a body-text
    // bug. `.prose p` also sweeps up callout bodies (15.5px, §6·10's own
    // smaller floor), callout labels (10.5px), quote bodies (19px, serif
    // italic, a different treatment entirely) and footnote/reference list
    // items (15px) — all legitimately NOT the 17px running-prose floor
    // this check is actually about. Direct children of `.prose` are
    // exactly the top-level flowing paragraphs; nested ones belong to a
    // different component with its own type spec.
    const sizes = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('.prose > p'))
        .filter((el) => el.checkVisibility())
        .map((el) => parseFloat(getComputedStyle(el).fontSize)),
    );
    test.skip(sizes.length === 0, 'no .prose on this page');
    for (const size of sizes) {
      expect(size).toBeGreaterThanOrEqual(17);
    }
  });
}

for (const PAGE of PAGES) {
  test(`check 2c — code block text ≥12.5px (scoped to pre code, not inline code) — ${PAGE}`, async ({
    page,
  }) => {
    await page.goto(PAGE);
    // Scoped to `pre code` specifically, not `code` generally: inline code
    // in a mono caption legitimately computes to 10.5px under prose.css's
    // `max(0.86em, var(--fs-label))` clamp (3.4), and an unscoped assertion
    // here would fail on correct output — the exact trap 3.8 names.
    const sizes = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('pre code')).map((el) =>
        parseFloat(getComputedStyle(el).fontSize),
      ),
    );
    test.skip(sizes.length === 0, 'no code blocks on this page');
    for (const size of sizes) {
      expect(size).toBeGreaterThanOrEqual(12.5);
    }
  });
}

for (const PAGE of PAGES) {
  test(`check 2d — metadata text ≥11.5px (the --fs-meta family only) — ${PAGE}`, async ({
    page,
  }) => {
    await page.goto(PAGE);
    // Deliberately NOT every mono/small element on the page — the same
    // scoping trap as 2c, mirrored. §16's breadcrumb is spec'd at 11px
    // below 760 (tokens.css --fs-breadcrumb), and the gutter data / TOC
    // summary / footnote references use the smaller --fs-meta-xs /
    // --fs-label family (10.5-11px) by design — both already covered by
    // 2a's 10.5px global floor, neither a violation of the STRICTER
    // 11.5px "metadata" floor that only the --fs-meta / --fs-meta-sm
    // family (article metadata row, footer, TOC entries, this page's own
    // diagnostic toolbar) is actually held to.
    const sizes = await page.evaluate(() =>
      Array.from(
        document.querySelectorAll<HTMLElement>(
          '.metadata dd, .toolbar, #theme-toggle, footer :is(a, p, span, li), .toc-item a',
        ),
      )
        .filter((el) => el.checkVisibility())
        .map((el) => parseFloat(getComputedStyle(el).fontSize)),
    );
    test.skip(sizes.length === 0, 'no metadata-family elements on this page');
    for (const size of sizes) {
      expect(size).toBeGreaterThanOrEqual(11.5);
    }
  });
}

for (const PAGE of PAGES) {
  test(`check 3 — every prose block's content box ≤680px — ${PAGE}`, async ({ page }) => {
    await page.goto(PAGE);
    // Scoped to `.prose > *`, not the article as a whole: §10.2 explicitly
    // permits the header band's content to run to 760px (--header-w), so
    // an article-wide assertion would fail on a correct header. Asserted
    // in raw px against --measure (680), not `ch` — CSS `ch` is the
    // advance width of "0", not a serif face's average character width,
    // so a `ch`-based assertion here would report the (correct) 680px
    // measure as too wide and invite someone to shrink --measure, which
    // §22.10 forbids absolutely. (Checked by hand once: the rendered
    // fixture's own lines run ~65-70 characters at 680px/18.5px serif —
    // in the neighbourhood the design intends — not re-derived as a `ch`
    // assertion here.)
    const widths = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('.prose > *')).map(
        (el) => el.getBoundingClientRect().width,
      ),
    );
    test.skip(widths.length === 0, 'no .prose on this page');
    for (const w of widths) {
      expect(w).toBeLessThanOrEqual(680.5); // sub-pixel rounding headroom
    }
  });
}

for (const PAGE of PAGES) {
  test(`check 6 — no box-shadow anywhere in the rendered DOM — ${PAGE}`, async ({
    page,
  }) => {
    await page.goto(PAGE);
    const shadowed = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('*'))
        .map((el) => ({
          tag: el.tagName,
          cls: el.className,
          shadow: getComputedStyle(el).boxShadow,
        }))
        .filter((el) => el.shadow !== 'none'),
    );
    expect(shadowed).toEqual([]);
  });
}

for (const PAGE of PAGES) {
  test(`check 7 — one h1, no h4+, no skipped heading levels — ${PAGE}`, async ({
    page,
  }) => {
    await page.goto(PAGE);
    const levels = await page.evaluate(() =>
      Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((el) =>
        Number(el.tagName[1]),
      ),
    );
    expect(levels.length).toBeGreaterThan(0);
    expect(levels.filter((l) => l === 1).length, 'exactly one h1').toBe(1);
    expect(
      levels.some((l) => l >= 4),
      'no h4 or deeper',
    ).toBe(false);

    let previous = levels[0];
    for (const level of levels) {
      expect(level - previous, `heading jump ${previous}->${level}`).toBeLessThanOrEqual(
        1,
      );
      previous = level;
    }
  });
}

for (const PAGE of PAGES) {
  test(`check 10 — reduced motion collapses every transition to 0s — ${PAGE}`, async ({
    page,
  }) => {
    // The direct test of base.css's global override (§17.5): every
    // transition-duration in the codebase is required (by stylelint,
    // Phase 1.6) to reference --dur/--dur-layout rather than a literal
    // value, specifically so this one media query collapses everything at
    // once. Never actually asserted until now.
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(PAGE);
    const durations = await page.evaluate(() =>
      Array.from(document.querySelectorAll<HTMLElement>('*')).flatMap((el) =>
        getComputedStyle(el)
          .transitionDuration.split(',')
          .map((d) => d.trim()),
      ),
    );
    expect(durations.length).toBeGreaterThan(0);
    for (const d of new Set(durations)) {
      expect(d).toBe('0s');
    }
  });
}
