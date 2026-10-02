/**
 * Tells IndexNow search engines (Bing, Yandex, Seznam, Naver; Bing also feeds
 * ChatGPT search and Copilot) about every page in the live sitemap. Run after
 * a deploy: node scripts/indexnow.mjs
 * The key file public/<key>.txt proves the site owns the key.
 */
const site = 'https://abhinavsaxena.in';
const key = '1d26fcea88901e9d0f5d91c75b65e579';
const index = await (await fetch(`${site}/sitemap-index.xml`)).text();
const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const urls = [];
for (const m of maps) urls.push(...[...(await (await fetch(m)).text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((x) => x[1]));
const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: 'abhinavsaxena.in', key, keyLocation: `${site}/${key}.txt`, urlList: urls }),
});
console.log(`IndexNow: submitted ${urls.length} URLs → HTTP ${res.status}`);
