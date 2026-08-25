// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // AD-01: static output, no adapter. Nothing in the design has a dynamic
  // surface (no forms, no auth, no comments — DESIGN_SYSTEM.md §12) so a
  // server runtime would be capability never exercised but still requiring
  // patching and monitoring.
  output: 'static',

  // AD-10: the permalink is /w/<num>, no trailing slash. Consistent trailing-
  // slash behaviour across every route avoids duplicate-content canonical
  // issues on a site that cares about being a stable, linkable publication.
  trailingSlash: 'never',

  // OD-07: real domain not finalized yet. This is the ONLY place the bare
  // fallback is allowed to live — everything else (RSS, sitemap, canonical
  // tags, structured data) must import SITE_URL from src/consts.ts, which
  // reads this same value, so switching domains later is a one-line change
  // here, not a grep across the codebase.
  site: 'https://example.invalid',

  // Deliberately empty. AD-04: MDX is added only when a concrete article
  // needs it, not by default — enabling it globally is exactly the "arbitrary
  // component injection into prose" pressure DESIGN_SYSTEM.md §22.8 exists to
  // resist. Markdown plugins (remark directives, heading-depth guard, rehype
  // code chrome) land here in Phase 4/5, per IMPLEMENTATION_PLAN.md §7.
  integrations: [],
  markdown: {
    remarkPlugins: [],
    rehypePlugins: [],
  },

  // AD-01 corollary: Astro's View Transitions / ClientRouter must never be
  // enabled anywhere in this project. DESIGN_SYSTEM.md §17.4 states plainly
  // that page transitions do not exist — navigation is a full document load.
  // This is the modern-Astro default reflex; resist it.

  // AD-11: no JS framework integration (no @astrojs/react, @astrojs/vue,
  // etc.). All interactivity is < 4KB of vanilla script across three islands
  // (theme, TOC/progress, copy control) — see IMPLEMENTATION_PLAN.md AD-11.

  build: {
    // Predictable, hashed filenames per page — keeps the atomic-release
    // rsync + symlink-swap deploy (IMPLEMENTATION_PLAN.md §10) simple to
    // reason about and safe to cache aggressively.
    format: 'directory',
  },
});
