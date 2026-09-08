// remark-reading-time.ts — Phase 3.6, for §6·09's "14 min" / "3,180 words"
// metadata-row datums.
//
// Astro's own `rawContent()`/`compiledContent()` layout helpers (the
// pre-"Sätteri" way to get at a Markdown page's source for exactly this
// kind of computation) were checked against the actually-installed
// processor by building and logging their output — both returned empty
// whitespace, not the article text (Astro 7.2.6, same "verify against the
// installed version" discipline as astro.config.mjs's own processor note).
// Not usable. Astro's OFFICIALLY DOCUMENTED replacement for this exact case
// is a remark plugin writing to `file.data.astro.frontmatter` — it runs on
// the actual mdast tree, so it works regardless of what the layout-side
// content helpers do, and the result comes back out through the ordinary
// `frontmatter` prop already flowing into ProseLayout.astro.
//
// Runs LAST in the remark chain (after remark-directives and
// remark-section-numbers) so mdast-util-to-string sees the fully-resolved
// tree — not that it matters much for a word count, but it's the tree
// whoever reads this plugin next will expect "the text" to mean.

import { toString } from 'mdast-util-to-string';

// No words-per-minute figure exists anywhere in DESIGN_SYSTEM.md or
// IMPLEMENTATION_PLAN.md. 200 is the most commonly cited average adult
// silent-reading rate (the same default most static-site "reading time"
// recipes use) — a documented default, not an invented one.
const WORDS_PER_MINUTE = 200;

export default function remarkReadingTime() {
  return (tree: any, file: any) => {
    const text = toString(tree);
    const wordCount = (text.match(/\S+/g) ?? []).length;
    const minutesRead = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE));

    const data = (file.data ??= {});
    const astroData = (data.astro ??= {});
    const frontmatter = (astroData.frontmatter ??= {});
    frontmatter.wordCount = wordCount;
    frontmatter.minutesRead = minutesRead;
  };
}
