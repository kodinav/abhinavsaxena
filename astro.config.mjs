// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';
import { readdirSync, readFileSync } from 'node:fs';

/**
 * When each dated page last changed, read from its frontmatter (`updated`,
 * else `date`, else the paper's `published` or `accepted`), so the sitemap
 * only claims dates that are true. Undated pages get none.
 */
function contentDates() {
  const dates = new Map();
  /** @param {string} fm @param {string[]} keys */
  const pick = (fm, keys) => { for (const k of keys) { const m = fm.match(new RegExp(`^${k}: ['"]?(\\d{4}-\\d{2}-\\d{2})`, 'm')); if (m) return m[1]; } return null; };
  /** @type {[string, string, string[]][]} */
  const sections = [
    ['essays', 'essays', ['updated', 'date']],
    ['questions', 'questions', ['updated', 'date']],
    ['publications', 'publications', ['published', 'accepted']],
  ];
  for (const [dir, route, keys] of sections) {
    for (const file of readdirSync(`./src/content/${dir}`)) {
      const fm = readFileSync(`./src/content/${dir}/${file}`, 'utf8').split('---')[1] ?? '';
      const d = pick(fm, keys);
      if (d) dates.set(`/${route}/${file.replace(/\.mdx?$/, '')}`, d);
    }
  }
  return dates;
}
const lastmods = contentDates();

export default defineConfig({
  site: 'https://abhinavsaxena.in',
  trailingSlash: 'always',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [
    mdx(),
    // workbenches that exist only on the development server, never in the built site
    {
      name: 'dev-workbenches',
      hooks: {
        'astro:config:setup': ({ command, injectRoute }) => {
          if (command === 'dev') injectRoute({ pattern: '/puppet-lab', entrypoint: './src/dev/puppet-lab.astro' });
        },
      },
    },
    sitemap({
      filter: (page) => !page.includes('/404'),
      serialize(item) {
        const path = new URL(item.url).pathname.replace(/\/$/, '');
        const d = lastmods.get(path);
        return d ? { ...item, lastmod: new Date(d).toISOString() } : item;
      },
    }),
  ],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime],
      gfm: true,
      smartypants: true,
    }),
    shikiConfig: {
      themes: { light: 'github-light', dark: 'github-dark' },
      wrap: true,
    },
  },
  fonts: [
    {
      provider: fontProviders.local(),
      name: 'Newsreader',
      cssVariable: '--font-serif',
      fallbacks: ['Georgia', 'Times New Roman', 'serif'],
      display: 'swap',
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/newsreader-latin-standard-normal.woff2'],
            weight: '200 800',
            style: 'normal',
          },
          {
            src: ['./src/assets/fonts/newsreader-latin-wght-italic.woff2'],
            weight: '200 800',
            style: 'italic',
          },
        ],
      },
    },
    {
      provider: fontProviders.local(),
      name: 'Instrument Sans',
      cssVariable: '--font-sans',
      fallbacks: ['Helvetica Neue', 'Arial', 'sans-serif'],
      display: 'swap',
      options: {
        variants: [
          {
            src: ['./src/assets/fonts/instrument-sans-latin-wght-normal.woff2'],
            weight: '400 700',
            style: 'normal',
          },
          {
            src: ['./src/assets/fonts/instrument-sans-latin-wght-italic.woff2'],
            weight: '400 700',
            style: 'italic',
          },
        ],
      },
    },
  ],
  build: {
    inlineStylesheets: 'always',
  },
  vite: {
    build: {
      cssMinify: 'lightningcss',
    },
  },
});
