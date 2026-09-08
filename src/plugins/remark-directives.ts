// remark-directives.ts — Phase 3.3, AD-04's mechanism finally used.
//
// Must run AFTER the `remark-directive` package in the plugin chain — that
// package is what turns `:::name` container syntax into `containerDirective`
// mdast nodes in the first place; without it running first, `:::note` is
// still plain paragraph text by the time this plugin looks for it.
//
// Transforms `:::note` / `:::warning` / `:::correction` into §6·10's
// callout markup, and FAILS THE BUILD on anything else — including
// `:::figure`, which is Phase 4's directive and must error loudly rather
// than silently emit nothing for a phase and a half. Also enforces §6·10's
// two structural rules directly: a callout is never nested, and never
// contains a code block.

import { visit, SKIP } from 'unist-util-visit';

const CALLOUT_KINDS: Record<string, string> = {
  note: 'NOTE',
  warning: 'WARNING',
  correction: 'CORRECTION',
};

function findDisallowedDescendant(node: any) {
  let found: string | null = null;
  visit(node, (child: any) => {
    if (child === node) return;
    if (child.type === 'code') {
      found = 'a code block';
      return false;
    }
    if (
      child.type === 'containerDirective' ||
      child.type === 'leafDirective' ||
      child.type === 'textDirective'
    ) {
      found = 'a nested directive';
      return false;
    }
  });
  return found;
}

export default function remarkDirectives() {
  return (tree: any, file: any) => {
    const path = file.path ?? 'unknown file';

    visit(tree, (node: any, index: number | undefined, parent: any) => {
      if (
        node.type !== 'containerDirective' &&
        node.type !== 'leafDirective' &&
        node.type !== 'textDirective'
      ) {
        return;
      }

      const name = node.name;
      const label = CALLOUT_KINDS[name];

      if (node.type !== 'containerDirective' || !label) {
        throw new Error(
          `${path}: directive ":::${name}" is not implemented. Only ` +
            '":::note", ":::warning" and ":::correction" exist today ' +
            '(§6·10) — ":::figure" and any other directive land in a ' +
            'later phase and must not be authored yet.',
        );
      }

      const violation = findDisallowedDescendant(node);
      if (violation) {
        throw new Error(
          `${path}: the ":::${name}" callout contains ${violation} — a ` +
            'callout is never nested and never contains a code block (§6·10).',
        );
      }

      const kind = name; // 'note' | 'warning' | 'correction'
      const calloutNode = {
        type: 'calloutWrapper',
        data: {
          hName: 'div',
          hProperties: {
            className: ['callout', `callout--${kind}`],
            'data-callout': kind,
          },
        },
        children: [
          {
            type: 'calloutLabel',
            data: { hName: 'p', hProperties: { className: ['callout__label'] } },
            children: [{ type: 'text', value: label }],
          },
          {
            type: 'calloutBody',
            data: { hName: 'div', hProperties: { className: ['callout__body'] } },
            children: node.children,
          },
        ],
      };

      if (index === undefined) return;
      parent.children[index] = calloutNode;
      return [SKIP, index];
    });
  };
}
