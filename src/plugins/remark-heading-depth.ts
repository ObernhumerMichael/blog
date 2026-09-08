// remark-heading-depth.ts — Phase 3.3, brought forward from T1/Phase 8.
//
// Fails the build on any heading of depth >= 4 (§21.3, §18.3, and
// IMPLEMENTATION_PLAN.md §6 cross-entry invariant 6). Runs FIRST in the
// plugin chain, deliberately: remark-section-numbers.ts assumes it only
// ever sees h2/h3, and a raw h4 failing here reads as "you used a heading
// depth this system doesn't have" rather than as a confusing numbering
// error from a later plugin that was never designed to see one.

import { visit } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';

export default function remarkHeadingDepth() {
  return (tree: any, file: any) => {
    visit(tree, 'heading', (node: any) => {
      if (node.depth >= 4) {
        const text = toString(node);
        throw new Error(
          `${file.path ?? 'unknown file'}: heading depth ${node.depth} ("${text}") ` +
            'exceeds the system maximum of h3 (§21.3). Split into more h2 ' +
            'sections or restructure instead of introducing an h4.',
        );
      }
    });
  };
}
