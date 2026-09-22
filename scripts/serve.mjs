/** Serves ./dist statically for QA scripts (no external deps). */
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { gzipSync } from 'node:zlib';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.xml': 'application/xml', '.txt': 'text/plain', '.pdf': 'application/pdf', '.webmanifest': 'application/manifest+json' };

export function serveDist(port = 4321, root = 'dist') {
  const server = createServer(async (req, res) => {
    try {
      let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = join(root, p);
      let s = await stat(file).catch(() => null);
      if (s?.isDirectory()) { file = join(file, 'index.html'); s = await stat(file).catch(() => null); }
      if (!s) { file = join(root, p + '.html'); s = await stat(file).catch(() => null); }
      if (!s) { file = join(root, '404.html'); res.statusCode = 404; }
      const data = await readFile(file);
      const ext = extname(file);
      res.setHeader('Content-Type', types[ext] ?? 'application/octet-stream');
      res.setHeader('Cache-Control', p.startsWith('/_astro/') ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate');
      const compressible = ['.html', '.css', '.js', '.mjs', '.json', '.svg', '.xml', '.txt', '.webmanifest'].includes(ext);
      if (compressible && /gzip/.test(req.headers['accept-encoding'] || '')) {
        res.setHeader('Content-Encoding', 'gzip');
        res.end(gzipSync(data));
      } else res.end(data);
    } catch { res.statusCode = 500; res.end('error'); }
  });
  return new Promise((resolve) => server.listen(port, () => resolve(server)));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  serveDist(Number(process.env.PORT) || 4321).then(() => console.log('serving dist on http://localhost:' + (process.env.PORT || 4321)));
}
