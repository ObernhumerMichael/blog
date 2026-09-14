// remark-captions.ts — Phase 4.8, OD-13. §13.2/§14.2/§15.1 all require a
// numbered caption ("Listing n —", "Fig. n —", "Table n —") on every code/
// terminal, figure and table block. Markdown has no syntax for any of the
// three, so OD-13 settled on the same authoring trade-off already made for
// heading numbers (OD-10/ADR-0018): the number is AUTHORED, not generated —
// one authoring model, the number is visible in the diff when it changes,
// and prose that says "see Listing 3" stays true because the author wrote
// both. This plugin's job is purely mechanical given that decision, mirroring
// remark-section-numbers.ts's own split: recognise the convention, validate
// contiguity, and promote the paragraph into a styled caption.
//
// The convention (already in informal use by the Phase 3/4 fixture, "_Table
// 1 — …_"): a caption is the paragraph beginning "Fig. n — " / "Listing n —
// " / "Table n — " that sits immediately after the block it describes — for
// code, terminal and table blocks, as the next sibling in the tree; for a
// figure, as the remaining child inside the directive (OD-13: "figures are
// the one kind where the caption sits inside the directive"). Code and
// terminal share the SAME "Listing" counter (§14.2 gives "Listing n —" to
// "code" as a category, not to component 19 specifically — the reference
// frames caption a terminal block as "Listing 2", the only evidence either
// way, and §23.4's "share nothing else" framing makes the caption class the
// one deliberate exception already).
//
// MUST run after remark-code-meta.ts (needs `codeBlockWrapper`/
// `termBlockWrapper` already built) and after remark-directives.ts (needs
// `figureWrapper` already built) — see astro.config.mjs's own ordering
// comment. Runs on plain mdast `table` nodes directly: nothing between here
// and rehype-table-region.ts (a REHYPE plugin, Phase 4.7) touches a table,
// so there is no wrapper to wait for on that side.
//
// Promotion technique is the same hName/hProperties convention as every
// other plugin in this pipeline (remark-directives.ts, remark-code-meta.ts):
// the caption paragraph's OWN node is kept (so its `paragraph` type still
// satisfies "the next sibling is a paragraph" checks elsewhere and its
// position in the tree is untouched — Phase 4.8 promotes it in place rather
// than replacing it with a synthetic node), just given
// `data.hName = 'p'` (redundant — mdast-util-to-hast already renders a
// paragraph as `<p>` — but explicit, matching the "styled by class
// regardless of whether that turns out to be a real `<figcaption>` or a
// `<p>`" line code.css's forward declaration already committed to) and
// `hProperties.className = ['code-block__caption']` — ONE caption class
// shared by all four block kinds (code.css §14.2 comment: "one numbered-
// caption type treatment for every block kind"), not four separate ones.
//
// Emphasis is stripped (not merely left to inherit a non-italic style): a
// caption authored as "_Table 1 — …_" (the fixture's own convention, and a
// natural instinct — captions read like captions) would otherwise render
// inside a stray `<em>` with no visual effect of its own today, but would
// break the moment any future rule gives `em` a style, and OD-13 states
// plainly the caption "has its own type treatment and does not inherit
// italics". Unwrapping the mdast `emphasis` node (rather than overriding
// `font-style` in CSS) means there is no `<em>` in the rendered caption to
// begin with — nothing to override.

const CAPTION_RE = /^(Fig\.|Listing|Table)\s+(\d+)\s+—/;

type Kind = 'figure' | 'listing' | 'table';

const KIND_LABEL: Record<Kind, string> = {
  figure: 'Fig.',
  listing: 'Listing',
  table: 'Table',
};

const LABEL_TO_KIND: Record<string, Kind> = {
  'Fig.': 'figure',
  Listing: 'listing',
  Table: 'table',
};

function textContent(node: any): string {
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
  if (Array.isArray(node.children)) return node.children.map(textContent).join('');
  return '';
}

// OD-13: "Emphasis markers in the source ... are dropped: the caption has
// its own type treatment and does not inherit italics." Unwraps every
// `emphasis` node found anywhere in the caption (not just a single
// whole-paragraph wrap), recursively, so "_Table 1 — …_" and "Table 1 —
// *some emphasised word* here" both lose their `<em>` the same way.
function stripEmphasis(node: any) {
  if (!Array.isArray(node.children)) return;
  const next: any[] = [];
  for (const child of node.children) {
    stripEmphasis(child);
    if (child.type === 'emphasis') {
      next.push(...child.children);
    } else {
      next.push(child);
    }
  }
  node.children = next;
}

function promote(paragraph: any) {
  stripEmphasis(paragraph);
  paragraph.data = paragraph.data || {};
  paragraph.data.hName = 'p';
  paragraph.data.hProperties = {
    ...paragraph.data.hProperties,
    className: ['code-block__caption'],
  };
}

export default function remarkCaptions() {
  return (tree: any, file: any) => {
    const path = file.path ?? 'unknown file';
    const counters: Record<Kind, number> = { figure: 0, listing: 0, table: 0 };

    function validate(paragraph: any | undefined, kind: Kind, context: string) {
      const text =
        paragraph && paragraph.type === 'paragraph' ? textContent(paragraph).trim() : '';
      const match = CAPTION_RE.exec(text);

      if (!match) {
        throw new Error(
          `${path}: ${context} has no caption. §13.2/§14.2/§15.1 require a ` +
            `"${KIND_LABEL[kind]} n — …" caption immediately after every ` +
            'code/terminal, figure or table block (OD-13).',
        );
      }

      const [, label, numStr] = match;
      const foundKind = LABEL_TO_KIND[label];
      if (foundKind !== kind) {
        throw new Error(
          `${path}: ${context} is captioned "${label} ${numStr} —", but ` +
            `should use "${KIND_LABEL[kind]}" — code and terminal blocks ` +
            'share one "Listing" counter, figures use "Fig." and tables ' +
            'use "Table" (§14.2, OD-13).',
        );
      }

      const num = Number(numStr);
      const expected = counters[kind] + 1;
      if (num !== expected) {
        throw new Error(
          `${path}: "${KIND_LABEL[kind]}" captions must run contiguously ` +
            `from 1 — expected "${KIND_LABEL[kind]} ${expected} —", found ` +
            `"${KIND_LABEL[kind]} ${num} —" (OD-13, mirroring ADR-0018's ` +
            'section-number contiguity rule).',
        );
      }

      counters[kind] = num;
      promote(paragraph);
    }

    // A manual index walk over `tree.children`, not `unist-util-visit` —
    // every captionable block here is a root-level sibling of its own
    // caption (or, for a figure, a sibling of its media inside one
    // directive), and consuming a caption has to advance the index PAST
    // it so the loop's own orphan-caption check (below) doesn't re-visit
    // the paragraph it just promoted and flag it as following nothing
    // captionable. `visit`'s callback-per-node model has no equivalent
    // "skip the node I already handled" primitive for two root siblings
    // at once; a plain index gives that directly.
    const children = tree.children as any[];
    let i = 0;
    while (i < children.length) {
      const node = children[i];

      if (node.type === 'codeBlockWrapper' || node.type === 'termBlockWrapper') {
        const sibling = children[i + 1];
        const context =
          node.type === 'codeBlockWrapper' ? 'a code block' : 'a terminal block';
        validate(sibling, 'listing', context);
        i += 2;
        continue;
      }

      if (node.type === 'table') {
        validate(children[i + 1], 'table', 'a table');
        i += 2;
        continue;
      }

      if (node.type === 'figureWrapper') {
        // OD-13: the caption sits INSIDE the directive, as the first
        // paragraph after `figureMedia` (index 0) rather than as a
        // following sibling — see remark-directives.ts's own note on why
        // figures are the one kind shaped this way.
        const caption = node.children
          .slice(1)
          .find((child: any) => child.type === 'paragraph');
        validate(caption, 'figure', 'a figure');
        i += 1;
        continue;
      }

      if (node.type === 'paragraph') {
        // A caption-shaped paragraph that wasn't consumed above as a real
        // caption (by the two `i += 2` branches, which skip past the
        // sibling they just validated) is one that follows nothing
        // captionable — OD-13's third failure mode.
        const text = textContent(node).trim();
        if (CAPTION_RE.test(text)) {
          throw new Error(
            `${path}: the caption "${text}" doesn't immediately follow a ` +
              'code, terminal, figure or table block — a caption must sit ' +
              'directly after the block it describes (OD-13).',
          );
        }
      }

      i += 1;
    }
  };
}
