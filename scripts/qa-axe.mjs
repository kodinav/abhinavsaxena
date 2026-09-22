import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { serveDist } from './serve.mjs';
const PORT = 4394; const server = await serveDist(PORT);
const browser = await chromium.launch();
const pages = ['/', '/research', '/research/philosophy-of-ai', '/publications', '/essays', '/essays/knowing-without-a-knower', '/lab', '/lab/mind-detector', '/ideas', '/about', '/cv', '/contact'];
let total = 0;
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme });
  const page = await ctx.newPage();
  for (const p of pages) {
    await page.goto(`http://localhost:${PORT}${p}`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);
    if (p.startsWith('/lab/')) await page.waitForSelector('.lab-stage.is-ready');
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice']).analyze();
    const v = res.violations;
    total += v.length;
    if (v.length) { console.log(`\n[${theme}] ${p}`); for (const x of v) console.log(`  ${x.impact?.toUpperCase()} ${x.id}: ${x.help} (${x.nodes.length} nodes) e.g. ${x.nodes[0].target.join(' ')}`); }
  }
  await ctx.close();
}
console.log(`\naxe violations total: ${total}`);
await browser.close(); server.close();
