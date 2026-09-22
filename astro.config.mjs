// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import { unified } from '@astrojs/markdown-remark';
import { remarkReadingTime } from './src/lib/remark-reading-time.mjs';

export default defineConfig({
  site: 'https://abhinavsaxena.in',
  trailingSlash: 'ignore',
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'hover',
  },
  integrations: [
    mdx(),
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      filter: (page) => !page.includes('/404'),
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
