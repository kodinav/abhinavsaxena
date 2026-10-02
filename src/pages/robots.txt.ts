import type { APIRoute } from 'astro';
import { site } from '@/data/site';

/**
 * Everything is open to every crawler. The search and answer engines that
 * build AI summaries are named explicitly, since being read and cited by them
 * is part of the point of the site's reference pages.
 */
const aiAgents = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
  'ClaudeBot', 'Claude-SearchBot', 'Claude-User',
  'PerplexityBot', 'Perplexity-User',
  'Google-Extended', 'Applebot-Extended', 'CCBot', 'Meta-ExternalAgent', 'Amazonbot', 'DuckAssistBot', 'MistralAI-User',
];

export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      '',
      ...aiAgents.flatMap((a) => [`User-agent: ${a}`, 'Allow: /', '']),
      `Sitemap: ${site.url}/sitemap-index.xml`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
