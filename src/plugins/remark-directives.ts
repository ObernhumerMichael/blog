// remark-directives.ts — Phase 3.3, AD-04's mechanism finally used.
// Extended Phase 4.6 to add `:::figure` (§7.3 of IMPLEMENTATION_PLAN.md,
// §14.1/§14.2) — kept in this file rather than a second plugin because the
// containerDirective-matching and language-agnostic error-on-anything-else
// fallthrough below is identical machinery for both; only the shape of the
// emitted wrapper differs.
//
// Must run AFTER the `remark-directive` package in the plugin chain — that
// package is what turns `:::name` container syntax into `containerDirective`
// mdast nodes in the first place; without it running first, `:::note` is
// still plain paragraph text by the time this plugin looks for it.
//
// Transforms `:::note` / `:::warning` / `:::correction` into §6·10's
// callout markup, `:::figure{kind="…"}` into §14.1's figure markup, and
// FAILS THE BUILD on anything else. Also enforces §6·10's two structural
// rules directly: a callout is never nested, and never contains a code
// block.

import { visit, SKIP, EXIT } from 'unist-util-visit';
import { FIGURE_KINDS } from '../consts.ts';

const CALLOUT_KINDS: Record<string, string> = {
  note: 'NOTE',
  warning: 'WARNING',
  correction: 'CORRECTION',
};

const VALID_FIGURE_KINDS = new Set<string>(FIGURE_KINDS);

// §18.6 / cross-entry invariant 7: decorative images do not exist in this
// design, so an empty (or whitespace-only) alt is an authoring mistake,
// not a valid choice — fail the build rather than ship an unlabelled image.
function findFigureImage(node: any): { image: any; holder: any; index: number } | null {
  let found: { image: any; holder: any; index: number } | null = null;
  visit(node, 'image', (image: any, index: number | undefined, holder: any) => {
    if (index === undefined) return;
    found = { image, holder, index };
    return EXIT;
  });
  return found;
}

function buildFigureNode(node: any, path: string) {
  const kind = node.attributes?.kind;

  if (!kind) {
    throw new Error(
      `${path}: a ":::figure" directive has no kind="…". §7.3 requires ` +
        'one of "diagram", "screenshot" or "photo" on every figure — dark' +
        ' mode dimming (E15) and the screenshot ground (§14.1) both depend' +
        ' on it, and neither can be inferred from the markup. Add e.g.' +
        ' :::figure{kind="diagram"}.',
    );
  }

  if (!VALID_FIGURE_KINDS.has(kind)) {
    throw new Error(
      `${path}: unknown figure kind "${kind}". Valid kinds: ` +
        `${FIGURE_KINDS.join(', ')} (§7.3).`,
    );
  }

  const found = findFigureImage(node);
  if (!found) {
    throw new Error(
      `${path}: a ":::figure" directive contains no image. Author it as` +
        ' :::figure{kind="…"} wrapping a standard ![alt](src) image' +
        ' (§14.1) — a figure with nothing to show is an authoring mistake.',
    );
  }

  const { image, holder, index } = found;
  const alt = typeof image.alt === 'string' ? image.alt.trim() : '';
  if (!alt) {
    throw new Error(
      `${path}: figure image "${image.url}" has no alt text. §18.6:` +
        ' decorative images do not exist in this design — an empty alt is' +
        ' an authoring mistake, not a valid choice.',
    );
  }

  // Drop the (now-empty, or now-just-the-image) paragraph the image lived
  // in from the directive's own children, so it isn't rendered a second
  // time as an empty <p> beside the media wrapper below. If the image sat
  // alongside other inline content in the same paragraph, only the image
  // itself is removed — the rest of that paragraph's text is real prose
  // and stays where it was.
  const isSoleChild = holder.children.every(
    (child: any, i: number) => i === index || isBlankText(child),
  );

  if (holder === node) {
    // The image is a direct child of the directive itself (no enclosing
    // paragraph) — not how CommonMark normally parses a standalone image,
    // but handled directly rather than relying on the indexOf lookup below,
    // which cannot find `holder` inside its own children array.
    node.children.splice(index, 1);
  } else if (isSoleChild) {
    const parentIndex = node.children.indexOf(holder);
    if (parentIndex !== -1) node.children.splice(parentIndex, 1);
  } else {
    holder.children.splice(index, 1);
  }

  // Tap-to-full-size on wide diagrams (§14.3, §14.4), below 760 — a plain
  // <a>, no lightbox, no island (§12 has no modal). Restricted to an
  // absolute (`/…`) source: that is a public/ asset served at that exact
  // path untouched by Astro's image pipeline (AD-12's own §7.3 note), so
  // linking straight to it is guaranteed correct. A collection-relative
  // source gets optimised into a hashed `/_astro/…` URL by
  // remarkCollectImages AFTER this plugin runs — this plugin never sees
  // that final URL, so wrapping it here would link to a build-time source
  // path that doesn't exist in the deployed output. Left unwrapped rather
  // than shipping a broken link; revisit once a rehype-stage hook can read
  // the resolved src.
  const mediaChildren =
    kind === 'diagram' && typeof image.url === 'string' && image.url.startsWith('/')
      ? [
          {
            type: 'link',
            url: image.url,
            title: null,
            children: [image],
            data: { hProperties: { target: '_self', className: ['figure__link'] } },
          },
        ]
      : [image];

  return {
    type: 'figureWrapper',
    data: {
      hName: 'figure',
      hProperties: { className: ['figure'], 'data-kind': kind },
    },
    children: [
      {
        type: 'figureMedia',
        data: { hName: 'div', hProperties: { className: ['figure__media'] } },
        children: mediaChildren,
      },
      // Remaining children — a caption paragraph (`Fig. n — …`), if
      // authored, and any other prose — stay INSIDE the figure (OD-13:
      // "figures are the one kind where the caption sits inside the
      // directive"). Numbering/promotion into a real caption component is
      // Phase 4.8's job; today this renders as plain prose text, same as
      // code/table captions do until that phase lands.
      ...node.children,
    ],
  };
}

function isBlankText(node: any) {
  return (
    node.type === 'text' && typeof node.value === 'string' && node.value.trim() === ''
  );
}

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

      if (name === 'figure') {
        if (node.type !== 'containerDirective') {
          throw new Error(
            `${path}: "figure" must be a container directive — write it ` +
              'as ":::figure{kind=\\"…\\"}" (triple colon), not a single ' +
              'or double colon.',
          );
        }
        const figureNode = buildFigureNode(node, path);
        if (index === undefined) return;
        parent.children[index] = figureNode;
        return SKIP; // same infinite-recursion trap as remark-code-meta.ts:
        // the wrapper nests the ORIGINAL image node unchanged, so
        // `[SKIP, index]` would re-visit and re-wrap it forever.
      }

      const label = CALLOUT_KINDS[name];

      if (node.type !== 'containerDirective' || !label) {
        throw new Error(
          `${path}: directive ":::${name}" is not implemented. Only ` +
            '":::note", ":::warning", ":::correction" and ":::figure" ' +
            'exist (§6·10, §7.3) — any other directive is not authored yet.',
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
