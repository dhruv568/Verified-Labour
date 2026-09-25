const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function buildVerifiedFavicons() {
  console.log('Generating production-ready favicons from fevicon.jpeg...');

  // Source image: fevicon.jpeg (1254x1254 square)
  const sourceFile = fs.existsSync('fevicon.jpeg')
    ? 'fevicon.jpeg'
    : 'public/fevicon.jpeg';

  if (!fs.existsSync(sourceFile)) {
    throw new Error('Source file fevicon.jpeg not found!');
  }

  const sourceBuffer = fs.readFileSync(sourceFile);
  const metadata = await sharp(sourceBuffer).metadata();
  console.log(`Loaded source image: ${sourceFile} (${metadata.width}x${metadata.height})`);

  // Resize source to clean square buffers at key dimensions
  const png512 = await sharp(sourceBuffer)
    .resize(512, 512, { fit: 'cover' })
    .png({ quality: 100 })
    .toBuffer();

  const png192 = await sharp(sourceBuffer)
    .resize(192, 192, { fit: 'cover' })
    .png({ quality: 100 })
    .toBuffer();

  const png180 = await sharp(sourceBuffer)
    .resize(180, 180, { fit: 'cover' })
    .png({ quality: 100 })
    .toBuffer();

  const png48 = await sharp(sourceBuffer)
    .resize(48, 48, { fit: 'cover' })
    .png({ quality: 100 })
    .toBuffer();

  const png32 = await sharp(sourceBuffer)
    .resize(32, 32, { fit: 'cover' })
    .png({ quality: 100 })
    .toBuffer();

  const png16 = await sharp(sourceBuffer)
    .resize(16, 16, { fit: 'cover' })
    .png({ quality: 100 })
    .toBuffer();

  // Helper to construct a multi-resolution ICO file (16x16, 32x32, 48x48)
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

  // Save to public directory
  fs.writeFileSync('public/icon-512.png', png512);
  fs.writeFileSync('public/icon-192.png', png192);
  fs.writeFileSync('public/apple-touch-icon.png', png180);
  fs.writeFileSync('public/favicon.png', png48);
  fs.writeFileSync('public/icon.png', png32);
  fs.writeFileSync('public/fevicon.jpeg', sourceBuffer);
  fs.writeFileSync('public/favicon.jpeg', sourceBuffer);

  // Generate multi-frame ICO file for public and app
  await buildIco([png16, png32, png48], 'public/favicon.ico');

  // Copy favicon files into app/ for Next.js App Router static optimization
  fs.copyFileSync('public/favicon.ico', 'app/favicon.ico');
  fs.writeFileSync('app/icon.png', png32);
  fs.writeFileSync('app/apple-icon.png', png180);

  // Embedded SVG for crisp vector scaling
  const base64Png = png512.toString('base64');
  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <image href="data:image/png;base64,${base64Png}" width="512" height="512"/>
</svg>`;
  fs.writeFileSync('public/favicon.svg', svgContent);

  console.log('Favicons generated successfully from authentic fevicon.jpeg!');
}

buildVerifiedFavicons().catch((err) => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
