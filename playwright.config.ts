import { defineConfig } from '@playwright/test';

// 2.7: minimal T3 bring-forward (checks 1, 4, 5 only — see
// IMPLEMENTATION_PLAN.md §2.7). The matrix that matters for these checks is
// three widths × two themes; the full 7-page-type matrix is a Phase 8
// concern once real pages exist beyond dev/layout-check.
const WIDTHS = { mobile: 390, tablet: 900, desktop: 1320 } as const;
const THEMES = ['light', 'dark'] as const;

const projects = Object.entries(WIDTHS).flatMap(([widthName, width]) =>
  THEMES.map((theme) => ({
    name: `${widthName}-${theme}`,
    use: {
      viewport: { width, height: 800 },
      colorScheme: theme,
    },
  })),
);

export default defineConfig({
  testDir: './tests/e2e',
  // Serialized, not parallel: all projects share one `astro dev` instance
  // (started by `check:e2e`, see package.json), and concurrent requests
  // raced its on-demand Vite compiler — reproduced directly as a
  // silently-broken click handler (aria-expanded stuck at "false") under
  // the default multi-worker run.
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    browserName: 'chromium',
    // Not needed in a normal environment (`playwright install chromium`
    // works there). This sandbox's browser download fails (missing shared
    // libs, no sudo) — set this to the system Chromium path for local runs
    // here without hardcoding a machine-specific path into the repo.
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? { launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE } }
      : {}),
  },
  // No `webServer` block: Astro 7's dev server daemonizes on its own
  // (`astro dev`/`astro dev --background` both hand off to a persistent
  // background process and the launching command returns) — confirmed
  // directly to be incompatible with Playwright's webServer supervision,
  // which expects the command it launches to stay alive for the run and
  // reports "Process from config.webServer exited early" as soon as it
  // doesn't, even once the server it started is genuinely up. The
  // `check:e2e` script starts the daemon itself first instead (see
  // package.json) — `astro dev --background` blocks until the server is
  // actually serving before returning, so by the time `playwright test`
  // starts here, baseURL is already live.
  projects,
});
