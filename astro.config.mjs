// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import { unified } from '@astrojs/markdown-remark';
import remarkDirective from 'remark-directive';
import remarkHeadingDepth from './src/plugins/remark-heading-depth.ts';
import remarkDirectives from './src/plugins/remark-directives.ts';
import remarkSectionNumbers from './src/plugins/remark-section-numbers.ts';
import remarkCodeMeta from './src/plugins/remark-code-meta.ts';
import remarkReadingTime from './src/plugins/remark-reading-time.ts';
import { transformerMetaHighlight } from '@shikijs/transformers';
import shikiDiffLines from './src/plugins/shiki-diff-lines.ts';
import rehypeProseLinks from './src/plugins/rehype-prose-links.ts';
import rehypeToc from './src/plugins/rehype-toc.ts';
// Phase 4.1 (AD-05) — the site's one Shiki theme, mapped onto §2.3's seven
// syntax roles via var(--syn-*)/var(--code-*)/var(--diff-*) references into
// tokens.css. Node 24 (this project's pinned engine) supports import
// attributes for static JSON imports natively; no bundler-specific syntax
// needed.
import shikiLedgerTheme from './src/plugins/shiki-ledger-theme.json' with { type: 'json' };

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
  // resist. The four prose-structure plugins below landed in Phase 3.3; the
  // Shiki theme and language gate landed in Phase 4.1; the filename/
  // language/copy chrome bar is Phase 4.3's, built by remark-code-meta.ts
  // rather than a separate rehype-code-chrome.ts (ADR-0020 sketched that
  // filename before the ordering constraint below was pinned down —
  // wrapping the mdast `code` node in remark keeps the wrapper outside
  // rehypeShiki's wholesale replacement, and one plugin doing both the
  // language-gate validation and the wrapping needs no second file).
  //
  // AD-11 (rev. ADR-0017): Svelte is the sole client-side framework, used
  // for four small islands (theme toggle interaction, TOC scroll-spy,
  // reading progress, copy control). See ADR-0017 for the full component
  // list and the reasoning for not using client:load by default.
  integrations: [svelte()],
  markdown: {
    // Phase 4.1 (Finding B) — Astro's DEFAULT is the `github-dark` preset,
    // which writes literal hex into every code block's inline `style`
    // attribute (confirmed directly against dist/ output: 29 hex colours
    // across the Phase 3 fixture alone). These two options are how that
    // gets replaced; verified they belong at the TOP level of `markdown`,
    // not inside `unified()` — read `UnifiedProcessorOptions`' type
    // definition in the installed @astrojs/markdown-remark@7.2.4: it has no
    // highlighting fields at all. `AstroMarkdownOptions` (the type these
    // two keys actually belong to) documents them as "cross-cutting
    // options ... honoured regardless of which processor is selected", and
    // tracing `unified()`'s own `createRenderer` confirms it: the shared
    // top-level markdown config is spread into the processor first, and
    // only remarkPlugins/rehypePlugins/remarkRehype/gfm/smartypants are
    // overridden from `unified()`'s own options — shikiConfig and
    // syntaxHighlight pass through untouched.
    shikiConfig: {
      // AD-05 / §2.3 — one custom theme (src/plugins/shiki-ledger-theme.json,
      // constant across both site themes per E2/§13.1 — the code ground
      // never changes, only its border does, which is code.css's rule, not
      // this file's), seven roles, all var(--syn-*) / var(--code-*) /
      // var(--diff-*) references into tokens.css rather than literals, so
      // Shiki's inline `style` output never carries a hex colour (this
      // file's exit criterion) and a code block re-themes itself from
      // tokens.css alone like everything else in the system. The JSON file
      // itself carries no comments (it's excess-property-checked against
      // Shiki's ThemeRegistration/ThemeRegistrationRaw types when imported
      // here — confirmed by trying: an extra top-level key failed `astro
      // check` even as a harmless documentation field), so its rationale
      // lives here instead:
      //   - Deliberately NOT Shiki's built-in `css-variables` preset theme.
      //     Checked its source (@shikijs/core's createCssVariablesTheme):
      //     it exposes nine roles and collapses constant.numeric and
      //     constant.language into one "token-constant" bucket, so §2.3's
      //     separate number (--syn-number) and literal/boolean
      //     (--syn-literal) roles can't both be expressed through it. That
      //     preset IS the proof that Shiki accepts var() where it expects a
      //     colour, though — shiki-ledger-theme.json relies on exactly
      //     that mechanism.
      //   - Its scope groupings are adapted from that same preset's
      //     tokenColors list (a real, battle-tested scope-to-role mapping
      //     already covering the grammars in @shikijs/langs), regrouped
      //     from its 9 roles onto this design's 7 (comment, keyword/key,
      //     string, literal/boolean, number, function/identifier,
      //     foreground — §25.4 corrects the spec's stated "five" to
      //     seven). Punctuation and operators are deliberately left
      //     unmapped so they inherit --code-fg (§2.3: "Punctuation and
      //     operators stay at foreground colour").
      //   - Its markup.inserted/markup.deleted entries map the diff
      //     grammar's own line-level scopes to text colour only. The
      //     leading +/- glyph and the line-tint bar are Phase 4.3's job (a
      //     transformer plus code.css, not a theme colour).
      //   - Fidelity note: a solid default, not yet checked pixel-by-pixel
      //     against docs/reference/ — that visual pass belongs to 4.2's
      //     exit criterion ("matches docs/reference/article/1320-light.png"),
      //     once real highlighted content exists to compare.
      //
      // The JSDoc cast below: importing JSON via `with { type: 'json' }`
      // widens its string fields (e.g. "dark" → `string`) instead of
      // narrowing them to literals the way a bare `resolveJsonModule`
      // import would, so the object's inferred shape doesn't structurally
      // satisfy Shiki's ThemeRegistrationRaw (which additionally wants a
      // legacy, unused `settings` array from the raw TextMate theme
      // interface it extends) without help. The JSON itself is a real,
      // working Shiki theme either way — this cast only tells `astro
      // check` that, the same way real-world custom Shiki themes commonly
      // need to.
      theme: /** @type {import('shiki').ThemeRegistrationRaw} */ (
        /** @type {unknown} */ (shikiLedgerTheme)
      ),
      // Phase 4.3. Line NUMBERS aren't here — they're built directly by
      // remark-code-meta.ts (a plain line count from the raw fence text is
      // all §13.2's ">12 lines" rule needs) as a sibling of the `<pre>`,
      // not a transformer: a transformer can only reshape what's INSIDE
      // the `<pre>`/`<code>` it's given, and @astrojs/markdown-remark's
      // highlight.js takes only `result.children[0]` of whatever a
      // transformer's `root` hook returns as the replacement for the
      // original `<pre>` (confirmed by reading its source) — a second
      // sibling node returned from `root` is silently dropped, not
      // inserted. transformerMetaHighlight IS a transformer, correctly:
      // the `{14-16}` tint has to mark actual rendered `.line` elements
      // INSIDE the code Shiki is already highlighting, which only Shiki
      // itself can do mid-render. shikiDiffLines (this repo, not an
      // official package — see its own header) does the equivalent for
      // `diff`-language fences: §13.2's leading +/− glyph already renders
      // via shiki-ledger-theme.json; this adds the secondary line tint.
      transformers: [transformerMetaHighlight(), shikiDiffLines()],
    },
    syntaxHighlight: {
      type: 'shiki',
      // §13.3 / §23.4 — the terminal block has no syntax highlighting at
      // all, only a hand-styled prompt glyph and success token (Phase
      // 4.5). Excluding it here means its `<pre><code
      // class="language-terminal">` reaches rehype as plain, unhighlighted
      // text — a cleaner boundary than registering a fake grammar for it.
      excludeLangs: ['terminal'],
    },
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
      // Order matters (Phase 3.3, extended Phase 4.1):
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
      //   5. remark-code-meta       — Phase 4.1 validates every fenced
      //      code block's language against consts.ts's CODE_LANGS, before
      //      remark-rehype/rehypeShiki gets a chance to swallow an unknown
      //      one as a silent "plaintext" fallback with only a console.warn.
      //      Phase 4.3 adds title validation and wraps the node in its
      //      chrome-bar container, BEFORE remark-rehype/rehypeShiki ever
      //      run — see that file's own header for why it has to be here
      //      and not a rehype plugin.
      //   6. remark-reading-time    — Phase 3.6: word count + reading time
      //      for §6·09's metadata row, written to file.data.astro.frontmatter
      //      (Astro's documented mechanism for computed frontmatter). Runs
      //      last so it counts the fully-resolved tree.
      remarkPlugins: [
        remarkHeadingDepth,
        remarkDirective,
        remarkDirectives,
        remarkSectionNumbers,
        remarkCodeMeta,
        remarkReadingTime,
      ],
      // rehype-prose-links: adds the external-link "↗" as real markup.
      // rehype-toc (Phase 3.7): records which headings are numbered
      // sections, positionally, for ArticleToc.astro to filter
      // Astro.props.headings against — see that file's own header comment.
      rehypePlugins: [rehypeProseLinks, rehypeToc],
      // gfm/smartypants default to true already — footnotes (3.5) and
      // curly quotes both depend on that, and the subset fonts were built
      // assuming SmartyPants output (docs/reference/glyph-coverage.md).
      // Left implicit rather than restated, so there's one fewer place a
      // future edit could silently flip them off.
      //
      // Phase 3.5 — §10.5's three corrections to GFM's default footnote
      // output. This option object is forwarded verbatim to remark-rehype,
      // which forwards it verbatim to mdast-util-to-hast (confirmed by
      // reading both packages' source rather than assuming the passthrough
      // exists) — the actual footnote/reference markup, so this is the
      // correct layer to fix it at, not a rehype plugin walking the DOM
      // after the fact.
      remarkRehype: {
        // 1. The back-reference glyph is U+21A9 (↩) by default, which is
        //    NOT in the font subset (docs/glyph-coverage.md) — it would
        //    silently render from a fallback family. '←' (U+2190) IS
        //    subset, and §2.11 already assigns it "previous in sequence",
        //    which is exactly what a back-reference is.
        footnoteBackContent: '←',
        // 2. GFM's hidden "Footnotes" h2 becomes the visible §10.5 label.
        footnoteLabel: 'REFERENCES',
        // 3. mdast-util-to-hast's default footnoteLabelProperties is
        //    `{ className: ['sr-only'] }` — but this codebase's own
        //    visually-hidden utility is named `.visually-hidden` (base.css,
        //    Phase 1.4), not `.sr-only`, so that class was dead: the
        //    heading was ALREADY rendering visible and unstyled (confirmed
        //    against the built fixture's own dist output) before this fix,
        //    just with the wrong text and no type treatment. An empty
        //    object replaces the default outright (mdast-util-to-hast
        //    does `options.footnoteLabelProperties || { className:
        //    ['sr-only'] }` — not a merge), and the heading's
        //    `id="footnote-label"` is force-set regardless of what's
        //    passed here, so prose.css can style `#footnote-label`
        //    directly with --t-label.
        footnoteLabelProperties: {},
      },
    }),
  },

  // AD-01 corollary: Astro's View Transitions / ClientRouter must never be
  // enabled anywhere in this project. DESIGN_SYSTEM.md §17.4 states plainly
  // that page transitions do not exist — navigation is a full document load.
  // This is the modern-Astro default reflex; resist it.

  // AD-11: no JS framework integration (no @astrojs/react, @astrojs/vue,
  // etc.). All interactivity is < 4KB of vanilla script across three islands
  // (theme, TOC/progress, copy control) — see IMPLEMENTATION_PLAN.md AD-11.

  // 3.8: Astro's dev toolbar (<astro-dev-toolbar>, injected by `astro dev`
  // on every page) turned out not to be inert for T3's focus-order check —
  // its shadow-DOM children carry a real, non-`-1` tabIndex, so they're
  // genuinely Tab-reachable in the real accessibility tree even though
  // native querySelectorAll can't see them (open shadow roots don't cross
  // that boundary, which chrome.spec.ts's own comment already relies on
  // for element *counting*). The two facts collide once a page has enough
  // real focusable content that the toolbar's own stops fall inside the
  // Tab range the test walks: reproduced directly on /dev/fixtures/article
  // at 390 — tab stop 35 landed on the toolbar (outlineStyle "none", no
  // ring by design, it's not part of the design system), which is a false
  // failure, not a real one. It never surfaced on the smaller
  // /dev/layout-check page only because that page doesn't have enough
  // focusable elements to reach that far. Disabling the toolbar removes it
  // from the tab order entirely rather than working around it per-test.
  devToolbar: {
    enabled: false,
  },

  build: {
    // Predictable, hashed filenames per page — keeps the atomic-release
    // rsync + symlink-swap deploy (IMPLEMENTATION_PLAN.md §10) simple to
    // reason about and safe to cache aggressively.
    format: 'directory',
  },
});
