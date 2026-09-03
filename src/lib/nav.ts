// nav.ts — pure logic extracted out of Masthead.astro so it's independently
// testable (same reasoning as theme-init.js in Phase 1.5: logic that's easy
// to get subtly wrong deserves a real test, not just "it built").

/**
 * §7.2's "current page" state. Exact match for the href itself, or a
 * path nested under it (so /writing/some-post still highlights "Writing").
 * Deliberately NOT a bare `startsWith` — that would make href="/" match
 * every path on the site, which is wrong the moment a homepage link exists
 * alongside the three nav destinations.
 */
export function isCurrentPath(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}
