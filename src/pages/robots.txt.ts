// Phase 5.10 follow-up — sitemap discovery (@astrojs/sitemap docs). Dynamic
// rather than a static public/robots.txt so the Sitemap: line reads
// `context.site` (ultimately SITE_URL, consts.ts) instead of a second
// hardcoded domain literal — OD-07's "one place to change" rule.
import type { APIRoute } from 'astro';

const getRobotsTxt = (sitemapURL: URL) => `User-agent: *
Allow: /

Sitemap: ${sitemapURL.href}
`;

export const GET: APIRoute = ({ site }) => {
  const sitemapURL = new URL('sitemap-index.xml', site);
  return new Response(getRobotsTxt(sitemapURL));
};
