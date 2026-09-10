// Shared page list for T3 checks (IMPLEMENTATION_PLAN.md §2.7, 3.8).
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
export const PAGES = ['/dev/layout-check', '/dev/fixtures/article'] as const;
