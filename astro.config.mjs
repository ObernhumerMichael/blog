// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import { unified } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import remarkHeadingDepth from './src/plugins/remark-heading-depth.ts';
import remarkDirectives from './src/plugins/remark-directives.ts';
import remarkSectionNumbers from './src/plugins/remark-section-numbers.ts';
import rehypeProseLinks from './src/plugins/rehype-prose-links.ts';

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

  // AD-04: MDX is added only when a concrete article
  // needs it, not by default — enabling it globally is exactly the "arbitrary
  // component injection into prose" pressure DESIGN_SYSTEM.md §22.8 exists to
  // resist. rehype-code-chrome.ts and the Shiki theme are Phase 4's; the four
  // prose-structure plugins below land in Phase 3.3.
  //
  // AD-11 (rev. ADR-0017): Svelte is the sole client-side framework, used
  // for four small islands (theme toggle interaction, TOC scroll-spy,
  // reading progress, copy control). See ADR-0017 for the full component
  // list and the reasoning for not using client:load by default.
  integrations: [svelte()],
  markdown: {
    // Astro 7.2.6 ships a NEW default Markdown processor ("Sätteri") and
    // deprecated the top-level `remarkPlugins`/`rehypePlugins` fields in
    // favour of an explicit `processor`. IMPLEMENTATION_PLAN.md's Phase
    // 3.3 text assumes the old always-unified pipeline; verified against
    // the actually-installed version by building (the "check, don't
    // assume" discipline this plan applies to itself elsewhere) rather
    // than trusting the plan's own prose. `@astrojs/markdown-remark`'s
    // `unified()` is the modern equivalent — same remark/rehype pipeline,
    // just opted into explicitly instead of implied by top-level keys.
    processor: unified({
      // Order matters (Phase 3.3):
      //   1. remark-heading-depth   — fail fast on h4+ before anything
      //      else has to reason about a depth it doesn't expect.
      //   2. remark-directive       — the npm package; turns `:::name`
      //      syntax into containerDirective nodes. MUST run before #3, or
      //      the triple colon is still plain text when the local plugin
      //      looks for it.
      //   3. remark-directives      — AD-04's local transform: callouts
      //      only, fails loudly on anything else (":::figure" included —
      //      Phase 4's).
      //   4. remark-section-numbers — OD-10/ADR-0018: split + validate the
      //      authored `NN · ` / `n.m ·` heading prefixes.
      remarkPlugins: [
        remarkHeadingDepth,
        remarkDirective,
        remarkDirectives,
        remarkSectionNumbers,
      ],
      // rehype-prose-links: adds the external-link "↗" as real markup.
      rehypePlugins: [rehypeProseLinks],
      // gfm/smartypants default to true already — footnotes (3.5) and
      // curly quotes both depend on that, and the subset fonts were built
      // assuming SmartyPants output (docs/reference/glyph-coverage.md).
      // Left implicit rather than restated, so there's one fewer place a
      // future edit could silently flip them off.
    }),
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
