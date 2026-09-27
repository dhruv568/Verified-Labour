const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const targetDirs = [
  path.join(__dirname, '../public/images/home'),
  path.join(__dirname, '../public/images/testimonials'),
  path.join(__dirname, '../public/images/services'),
];

async function optimizeDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && /\.(jpg|jpeg|png)$/i.test(file)) {
      const origSize = stat.size;
      if (origSize > 150 * 1024) { // Only optimize files > 150KB
        const tempPath = filePath + '.tmp';
        try {
          if (/\.(jpg|jpeg)$/i.test(file)) {
            await sharp(filePath)
              .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
              .jpeg({ quality: 80, progressive: true })
              .toFile(tempPath);
          } else if (/\.png$/i.test(file)) {
            await sharp(filePath)
              .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true })
              .png({ quality: 80, compressionLevel: 8 })
              .toFile(tempPath);
          }

          const newSize = fs.statSync(tempPath).size;
          if (newSize < origSize) {
            fs.renameSync(tempPath, filePath);
            console.log(`Optimized ${file}: ${(origSize / 1024).toFixed(1)}KB -> ${(newSize / 1024).toFixed(1)}KB`);
          } else {
            fs.unlinkSync(tempPath);
          }
        } catch (err) {
          console.error(`Failed to optimize ${file}:`, err);
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
      }
    }
  }
}

async function main() {
  for (const dir of targetDirs) {
    await optimizeDirectory(dir);
  }
  console.log('Image optimization complete.');
}

main();
