import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { site } from '@/data/site';
import { getEssays } from '@/lib/content';

export const GET: APIRoute = async (context) => {
  const essays = await getEssays();
  return rss({
    title: `${site.name} — Essays`,
    description: 'Essays on philosophy, artificial intelligence, mind, ethics and epistemology.',
    site: context.site ?? site.url,
    items: essays.map((e) => ({
      title: e.data.title,
      description: e.data.description,
      pubDate: e.data.date,
      link: `/essays/${e.id}`,
      categories: e.data.tags,
      author: site.name,
    })),
    customData: `<language>en</language>`,
    stylesheet: false,
  });
};
