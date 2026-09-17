// IMPLEMENTATION_PLAN.md 6.5 point 3: year-band grouping for the Writing
// index and its tag-filtered derivatives (6.6). Same "logic easy to get
// subtly wrong" bar related.ts/nav.ts already set — a real file and a
// node:test, not an inline .sort()/.reduce() in the page.

export interface YearGroup<T> {
  year: number;
  count: number;
  entries: T[];
}

/** Descending by year; entries within a year newest-first (§19.2). */
export function groupByYear<T extends { date: Date }>(entries: T[]): YearGroup<T>[] {
  const byYear = new Map<number, T[]>();
  for (const entry of entries) {
    const year = entry.date.getFullYear();
    const group = byYear.get(year);
    if (group) group.push(entry);
    else byYear.set(year, [entry]);
  }
  return [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, group]) => ({
      year,
      count: group.length,
      entries: [...group].sort((a, b) => b.date.getTime() - a.date.getTime()),
    }));
}

/** How many entries carry each tag — the filter row's `#infrastructure 11`
 * counts (§19.2, 6.5 point 1). Registry tags with zero matches are the
 * caller's job to drop (the page iterates TAGS in registry order, 6.1). */
export function countTags<T extends { tags: readonly string[] }>(
  entries: T[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    for (const tag of entry.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return counts;
}
