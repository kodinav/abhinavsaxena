/**
 * Renders /cv from the built site to public/cv/abhinav-saxena-cv.pdf (and
 * copies it into dist/ so the current build links to it). Run after `npm run build`.
 */
import { chromium } from 'playwright';
import { mkdir, copyFile } from 'node:fs/promises';
import { serveDist } from './serve.mjs';

const server = await serveDist(0); const PORT = server.port;
const browser = await chromium.launch();
const page = await browser.newPage({ colorScheme: 'light' });
await page.goto(`http://localhost:${PORT}/cv`, { waitUntil: 'networkidle' });
await page.emulateMedia({ media: 'print', colorScheme: 'light' });
await mkdir('public/cv', { recursive: true });
await page.pdf({ path: 'public/cv/abhinav-saxena-cv.pdf', format: 'A4', printBackground: false, margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' } });
await browser.close();
server.close();
await mkdir('dist/cv', { recursive: true }).catch(() => {});
await copyFile('public/cv/abhinav-saxena-cv.pdf', 'dist/cv/abhinav-saxena-cv.pdf').catch(() => {});
console.log('written public/cv/abhinav-saxena-cv.pdf');
