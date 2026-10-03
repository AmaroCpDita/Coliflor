import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import sharp from 'sharp';

const generated = await readFile('src/features/our-world/data/optimized-artwork.ts', 'utf8');
const manifest = JSON.parse(generated.slice(generated.indexOf(' = ') + 3).trim().replace(/;$/, ''));
let originals = 0, delivery = 0, thumbnails = 0;
for (const [source, entry] of Object.entries(manifest)) {
  const original = await sharp('public' + source).metadata();
  const optimized = await sharp('public' + entry.source).metadata();
  assert.equal(optimized.format, 'webp');
  assert.equal(optimized.hasAlpha, original.hasAlpha, `Transparency must survive: ${source}`);
  assert(Math.abs(optimized.height - optimized.width * original.height / original.width) <= 1, `Preserve aspect ratio: ${source}`);
  assert(optimized.width <= original.width && optimized.height <= original.height);
  if (entry.thumbnail) {
    const thumb = await sharp('public' + entry.thumbnail).metadata();
    assert(thumb.width <= 128 && thumb.height <= 128);
    assert.equal(thumb.hasAlpha, original.hasAlpha);
    thumbnails += (await stat('public' + entry.thumbnail)).size;
  }
  originals += (await stat('public' + source)).size;
  delivery += (await stat('public' + entry.source)).size;
}
assert(delivery < originals * 0.3, 'Delivery artwork must be materially lighter');
console.log(JSON.stringify({ images: Object.keys(manifest).length, originalBytes: originals, deliveryBytes: delivery, thumbnailBytes: thumbnails, reductionPercent: Math.round((1 - delivery / originals) * 100) }, null, 2));
console.log('World artwork checks passed: transparency, aspect ratios, thumbnails and delivery size.');
