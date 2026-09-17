import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PAGES } from './pages';

// 4.10 — T3 checks 8 and 9 (IMPLEMENTATION_PLAN.md §4.10). Both deferred
// past Phase 2/3: check 8 because §2.3's seven machine-content roles are
// the one palette in the system held to a lightness band rather than a
// contrast ratio, and this phase is the first time they render; check 9
// because none of the three scroll-region components (code, terminal,
// table) existed yet.

// --- check 8 — contrast ----------------------------------------------------

// The four §18.1 role/background pairs, read straight off DESIGN_SYSTEM.md's
// table. axe-core alone only enforces the flat WCAG AA floor (4.5:1); this
// asserts the actual, stronger ratios the design claims.
const ROLE_RATIOS: Record<string, { light: number; dark: number }> = {
  '--c-text': { light: 13.4, dark: 13 },
  '--c-text-2': { light: 8.1, dark: 7.9 },
  '--c-muted': { light: 4.6, dark: 5.2 },
  '--c-accent': { light: 5.1, dark: 5 },
};

// One documented, narrow exception to the blanket sweep below — confirmed
// real (axe-core flagged it before this list existed), not a bug this check
// should chase: the machine/chrome palette (tokens.css §13.2/§13.3:
// --code-chrome-muted, --code-linenum, --term-label — "the dimmest chrome
// text", constant across themes) is the exact "held to a lightness band
// rather than a contrast ratio" palette this file's own header comment
// names. Its three real consumers, exhaustively: the language tag, the
// line-number gutter, the terminal label.
//
// --c-faint (.gutter-series and its siblings) is NOT an exception here —
// Phase 8.1 corrected the token itself (tokens.css) once expanding this
// matrix to real pages caught it below 4.5:1; see that file's own
// CORRECTED comment.
const KNOWN_CONTRAST_EXCEPTIONS = [
  '.code-block__lang',
  '.code-block__gutter',
  '.term-block__label',
];

function relativeLuminance([r, g, b]: number[]) {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(rgbA: string, rgbB: string) {
  const parse = (rgb: string) => rgb.match(/[\d.]+/g)!.map(Number);
  const la = relativeLuminance(parse(rgbA));
  const lb = relativeLuminance(parse(rgbB));
  const [lighter, darker] = la > lb ? [la, lb] : [lb, la];
  return (lighter + 0.05) / (darker + 0.05);
}

for (const PAGE of PAGES) {
  test(`check 8a — axe-core: no automatic a11y violations — ${PAGE}`, async ({
    page,
  }) => {
    await page.goto(PAGE);
    // One .exclude() call per selector, deliberately — AxeBuilder.exclude()
    // pushes each call's argument as its own context entry, but a single
    // call with an array of selectors is instead read as ONE nested
    // frame-selector chain (iframe within iframe); confirmed directly, the
    // array form silently excluded nothing at all.
    let builder = new AxeBuilder({ page });
    for (const selector of KNOWN_CONTRAST_EXCEPTIONS) {
      builder = builder.exclude(selector);
    }
    const results = await builder.analyze();
    expect(results.violations).toEqual([]);
  });
}

for (const PAGE of PAGES) {
  test(`check 8b — body/secondary/muted/accent hit their documented §18.1 ratio — ${PAGE}`, async ({
    page,
  }) => {
    await page.goto(PAGE);
    // Read resolved colours off real elements, not the raw custom-property
    // text (getPropertyValue on a var() returns the unparsed token stream,
    // not a light-dark()-resolved colour) — a throwaway probe element
    // picks up the page's actual resolved color-scheme the same way any
    // real element would. getComputedStyle itself then serializes back out
    // as `oklch(...)` in this engine (tokens.css writes every colour in
    // oklch), not `rgb(...)` — parsing that string as three 0-255 numbers
    // silently produces nonsense, so the value is forced through a 1x1
    // canvas first: canvas's pixel buffer is always 8-bit sRGB, so
    // getImageData is a native, exact oklch/lab/etc.-to-sRGB conversion
    // rather than a hand-rolled one.
    const { bg, roles, dark } = await page.evaluate((vars: string[]) => {
      const toRgbString = (color: string) => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 1;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        return `rgb(${r}, ${g}, ${b})`;
      };
      const resolve = (colorVar: string) => {
        const el = document.createElement('div');
        el.style.cssText = `position:absolute;visibility:hidden;color:var(${colorVar})`;
        document.body.appendChild(el);
        const resolved = toRgbString(getComputedStyle(el).color);
        el.remove();
        return resolved;
      };
      return {
        bg: toRgbString(getComputedStyle(document.body).backgroundColor),
        roles: Object.fromEntries(vars.map((v) => [v, resolve(v)])),
        dark: matchMedia('(prefers-color-scheme: dark)').matches,
      };
    }, Object.keys(ROLE_RATIOS));

    for (const [role, expected] of Object.entries(ROLE_RATIOS)) {
      const want = dark ? expected.dark : expected.light;
      const got = contrastRatio(roles[role], bg);
      // Two floors, not one: the hard WCAG AA number §18.1's prose claims
      // absolutely ("nothing ... below 4.5:1"), and 90% of the specific
      // documented value as a looser "is this actually the design's
      // intended role" check — tight enough to catch a real regression
      // (e.g. muted's pre-4.10 3.65:1), loose enough to absorb ordinary
      // oklch->sRGB rounding across different hues.
      expect(
        got,
        `${role} vs background (${dark ? 'dark' : 'light'}) — AA floor`,
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        got,
        `${role} vs background (${dark ? 'dark' : 'light'}) — documented ${want}:1`,
      ).toBeGreaterThanOrEqual(want * 0.9);
    }
  });
}

// --- check 9 — scroll regions ----------------------------------------------

// All three scroll-region components, unified: Shiki's own `<pre>`, the
// terminal block's `<pre>` (rehype-terminal.ts sets tabIndex itself, since
// `terminal` is excluded from Shiki), and `.table-region`
// (rehype-table-region.ts). §23.4's shared-mechanic-not-shared-styling rule
// applies to this test the same way it applies to the CSS: one selector
// list, not three parallel component-specific tests.
const SCROLL_REGIONS = 'pre.astro-code, .term-block__body pre, .table-region';

for (const PAGE of PAGES) {
  test(`check 9 — scroll regions are focusable and arrow-scrollable — ${PAGE}`, async ({
    page,
  }) => {
    await page.goto(PAGE);
    const regions = page.locator(SCROLL_REGIONS);
    const count = await regions.count();

    // Only regions that actually overflow at this width can be proven
    // scrollable — same reasoning as tables.spec.ts's own wideTable()
    // helper, generalised across all three component kinds and every
    // width in the matrix rather than one fixed viewport.
    const overflowing: number[] = [];
    for (let i = 0; i < count; i++) {
      if (await regions.nth(i).evaluate((el) => el.scrollWidth > el.clientWidth)) {
        overflowing.push(i);
      }
    }
    test.skip(
      overflowing.length === 0,
      'no overflowing scroll region on this page/width',
    );

    for (const i of overflowing) {
      const region = regions.nth(i);
      await expect(region).toHaveAttribute('tabindex', '0');

      await region.evaluate((el) => {
        el.scrollLeft = 0;
      });
      await region.focus();
      await expect(region).toBeFocused();
      await page.keyboard.press('ArrowRight');
      await expect.poll(() => region.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
    }
  });
}
