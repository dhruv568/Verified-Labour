const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFinalFavicons() {
  console.log('Generating Verified Labour circular favicons...');

  const symbolBuffer = fs.readFileSync('public/scratch-flawless-symbol.png');
  const size = 512;

  // Center symbol inside 512x512 circle with balanced padding
  // Target height = 396px
  const targetHeight = 396;
  const resizedSymbol = await sharp(symbolBuffer)
    .resize({ height: targetHeight, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();

  const symbolMeta = await sharp(resizedSymbol).metadata();
  const top = Math.round((size - symbolMeta.height) / 2);
  const left = Math.round((size - symbolMeta.width) / 2);

  // Master Circular Badge SVG
  // White background circle + Navy and Green brand gradient ring
  const masterBadgeSvg = `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="brandBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#1464D2" />
          <stop offset="50%" stop-color="#0F2A5F" />
          <stop offset="100%" stop-color="#0B9B5A" />
        </linearGradient>
      </defs>
      <!-- Solid White Base Circle -->
      <circle cx="256" cy="256" r="252" fill="#FFFFFF" />
      <!-- Brand Gradient Border Ring -->
      <circle cx="256" cy="256" r="242" fill="none" stroke="url(#brandBorderGrad)" stroke-width="12" />
    </svg>
  `;

  // Render 512x512 PNG master
  const masterPng = await sharp(Buffer.from(masterBadgeSvg))
    .composite([{ input: resizedSymbol, top, left }])
    .png()
    .toBuffer();

  // 1. Save 512x512 Master PNG
  fs.writeFileSync('public/icon-512.png', masterPng);
  console.log('Saved public/icon-512.png');

  // 2. Save 192x192 Android / PWA Icon
  const png192 = await sharp(masterPng).resize(192, 192).png().toBuffer();
  fs.writeFileSync('public/icon-192.png', png192);
  console.log('Saved public/icon-192.png');

  // 3. Save 180x180 Apple Touch Icon
  const png180 = await sharp(masterPng).resize(180, 180).png().toBuffer();
  fs.writeFileSync('public/apple-touch-icon.png', png180);
  console.log('Saved public/apple-touch-icon.png');

  // 4. Save 32x32 & 48x48 icon.png
  const png48 = await sharp(masterPng).resize(48, 48).png().toBuffer();
  const png32 = await sharp(masterPng).resize(32, 32).png().toBuffer();
  const png16 = await sharp(masterPng).resize(16, 16).png().toBuffer();

  fs.writeFileSync('public/icon.png', png32);
  console.log('Saved public/icon.png');

  // 5. Generate multi-resolution ICO file containing 16x16, 32x32, 48x48
  async function buildIco(pngBuffers, outputPath) {
    const count = pngBuffers.length;
    const headerSize = 6;
    const dirEntrySize = 16;
    let dataOffset = headerSize + count * dirEntrySize;

    const header = Buffer.alloc(headerSize);
    header.writeUInt16LE(0, 0); // reserved
    header.writeUInt16LE(1, 2); // ICO format
    header.writeUInt16LE(count, 4); // count

    const dirEntries = [];
    for (const pngBuf of pngBuffers) {
      const meta = await sharp(pngBuf).metadata();
      const entry = Buffer.alloc(dirEntrySize);
      entry.writeUInt8(meta.width >= 256 ? 0 : meta.width, 0);
      entry.writeUInt8(meta.height >= 256 ? 0 : meta.height, 1);
      entry.writeUInt8(0, 2); // color count
      entry.writeUInt8(0, 3); // reserved
      entry.writeUInt16LE(1, 4); // color planes
      entry.writeUInt16LE(32, 6); // bits per pixel (32-bit RGBA)
      entry.writeUInt32LE(pngBuf.length, 8); // image size
      entry.writeUInt32LE(dataOffset, 12); // image offset

      dirEntries.push(entry);
      dataOffset += pngBuf.length;
    }

    const icoBuf = Buffer.concat([header, ...dirEntries, ...pngBuffers]);
    fs.writeFileSync(outputPath, icoBuf);
    console.log(`Saved ${outputPath} (${icoBuf.length} bytes)`);
  }

  await buildIco([png16, png32, png48], 'public/favicon.ico');
  // Copy to app/favicon.ico for Next.js app directory support
  fs.copyFileSync('public/favicon.ico', 'app/favicon.ico');
  console.log('Copied app/favicon.ico');

  // 6. Save favicon.jpeg for legacy fallback
  const jpeg512 = await sharp(masterPng).flatten({ background: '#FFFFFF' }).jpeg({ quality: 95 }).toBuffer();
  fs.writeFileSync('public/fevicon.jpeg', jpeg512);
  console.log('Saved legacy public/fevicon.jpeg fallback');

  // 7. Generate clean vector SVG icon for modern browser tabs
  // We embed the high-res PNG image inside SVG <image> tag so SVG renderer handles resolution scaling flawlessly
  const masterBase64 = masterPng.toString('base64');
  const embeddedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
    <image href="data:image/png;base64,${masterBase64}" width="512" height="512"/>
  </svg>`;

  fs.writeFileSync('public/favicon.svg', embeddedSvg);
  fs.writeFileSync('public/icon.svg', embeddedSvg);
  console.log('Saved public/favicon.svg & public/icon.svg');

  console.log('All favicon generation complete!');
}

generateFinalFavicons().catch(console.error);
