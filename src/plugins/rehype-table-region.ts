// rehype-table-region.ts — Phase 4.7. §15.1 (table anatomy), §15.2 (tables
// at <760 — the scroll region, sticky first column), §15.3/E7 (middle-
// truncated digests), §18.2 (the region must be focusable and arrow-
// scrollable, labelled by its caption). §15.2 also specifies a scroll-edge
// fade and a `scroll →`/`← scroll` marker; both were built and then
// deliberately removed from tables — a direct, intentional deviation from
// that part of the design doc, not an oversight.
//
// A REHYPE plugin, not remark: unlike a fenced code block (remark-code-
// meta.ts's own reason for running early — rehypeShiki replaces the `<pre>`
// wholesale, so a wrapper has to be planted before that happens), nothing
// downstream ever touches a `<table>` element. GFM's own table handler
// (remark-rehype, mdast-util-to-hast) has already produced real
// `<table><thead>…</thead><tbody>…</tbody></table>` markup by the time any
// rehype plugin runs — there is no wholesale-replacement race to beat here,
// so there's no reason to do this earlier than rehype and reason enough not
// to: mdast has no equivalent per-column alignment information easier to
// read than the `align` attribute mdast-util-to-hast already writes onto
// each `<td>`/`<th>` (see isExplicitlyLeftAligned below), so waiting for
// hast is strictly simpler.
//
// Three things this plugin does, all inside one pass over the table
// subtree before wrapping it:
//   1. Reads the `align` attribute GFM already wrote per column
//      (mdast-util-to-hast's table handler: an EXPLICIT `:---`/`:---:`/
//      `---:` alignment marker becomes a literal `align="left"/"right"/
//      "center"` attribute; an unmarked column gets no `align` at all) to
//      mark a non-first, explicitly-left-aligned column as a PROSE cell
//      (§15.1: "a column carrying an explanation rather than data"). §7.5
//      of IMPLEMENTATION_PLAN.md's own Phase 4.7 section calls this out
//      directly: "reuse the column-alignment marker rather than inventing
//      an attribute". The numeric/date case needs nothing extra — the
//      same `align="right"` GFM already wrote is what right-aligns those
//      cells (as a native HTML presentational hint, honoured by the
//      browser with no CSS at all — blocks.css only adds the PROSE-cell
//      typographic override the alignment alone can't express, and is
//      careful not to write a competing `text-align` that would outrank
//      it; see that file's own comment on the point).
//   2. Middle-truncates an opaque machine identifier (E7/§15.3) sitting in
//      a data cell's inline `<code>` — splitting its text into a shrinking
//      "head" span and a fixed-width "tail" span (blocks.css's own
//      `text-overflow: ellipsis` truncates the head visually, never the
//      DOM text) is what makes hover (`title`) AND copy (native text
//      selection across both spans, which is never actually missing any
//      characters) both give the full string, per 4.7's own instruction —
//      no click-to-copy island needed, which matters because AD-11's
//      three-island budget is already spent.
//   3. Wraps the table in the `role="region"` scroll container itself,
//      labelled from the caption paragraph immediately following it in the
//      source (OD-13's authored-caption convention, read here as plain
//      text since the caption isn't promoted into its own structural
//      element until Phase 4.8 — see the fallback note below).
//
// Sticky-first-column is declared purely in blocks.css against
// `.table-region:first-child` — nothing here marks the first column
// specially, because CSS's own structural selector already identifies it
// without help.

import { visit, SKIP } from 'unist-util-visit';

// §15.3/E7: "opaque machine identifiers ... may be middle-truncated" — a
// judgement call on where "opaque" starts, not a value from the design
// doc. 20 characters clears every genuinely short identifier already
// authored in this codebase's own fixture (`pi-01`, `ansible-role`) while
// still catching a real digest/hash. TAIL matches §15.3's own worked
// example verbatim: `sha256:9f2b1c7ae4…d0c81a` keeps 6 trailing characters.
const DIGEST_MIN_LENGTH = 20;
const DIGEST_TAIL_LENGTH = 6;

// OD-13's own convention, already in use by the Phase 3/4 fixture ("_Table
// 1 — …_"): the caption is plain prose text immediately following the
// block, recognised by this prefix. Emphasis markers are stripped by
// reading `textContent` below rather than matching against raw markup, so
// "_Table 1 — …_" and "Table 1 — …" are read identically.
const CAPTION_RE = /^Table\s+\d+\s+—/;

function textContent(node: any): string {
  if (node.type === 'text') return node.value as string;
  if (Array.isArray(node.children)) {
    return node.children.map(textContent).join('');
  }
  return '';
}

function isBlankText(node: any): boolean {
  return (
    node?.type === 'text' && typeof node.value === 'string' && node.value.trim() === ''
  );
}

function addClass(node: any, className: string) {
  node.properties = node.properties ?? {};
  const existing = node.properties.className;
  node.properties.className = Array.isArray(existing)
    ? [...existing, className]
    : [className];
}

// mdast-util-to-hast writes column alignment as the legacy HTML `align`
// attribute (`align="left"`/`"right"`/`"center"` — confirmed against the
// real build output, NOT the inline `text-align` style this comment
// originally assumed from the package's newer table-handling code path;
// the installed @astrojs/markdown-remark's remark-rehype still takes the
// presentational-attribute branch) only when a column carries an EXPLICIT
// `:---`/`:---:`/`---:` marker; an unmarked column gets no `align`
// property at all. That absence is the signal this reads: "explicitly
// left" (prose cell) vs. "unspecified" (ordinary data cell, left-aligned
// only by browser default) are indistinguishable by rendered position
// alone, but not by whether GFM bothered to write an alignment for it.
function isExplicitlyLeftAligned(node: any): boolean {
  return node.properties?.align === 'left';
}

// §15.1: "a column carrying an explanation rather than data" describes a
// DATA cell, not a column label — the head row stays uniformly uppercase
// mono regardless of what a column holds (§15.1's own anatomy line makes
// no exception for it). Scoped to `<td>` only (never `<th>`) for that
// reason, and to non-first columns (the `i === 0` guard below), since the
// identifying first column is already its own thing (sticky, never
// mono-numeric).
function markProseCells(table: any) {
  visit(table, 'element', (node: any) => {
    if (node.tagName !== 'tr') return;
    const cells = node.children.filter(
      (child: any) => child.type === 'element' && child.tagName === 'td',
    );
    cells.forEach((cell: any, i: number) => {
      if (i === 0) return;
      if (isExplicitlyLeftAligned(cell)) addClass(cell, 'table-region__cell--prose');
    });
  });
}

// §15.3/E7. Only `<td>` — a `<th>` is a short column label, never an
// identifier, and splitting it would risk breaking the uppercase head-row
// treatment (blocks.css) for no real case that exists.
function truncateDigests(table: any) {
  visit(table, 'element', (node: any, index: number | undefined, parent: any) => {
    if (node.tagName !== 'code') return;
    if (parent?.tagName !== 'td') return;

    const full = textContent(node);
    if (full.length < DIGEST_MIN_LENGTH) return;

    const head = full.slice(0, full.length - DIGEST_TAIL_LENGTH);
    const tail = full.slice(full.length - DIGEST_TAIL_LENGTH);

    node.properties = node.properties ?? {};
    node.properties.title = full; // hover — the full value, per 4.7's own
    // "<span title> with the full value" instruction. `<code>` itself
    // carries it rather than an extra wrapping span, since this element
    // already exists and already carries the inline-code chip styling
    // (prose.css `.prose :not(pre) > code`) both halves need to inherit.
    node.children = [
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['table-region__digest-head'] },
        children: [{ type: 'text', value: head }],
      },
      {
        type: 'element',
        tagName: 'span',
        properties: { className: ['table-region__digest-tail'] },
        children: [{ type: 'text', value: tail }],
      },
    ];

    if (index === undefined) return;
    // Bare SKIP — same infinite-recursion trap remark-code-meta.ts and
    // remark-directives.ts both document: the two new spans are real text,
    // not another `code` element, so there is nothing left to re-match
    // here, but SKIP is cheap insurance against ever visiting the just-
    // rewritten children a second time.
    return SKIP;
  });
}

export default function rehypeTableRegion() {
  return (tree: any) => {
    visit(tree, 'element', (node: any, index: number | undefined, parent: any) => {
      if (node.tagName !== 'table') return;
      if (index === undefined) return;

      markProseCells(node);
      truncateDigests(node);

      // OD-13's convention, read as plain text rather than waiting for
      // Phase 4.8's promotion — that phase turns this same paragraph into
      // a real, numbered `Table n —` caption component; until then it is
      // still a bare `<p>` sitting right after the table in the tree,
      // exactly where 4.8 will find it too. No caption is not an error at
      // this stage (T1's cross-entry invariants don't require one until
      // 4.8's validator lands) — it falls back to a generic label rather
      // than leaving the region unlabelled.
      // Real gap, found against the actual build output rather than
      // assumed: mdast-util-to-hast leaves a bare `{type:'text', value:
      // '\n'}` between adjacent block elements (the raw newline from the
      // source), so the caption paragraph is at index+2, not index+1.
      // Skip whitespace-only text nodes rather than hardcoding an offset —
      // the exact count isn't a guarantee this file should depend on.
      let siblingIndex = index + 1;
      while (isBlankText(parent?.children?.[siblingIndex])) siblingIndex += 1;
      const sibling = parent?.children?.[siblingIndex];
      // A hard-wrapped source paragraph carries its own line breaks as
      // literal "\n" characters in the mdast/hast text — real, and
      // visible directly in the built `aria-label` before this collapse
      // was added, not a hypothetical. An accessible name isn't rendered
      // text, so it gets the same whitespace-collapse a browser applies
      // to visible inline content, rather than shipping raw source line
      // breaks into the attribute.
      const captionText =
        sibling?.type === 'element' && sibling.tagName === 'p'
          ? textContent(sibling).replace(/\s+/g, ' ').trim()
          : '';
      const ariaLabel = CAPTION_RE.test(captionText) ? captionText : 'Table';

      // One wrapper: it is both the `overflow-x: auto` scroller and the
      // element carrying the interactive/accessible bits (`tabindex`,
      // `role`, `aria-label` have to be on whatever's actually focusable
      // and scrollable). Table 4.7 shipped with a second, non-scrolling
      // outer div here too, needed only to anchor the fade/`scroll →`
      // marker affordances' `position: absolute` against something that
      // never itself scrolled — with those affordances removed, that
      // second element has nothing left to do.
      const region = {
        type: 'element',
        tagName: 'div',
        properties: {
          className: ['table-region'],
          tabIndex: 0,
          role: 'region',
          'aria-label': ariaLabel,
        },
        children: [node],
      };

      parent.children[index] = region;
      // Bare SKIP, not `[SKIP, index]` (remark-code-meta.ts/remark-
      // directives.ts's own documented trap) — `node` is nested unchanged
      // inside `region`, still typed 'table'; [SKIP, index] would resume
      // the walk AT this index and match it again, wrapping forever.
      return SKIP;
    });
  };
}
