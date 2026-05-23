import sharp from 'sharp';

const src = 'public/icon.svg';

async function makeSquare(file: string, size: number) {
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(file);
}

async function makeMaskable(file: string, size: number) {
  const pad = Math.round(size * 0.08);
  const inner = size - pad * 2;
  await sharp(src)
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({
      top: pad,
      bottom: pad,
      left: pad,
      right: pad,
      background: { r: 46, g: 52, b: 64, alpha: 1 }
    })
    .png()
    .toFile(file);
}

async function run() {
  await makeSquare('public/icon-192x192.png', 192);
  await makeSquare('public/icon-512x512.png', 512);
  await makeMaskable('public/icon-maskable.png', 512);
  await makeSquare('public/apple-touch-icon.png', 180);
}

run();
