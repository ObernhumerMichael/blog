// shiki-diff-lines.ts — Phase 4.3. §13.2 "Diff": the leading +/− glyph is
// mandatory and already lives in the DOM (Finding D, Phase 4.0 — Astro's
// own Shiki wrapper splits it into a `user-select: none` span on its own,
// confirmed by reading the built output, not assumed); "the tint is
// secondary" is the one piece that was still missing, and needs a
// transformer because it has to mark the LINE itself, not a token inside
// it — the diff grammar colours the `+`/`−` text via `markup.inserted`/
// `markup.deleted` scopes (shiki-ledger-theme.json), which says nothing
// about the line as a whole.
//
// No official @shikijs/transformers helper does this: transformerNotationDiff
// is for `[!code ++]`/`[!code --]` COMMENT notation, not the real `diff`
// grammar's literal leading `+`/`-`/` ` this site's fences use (confirmed
// by reading its source — it looks for a notation comment token, which a
// `diff`-language fence never produces). This reads the raw source line
// instead: the diff grammar's OWN convention is that column 0 of every line
// is the marker, so checking `this.source`'s line directly is exactly what
// the grammar itself keys off, not a re-implementation of it.

import type { ShikiTransformer } from 'shiki';

export default function shikiDiffLines(): ShikiTransformer {
  return {
    name: 'ledger:diff-lines',
    line(hast, lineNumber) {
      if (this.options.lang !== 'diff') return;

      const sourceLine = this.source.split('\n')[lineNumber - 1] ?? '';
      const marker = sourceLine[0];

      if (marker === '+') {
        this.addClassToHast(hast, 'diff-add');
      } else if (marker === '-') {
        this.addClassToHast(hast, 'diff-del');
      }
    },
  };
}
