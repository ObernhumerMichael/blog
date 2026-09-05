// Single source of truth for the site's canonical URL.
//
// OD-07: the real domain isn't finalized yet. This constant — and
// astro.config.mjs's `site` field — are the ONLY two places a bare URL
// literal is allowed. Every RSS feed, sitemap entry, canonical <link>,
// og:url, and the AD-12 Now-panel fetch target must import SITE_URL from
// here, so resolving OD-07 later is a one-line change in two files, not a
// grep across the codebase.
export const SITE_URL = 'https://obernhumer.com';

export const SITE_NAME = 'Michael Obernhumer';

// §7.1 — role text under the wordmark in the masthead.
export const SITE_ROLE = 'backend · infrastructure';

// §7.1 — exactly three destinations. Do not add a fourth without revisiting
// OD-02 (CTF-as-tag) and IMPLEMENTATION_PLAN.md AD-03 first.
//
// `collection` names which real Astro content collection backs this
// destination's count in the mobile menu panel (§7.5: "Writing 38",
// "Projects 6", "About —"). `null` is explicit, not an omission — About has
// no collection behind it, and the panel renders the literal em dash for
// that case rather than a fabricated number (content brief: no invented
// metrics). Until Phase 5 populates real content, Writing/Projects will
// honestly show 0 — correct, not a bug.
export const NAV_LINKS = [
  { label: 'Writing', href: '/writing', collection: 'writing' },
  { label: 'Projects', href: '/projects', collection: 'projects' },
  { label: 'About', href: '/about', collection: null },
] as const;

// §7.5's mobile menu final row: `rss ↗ · github ↗ · pgp ↗`.
//
// PLACEHOLDERS — same pattern as OD-07's SITE_URL: real values needed before
// launch, but a build must not block on them. RSS_PATH is the one exception
// that isn't a placeholder — it's a stable route this site will always use,
// even though Phase 5 hasn't built the feed generator yet.
export const RSS_PATH = '/rss.xml';
export const GITHUB_URL = 'https://github.com/TODO-set-real-username';
export const PGP_URL = '/TODO-set-real-pgp-key.asc';
export const SITE_LINKS = {
  rss: RSS_PATH,
  github: GITHUB_URL,
  pgp: PGP_URL,
};
