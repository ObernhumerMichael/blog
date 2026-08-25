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
export const NAV_LINKS = [
  { label: 'Writing', href: '/writing' },
  { label: 'Projects', href: '/projects' },
  { label: 'About', href: '/about' },
] as const;
