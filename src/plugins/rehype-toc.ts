// rehype-toc.ts — Phase 3.7. The TOC needs to know which headings in the
// rendered document are numbered article sections (h2/h3 with `NN ·`/`n.m ·`
// prefixes) versus structural-but-unnumbered ones — GFM's synthetic
// REFERENCES heading, confirmed present in Astro.props.headings while
// building Phase 3.6 (contrary to what Phase 3.5 assumed about when that
// heading enters the tree).
//
// Astro's own heading collector (rehype-collect-headings.js in
// @astrojs/markdown-remark, read directly rather than assumed) is ALSO a
// rehype plugin, and its position in the pipeline is hardcoded after the
// user's own `rehypePlugins` array — so nothing in that array can read the
// `id` it assigns, and nothing in this project's config can run after it
// either. This plugin can't re-derive Astro's own slugs, so it doesn't try:
// it records, in heading DOCUMENT ORDER, whether each heading carries the
// `data-section-num` hast property remark-section-numbers.ts (Phase 3.3)
// already set on the mdast node — confirmed empirically (logged every
// heading's `node.properties` mid-pipeline: `data-section-num` present on
// exactly the numbered ones, absent on REFERENCES) that mdast-util-to-hast
// carries it through unchanged, keyed exactly as given, no camelCasing.
// Astro's own collector walks the SAME final tree in the SAME order right
// after this plugin runs (only rehypeImages sits between them, and it
// doesn't touch headings) — so a same-order boolean array lines up 1:1 with
// Astro.props.headings by position, with no text-matching or slug
// reimplementation needed.

import { visit } from 'unist-util-visit';

export default function rehypeToc() {
  return (tree: any, file: any) => {
    const numberedHeadingFlags: boolean[] = [];
    visit(tree, 'element', (node: any) => {
      if (!/^h[1-6]$/.test(node.tagName)) return;
      numberedHeadingFlags.push(
        typeof node.properties?.['data-section-num'] === 'string',
      );
    });

    const data = (file.data ??= {});
    const astroData = (data.astro ??= {});
    const frontmatter = (astroData.frontmatter ??= {});
    frontmatter.numberedHeadingFlags = numberedHeadingFlags;
  };
}
