// /rss.xml — IMPLEMENTATION_PLAN.md §5.10 point 1.
//
// @astrojs/rss is a function, not an integration — it just builds the feed
// string this endpoint returns. Items are non-draft `writing` entries only;
// `link` always points at the canonical /w/<num> permalink, never the
// /writing/<slug> redirect alias (AD-10).
import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { SITE_NAME, SITE_DESCRIPTION } from '../consts.ts';

export const GET: APIRoute = async (context) => {
  const entries = await getCollection('writing', (e) => !e.data.draft);
  const sorted = [...entries].sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    site: context.site!,
    items: sorted.map((entry) => ({
      title: entry.data.title,
      // §21.1: `lead` is already a single paragraph capped for exactly this
      // kind of summary use — no extra truncation logic needed.
      description: entry.data.lead,
      pubDate: entry.data.date,
      link: `/w/${String(entry.data.number).padStart(3, '0')}`,
    })),
  });
};
