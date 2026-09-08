// remark-section-numbers.ts — Phase 3.3, per OD-10 / ADR-0018.
//
// Section numbers are AUTHORED in Markdown (`## 01 · Title`, `### 5.1 ·
// Title`), not generated from heading order — see ADR-0018 for the full
// reasoning. This plugin's job is purely mechanical, given that decision:
//
//   - h2: split the authored `NN · ` prefix off into its own node (marked
//     with hName: 'span' so 3.4/3.6 can style it as the mono accent
//     number), validate that h2 numbers run contiguously from 01, and mark
//     the heading `data-section-num` so later phases (3.5's footnotes
//     heading, 3.7) can filter "is this a real numbered section" without
//     re-deriving the pattern.
//   - h3: validate that a `n.m` opening number's `n` matches the most
//     recent h2's number. §6·06 is explicit that h3 numbers "carry no
//     separate mono span" — unlike h2, the text is left untouched, only
//     checked.
//
// A heading whose first child isn't a numbered prefix at all is left
// alone, not rejected — see IMPLEMENTATION_PLAN.md 3.5's own reasoning for
// why this has to be true: GFM's synthetic footnotes heading must be able
// to coexist with a fully-numbered article without tripping contiguity.

import { visit } from 'unist-util-visit';

const H2_PATTERN = /^(\d{2})\s*·(\s*.*)$/s;
const H3_PATTERN = /^(\d+)\.(\d+)\s*·/;

export default function remarkSectionNumbers() {
  return (tree: any, file: any) => {
    const path = file.path ?? 'unknown file';
    let currentH2: number | null = null; // e.g. 5 (integer, from "05")

    visit(tree, 'heading', (node: any) => {
      if (node.depth !== 2 && node.depth !== 3) return;

      const first = node.children[0];
      if (!first || first.type !== 'text') return; // unnumbered — leave alone

      if (node.depth === 2) {
        const match = H2_PATTERN.exec(first.value);
        if (!match) return; // unnumbered h2 — leave alone (§3.5)

        const [, numStr, rest] = match;
        const expected = String(currentH2 === null ? 1 : currentH2 + 1).padStart(2, '0');
        if (numStr !== expected) {
          throw new Error(
            `${path}: h2 section numbers must run contiguously from 01 — ` +
              `expected "${expected}", found "${numStr}" (§6·06, ADR-0018).`,
          );
        }
        currentH2 = Number(numStr);

        const numberNode = {
          type: 'sectionNumber',
          data: {
            hName: 'span',
            hProperties: { className: ['section-number'] },
            hChildren: [{ type: 'text', value: numStr }],
          },
        };
        const restNode = { type: 'text', value: rest };
        node.children.splice(0, 1, numberNode, restNode);

        node.data = node.data || {};
        node.data.hProperties = { ...node.data.hProperties, 'data-section-num': numStr };
        return;
      }

      // depth === 3
      const match = H3_PATTERN.exec(first.value);
      if (!match) return; // unnumbered h3 — leave alone

      const [, majorStr] = match;
      if (currentH2 === null || Number(majorStr) !== currentH2) {
        throw new Error(
          `${path}: h3 "${first.value.trim()}" opens with "${majorStr}.…", which ` +
            `doesn't match its parent h2's number (${currentH2 ?? 'none yet'}) (§6·06).`,
        );
      }

      node.data = node.data || {};
      node.data.hProperties = {
        ...node.data.hProperties,
        'data-section-num': `${match[1]}.${match[2]}`,
      };
    });
  };
}
