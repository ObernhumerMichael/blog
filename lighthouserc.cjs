// Lighthouse CI budgets — IMPLEMENTATION_PLAN.md §8.5/§8's own T5 table.
// Runs against `astro preview`'s local server (already a script, no new
// server mechanism) on 8.3's seven representative URLs, one per page
// type. Fixture pages are excluded: a budget audits a real
// page's payload, not a stress test's.
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:4321/',
        'http://localhost:4321/writing',
        'http://localhost:4321/w/001',
        'http://localhost:4321/projects',
        'http://localhost:4321/projects/self-hosted-homelab-on-ansible',
        'http://localhost:4321/about',
        'http://localhost:4321/404',
      ],
      startServerCommand: 'pnpm run preview',
      // Foreground (CI) prints "ready in"; background mode prints "Preview server running".
      startServerReadyPattern: 'ready in|Preview server running',
      numberOfRuns: 1,
    },
    assert: {
      assertions: {
        // Performance, JS and LCP relaxed from §8's table per ADR-0027.
        'categories:performance': ['error', { minScore: 0.85 }],
        'categories:accessibility': ['error', { minScore: 1 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 24576 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.01 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
      },
    },
    upload: {
      target: 'filesystem',
      outputDir: '.lighthouseci',
    },
  },
};
