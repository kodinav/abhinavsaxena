/**
 * QA screenshots of the built site (run `npm run build` first).
 * Writes qa/<page>-<viewport>-<theme>.png for visual inspection.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { serveDist } from './serve.mjs';

const PORT = 4399;
const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/research', '/research/philosophy-of-ai', '/publications', '/essays', '/essays/knowing-without-a-knower', '/lab', '/lab/mind-detector', '/ideas', '/about', '/cv', '/contact', '/404'];
const viewports = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const themes = ['light', 'dark'];

const server = await serveDist(PORT);
await mkdir('qa', { recursive: true });
const browser = await chromium.launch();
for (const [vname, vp] of Object.entries(viewports)) {
  for (const theme of themes) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: theme, isMobile: vname === 'mobile', hasTouch: vname === 'mobile' });
    for (const p of pages) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(`http://localhost:${PORT}${p}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1200);
      const name = (p === '/' ? 'home' : p.replace(/^\//, '').replace(/\//g, '_'));
      await page.screenshot({ path: `qa/${name}-${vname}-${theme}-fold.png` });
      // scroll through so reveal-on-scroll content is visible in the full capture
      await page.evaluate(async () => {
        document.documentElement.style.scrollBehavior = 'auto';
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(900);
      await page.screenshot({ path: `qa/${name}-${vname}-${theme}.png`, fullPage: true });
      if (errors.length) console.log(`[${p} ${vname} ${theme}] errors:`, errors);
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log('screenshots written to qa/');
