// rehype-terminal.ts — Phase 4.5. §13.3's terminal block has no syntax
// highlighting (it's excluded from Shiki entirely — markdown.
// syntaxHighlight.excludeLangs in astro.config.mjs), but it still colours
// exactly two things by hand: the leading `$ ` prompt and a leading
// `[+]`-style success marker. This is deliberately NOT a third grammar —
// §13.3 lists exactly two coloured things, and a third would be a syntax
// theme by the back door (4.5's own plan note).
//
// Runs as a REHYPE plugin, not a remark one, because excludeLangs is what
// leaves `<pre><code class="language-terminal">` as a single plain-text
// node all the way through to here — there is no per-line `.line` markup
// to hook the way transformerMetaHighlight/shiki-diff-lines.ts do for real
// code (those exist only because Shiki built them; nothing builds them for
// an excluded language). remark-code-meta.ts (Phase 4.5) already wrapped
// the block in `.term-block` and left this `code` node's text untouched
// specifically so this plugin has plain text to split.
//
// Both markers are read the same way shiki-diff-lines.ts reads its own:
// "column 0 of every line is the marker" (that file's own comment) — not a
// scan for the pattern anywhere in the line, which would just as happily
// colour a `[+]` appearing inside a file path or a flag value.

import { visit } from 'unist-util-visit';

const PROMPT_RE = /^\$ /;
const SUCCESS_RE = /^\[\+\]/;

function highlightLine(line: string): any[] {
  const promptMatch = line.match(PROMPT_RE);
  if (promptMatch) {
    return [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['term-block__prompt'] },
        children: [{ type: 'text', value: '$' }],
      },
      { type: 'text', value: line.slice(1) },
    ];
  }

  const successMatch = line.match(SUCCESS_RE);
  if (successMatch) {
    return [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['term-block__success'] },
        children: [{ type: 'text', value: '[+]' }],
      },
      { type: 'text', value: line.slice(successMatch[0].length) },
    ];
  }

  return [{ type: 'text', value: line }];
}

export default function rehypeTerminal() {
  return (tree: any) => {
    visit(tree, 'element', (node: any, _index: number | undefined, parent: any) => {
      if (node.tagName !== 'code') return;
      const className: unknown = node.properties?.className;
      if (!Array.isArray(className) || !className.includes('language-terminal')) {
        return;
      }

      // The one thing Shiki would otherwise give a code block "for free"
      // (section 1's own comment in code.css) and never gives THIS block,
      // because `terminal` sits in `markdown.syntaxHighlight.excludeLangs`
      // specifically so Shiki never touches it at all. §15.2/§18.2's
      // focusable-arrow-scrollable rule applies to the terminal block the
      // same as it does to code and tables (§7 of the plan's own table:
      // "Exactly three element types own a contained horizontal scroll") —
      // nothing else in this pipeline will set it if this plugin doesn't.
      if (parent?.tagName === 'pre') {
        parent.properties = parent.properties ?? {};
        parent.properties.tabIndex = 0;
      }

      // §13.2's Finding D precedent: read the source text as authored,
      // not assumed — join every text child rather than trusting there's
      // exactly one, since that's a fact about mdast-to-hast's `code`
      // handler, not a guarantee this file should hard-code.
      const text = node.children
        .map((child: any) => (child.type === 'text' ? child.value : ''))
        .join('');

      const lines = text.split('\n');
      const newChildren: any[] = [];
      lines.forEach((line: string, i: number) => {
        newChildren.push(...highlightLine(line));
        if (i < lines.length - 1) newChildren.push({ type: 'text', value: '\n' });
      });

      node.children = newChildren;
    });
  };
}
