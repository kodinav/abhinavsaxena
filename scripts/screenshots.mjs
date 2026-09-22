/**
 * QA screenshots of the built site (run `npm run build` first).
 * Writes qa/<page>-<viewport>-<theme>.png for visual inspection.
 */
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import { serveDist } from './serve.mjs';

const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['/', '/research', '/research/philosophy-of-ai', '/publications', '/essays', '/essays/knowing-without-a-knower', '/lab', '/lab/mind-detector', '/ideas', '/about', '/cv', '/contact', '/404'];
const viewports = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const themes = ['light', 'dark'];

const server = await serveDist(0); const PORT = server.port;
await mkdir('qa', { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
for (const [vname, vp] of Object.entries(viewports)) {
  for (const theme of themes) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, colorScheme: theme, isMobile: vname === 'mobile', hasTouch: vname === 'mobile' });
    await ctx.addInitScript((t) => { try { sessionStorage.setItem('intro-seen', '1'); localStorage.setItem('theme', t); } catch {} }, theme);
    for (const p of pages) {
      const page = await ctx.newPage();
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      await page.goto(`http://localhost:${PORT}${p}`, { waitUntil: 'load' });
      await page.waitForFunction(() => document.documentElement.classList.contains('is-ready'), null, { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(2200);
      const name = (p === '/' ? 'home' : p.replace(/^\//, '').replace(/\//g, '_'));
      await page.screenshot({ path: `qa/${name}-${vname}-${theme}-fold.png`, timeout: 120000 });
      // scroll through so reveal-on-scroll content is visible in the full capture
      await page.evaluate(async () => {
        document.documentElement.style.scrollBehavior = 'auto';
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 40)); }
        window.scrollTo(0, 0);
      });
      await page.waitForTimeout(900);
      // full-page captures cannot include the fixed WebGL layer on software GPUs; hide it for the tall capture
      await page.evaluate(() => { const c = document.querySelector('canvas[data-field]'); if (c) c.style.display = 'none'; });
      try {
        await page.screenshot({ path: `qa/${name}-${vname}-${theme}.png`, fullPage: true, timeout: 180000 });
      } catch {
        // very tall pages (pinned chapters) exceed the software GPU's capture limits: sample the page instead
        const h = await page.evaluate(() => document.documentElement.scrollHeight);
        for (const f of [0.25, 0.5, 0.75]) {
          await page.evaluate((y) => { document.documentElement.style.scrollBehavior = 'auto'; window.lenis ? window.lenis.scrollTo(y, { immediate: true }) : window.scrollTo(0, y); }, Math.round(h * f));
          await page.waitForTimeout(900);
          await page.screenshot({ path: `qa/${name}-${vname}-${theme}-at${Math.round(f * 100)}.png`, timeout: 120000 });
        }
      }
      await page.evaluate(() => { const c = document.querySelector('canvas[data-field]'); if (c) c.style.display = ''; });
      if (errors.length) console.log(`[${p} ${vname} ${theme}] errors:`, errors);
      await page.close();
    }
    await ctx.close();
  }
}
await browser.close();
server.close();
console.log('screenshots written to qa/');
