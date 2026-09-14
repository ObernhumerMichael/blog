// Shared page list for T3 checks (IMPLEMENTATION_PLAN.md §2.7, 3.8, 4.9).
//
// Two pages, for two different reasons: /dev/layout-check is the only page
// wired to BaseLayout with real chrome (masthead, footer, mobile menu) and
// nothing else — it's what checks 1/4/5/6/10 (chrome.spec.ts) exercise.
// /dev/fixtures/article is the only page with real prose (headings, body
// copy, code blocks, metadata) — it's what checks 2/3/7 (prose.spec.ts)
// need, and 1/6/10 run against it too since those are general assertions,
// not chrome-specific ones. Neither file hardcodes its own copy of this
// list (3.8's own instruction: "turn it into a list ... rather than
// copying the file").
//
// 4.9 adds T4's six machine-content fixtures — §25.6's stress cases Phase 4
// owns (IMPLEMENTATION_PLAN.md §4.9): a 210-character code line, a
// seven-column table, a 3840×2160 screenshot, an image-free article, four
// consecutive code blocks, and a caption with no length limit. Same reason
// as the two pages above: every check in chrome.spec.ts/prose.spec.ts is a
// general assertion, not specific to /dev/fixtures/article, so these six
// belong in the one shared matrix rather than a parallel list.
export const PAGES = [
  '/dev/layout-check',
  '/dev/fixtures/article',
  '/dev/fixtures/code-long-line',
  '/dev/fixtures/table-wide',
  '/dev/fixtures/screenshot-4k',
  '/dev/fixtures/image-free',
  '/dev/fixtures/four-code-blocks',
  '/dev/fixtures/long-caption',
] as const;
