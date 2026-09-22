import sharp from 'sharp';
const [,, file, ...ranges] = process.argv;
const meta = await sharp(file).metadata();
for (const r of ranges) {
  const [y0, y1] = r.split('-').map(Number);
  const top = Math.min(y0, meta.height - 1), height = Math.min(y1, meta.height) - top;
  await sharp(file).extract({ left: 0, top, width: meta.width, height }).toFile(file.replace('.png', `-crop-${y0}.png`));
}
console.log('cropped');
