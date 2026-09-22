/**
 * Generates static PNG assets from SVG with sharp:
 *  - public/og/default.png (1200×630)
 *  - public/apple-touch-icon.png, icon-192.png, icon-512.png, favicon.ico (png-in-ico not supported → 32px png named .ico is avoided; we emit favicon-32.png and a real .ico via sharp is not possible, so we write a 32px PNG and rely on the SVG favicon first)
 */
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';

const paper = '#f4f1ea', ink = '#17161b', accent = '#b4432a', muted = '#85828e';

const og = `
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${paper}"/>
  ${Array.from({ length: 26 }, (_, i) => {
    const y = 40 + i * 22;
    const x1 = 640 + Math.sin(i * 0.7) * 40, x2 = 1160 + Math.cos(i * 0.5) * 20;
    return `<path d="M ${x1} ${y} Q ${(x1 + x2) / 2} ${y + Math.sin(i) * 26} ${x2} ${y + 8}" stroke="${ink}" stroke-opacity="0.12" fill="none" stroke-width="1"/>`;
  }).join('')}
  <circle cx="930" cy="250" r="6" fill="${accent}"/>
  <circle cx="930" cy="250" r="18" fill="none" stroke="${accent}" stroke-opacity="0.5"/>
  <circle cx="1060" cy="380" r="4" fill="${ink}" fill-opacity="0.6"/>
  <circle cx="800" cy="420" r="4" fill="${ink}" fill-opacity="0.6"/>
  <circle cx="1010" cy="150" r="4" fill="${ink}" fill-opacity="0.6"/>
  <path d="M 930 250 Q 1010 300 1060 380" stroke="${accent}" stroke-opacity="0.7" fill="none"/>
  <path d="M 930 250 Q 850 320 800 420" stroke="${accent}" stroke-opacity="0.7" fill="none"/>
  <path d="M 930 250 Q 990 190 1010 150" stroke="${accent}" stroke-opacity="0.7" fill="none"/>
  <text x="80" y="120" font-family="Helvetica, Arial, sans-serif" font-size="18" letter-spacing="4" fill="${muted}">PHILOSOPHER · RESEARCHER · WRITER</text>
  <text x="80" y="250" font-family="Georgia, 'Times New Roman', serif" font-size="104" letter-spacing="4" fill="${ink}">ABHINAV</text>
  <text x="80" y="360" font-family="Georgia, 'Times New Roman', serif" font-size="104" letter-spacing="4" fill="${ink}">SAXENA</text>
  <text x="80" y="450" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-style="italic" fill="${ink}" fill-opacity="0.75">Philosophy × AI × Mind × Ethics × Technology</text>
  <text x="80" y="560" font-family="Helvetica, Arial, sans-serif" font-size="20" letter-spacing="2" fill="${muted}">abhinavsaxena.in</text>
</svg>`;

const icon = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="${size > 64 ? 12 : 8}" fill="${paper}"/>
  <text x="32" y="43" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" fill="${ink}">A</text>
  <circle cx="48" cy="18" r="4" fill="${accent}"/>
</svg>`;

await mkdir('public/og', { recursive: true });
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile('public/og/default.png');
await sharp(Buffer.from(icon(180))).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(Buffer.from(icon(192))).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(Buffer.from(icon(512))).resize(512, 512).png().toFile('public/icon-512.png');
const png32 = await sharp(Buffer.from(icon(32))).resize(32, 32).png().toBuffer();
// Minimal ICO container wrapping a single 32×32 PNG (valid per ICO spec, supported by modern browsers)
const header = Buffer.alloc(6); header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
const entry = Buffer.alloc(16); entry[0] = 32; entry[1] = 32; entry[2] = 0; entry[3] = 0; entry.writeUInt16LE(1, 4); entry.writeUInt16LE(32, 6); entry.writeUInt32LE(png32.length, 8); entry.writeUInt32LE(22, 12);
await writeFile('public/favicon.ico', Buffer.concat([header, entry, png32]));
console.log('assets written');
