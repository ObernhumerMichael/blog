// IMPLEMENTATION_PLAN.md §5.5 point 2: `writing` has no authored `slug`
// field — deriving it from `title` avoids a second identifier that can
// drift out of sync. ASCII-folds diacritics (OD-05: German, later) via the
// stdlib `normalize('NFKD')` rather than a transliteration dependency.

export function slugify(title: string): string {
  return title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
