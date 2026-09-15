// IMPLEMENTATION_PLAN.md §5.8 point 3, §10.7: related articles are
// tag-overlap count, ties broken by same section, then by recency. The
// "logic easy to get subtly wrong" bar nav.ts's own comment sets — a real
// file and a node:test, not an inline .sort() in the page.

export interface RelatableEntry {
  number: number;
  tags: readonly string[];
  section: string;
  date: Date;
}

// §5.0's resolved note: an invented number, same category as the row-count
// values elsewhere in this plan — four fills the two-column related grid
// (§10.7) in two clean rows.
export const RELATED_COUNT = 4;

export function findRelated<T extends RelatableEntry>(current: T, candidates: T[]): T[] {
  return candidates
    .filter((entry) => entry.number !== current.number)
    .map((entry) => ({
      entry,
      overlap: entry.tags.filter((tag) => current.tags.includes(tag)).length,
    }))
    .filter((scored) => scored.overlap > 0)
    .sort((a, b) => {
      if (a.overlap !== b.overlap) return b.overlap - a.overlap;
      const aSameSection = a.entry.section === current.section;
      const bSameSection = b.entry.section === current.section;
      if (aSameSection !== bSameSection) return aSameSection ? -1 : 1;
      return b.entry.date.getTime() - a.entry.date.getTime();
    })
    .slice(0, RELATED_COUNT)
    .map((scored) => scored.entry);
}
