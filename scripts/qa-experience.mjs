/** Captures the motion experience: preloader frames, hero after intro, hover, the thread chapter, a page transition. */
import { chromium } from 'playwright';
import { serveDist } from './serve.mjs';
const server = await serveDist(0); const PORT = server.port;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text().slice(0, 300)); });
page.on('pageerror', (e) => logs.push('PAGEERROR: ' + e.message));
await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'domcontentloaded' });
for (const t of [500, 1300, 2100]) { await page.waitForTimeout(t === 500 ? 500 : 800); await page.screenshot({ path: `qa/xp-preloader-${t}.png` }); }
await page.waitForTimeout(3200);
console.log('webgl class:', await page.evaluate(() => document.documentElement.className));
await page.screenshot({ path: 'qa/xp-hero.png' });
await page.hover('[data-concept="ai"]'); await page.waitForTimeout(1200);
await page.screenshot({ path: 'qa/xp-hero-hover.png' });
await page.mouse.move(700, 450); await page.waitForTimeout(300);
// scroll to the thread chapter and sample three positions
const threadTop = await page.evaluate(() => document.querySelector('[data-thread]').getBoundingClientRect().top + window.scrollY);
for (const [i, frac] of [[0, 0.02], [1, 0.36], [2, 0.86]]) {
  await page.evaluate(({ y }) => window.scrollTo(0, y), { y: threadTop + frac * 900 * 7 });
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `qa/xp-thread-${i}.png` });
}
await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(800);
// page transition
await page.click('nav.primary a[href="/essays"]');
await page.waitForTimeout(380);
await page.screenshot({ path: 'qa/xp-transition.png' });
await page.waitForTimeout(1800);
await page.screenshot({ path: 'qa/xp-essays.png' });
console.log('canvas persisted:', await page.evaluate(() => !!document.querySelector('canvas[data-field]') && document.body.dataset.fieldMode));
console.log('logs:', logs.length ? logs : 'none');
await browser.close(); server.close();
