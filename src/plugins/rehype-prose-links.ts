// rehype-prose-links.ts — Phase 3.3.
//
// Adds §8.2's trailing "↗" to external links as REAL markup, not CSS
// content: — same precedent as the mobile-menu label swap in Phase 2.4:
// generated content isn't reliably announced by assistive technology, and
// here the glyph is also the only thing distinguishing an external link
// from an internal one, not decoration on top of an already-clear signal.
//
// Deliberately does NOT add target="_blank" — nothing in the design asks
// for it, and where a link opens is the reader's decision (§8.2).
//
// Runs as a REHYPE plugin (after remark -> rehype conversion), because
// "is this link external" is answered the same way regardless of whether
// it came from prose, a footnote, or a heading — hast doesn't distinguish,
// and neither should this check.

import { visit } from 'unist-util-visit';
import { SITE_URL } from '../consts';

const SITE_ORIGIN = new URL(SITE_URL).origin;

export default function rehypeProseLinks() {
  return (tree: any) => {
    visit(tree, 'element', (node: any) => {
      if (node.tagName !== 'a') return;
      const href = node.properties && node.properties.href;
      if (typeof href !== 'string' || !/^https?:\/\//i.test(href)) return;

      let origin;
      try {
        origin = new URL(href).origin;
      } catch {
        return; // malformed href — not this plugin's problem to fix
      }
      if (origin === SITE_ORIGIN) return; // internal, fully-qualified link

      // §8.2: "a trailing ↗ after a hair space" — U+200A, not an ASCII
      // space. Caught re-reading the spec closely while writing prose.css
      // (Phase 3.4); harmless, narrow correction to an already-shipped rule.
      node.children.push({ type: 'text', value: ' ↗' });
    });
  };
}
