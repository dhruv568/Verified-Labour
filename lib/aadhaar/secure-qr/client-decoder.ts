import { BrowserQRCodeReader } from '@zxing/browser';
import jsQR from 'jsqr';

/**
 * Client-Side Multi-Engine Aadhaar Secure QR Decoder Helper
 * 
 * Combines ZXing BrowserQRCodeReader + jsQR + Multi-Variant Canvas Preprocessing
 * (Rotation 90/180/270°, Contrast Binarization, 2x Upscaling, Center Cropping)
 * to detect dense Aadhaar Secure QRs from camera frames and uploaded photos.
 */

// Singleton instance of ZXing reader
let zxingReaderInstance: BrowserQRCodeReader | null = null;

function getZxingReader(): BrowserQRCodeReader {
  if (!zxingReaderInstance) {
    zxingReaderInstance = new BrowserQRCodeReader();
  }
  return zxingReaderInstance;
}

/**
 * Helper to convert ZXing result or raw Uint8Array bytes into a safe Base64 / String payload.
 */
export function formatDecodedQrPayload(
  rawBytes?: Uint8Array | number[] | null,
  textData?: string | null
): string | null {
  if (rawBytes && rawBytes.length > 0) {
    try {
      const bytes = new Uint8Array(rawBytes);
      let binary = '';
      const len = bytes.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const b64 = btoa(binary);
      if (b64 && b64.trim()) return b64;
    } catch {}
  }

  if (textData && textData.trim()) {
    return textData.trim();
  }

  return null;
}

/**
 * Decodes QR from a canvas using ZXing first, with jsQR fallback.
 */
export async function decodeCanvasWithEngines(
  canvas: HTMLCanvasElement
): Promise<string | null> {
  const reader = getZxingReader();

  // 1. Try ZXing BrowserQRCodeReader
  try {
    const zxingResult = await reader.decodeFromCanvas(canvas);
    if (zxingResult) {
      const payload = formatDecodedQrPayload(zxingResult.getRawBytes(), zxingResult.getText());
      if (payload) return payload;
    }
  } catch {}

  // 2. Fallback: jsQR with attemptBoth inversion
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (ctx && canvas.width > 0 && canvas.height > 0) {
    try {
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const jsqrResult = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'attemptBoth',
      });

      if (jsqrResult) {
        const payload = formatDecodedQrPayload(jsqrResult.binaryData, jsqrResult.data);
        if (payload) return payload;
      }
    } catch {}
  }

  return null;
}

/**
 * Multi-Variant Image QR Decoder: Preprocesses uploaded photo across 7 image transformations
 * (Original, 90°, 180°, 270°, Binarized High-Contrast, 2x Upscale, Center Crop)
 * to locate dense/rotated Aadhaar QRs.
 */
export async function decodeAadhaarQrFromImageElement(
  img: HTMLImageElement,
  onAttemptProgress?: (info: { attempt: number; total: number; strategy: string }) => void
): Promise<string | null> {
  const origWidth = img.naturalWidth || img.width;
  const origHeight = img.naturalHeight || img.height;

  if (origWidth === 0 || origHeight === 0) {
    return null;
  }

  const reader = getZxingReader();

  // Attempt 1: Direct ZXing decode on raw image element
  if (onAttemptProgress) onAttemptProgress({ attempt: 1, total: 8, strategy: 'ZXing Direct Image Scan' });
  try {
    const directResult = await reader.decodeFromImageElement(img);
    if (directResult) {
      const payload = formatDecodedQrPayload(directResult.getRawBytes(), directResult.getText());
      if (payload) return payload;
    }
  } catch {}

  // Canvas helper generator
  const createCanvas = (w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } => {
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    return { canvas, ctx };
  };

  // Variant 1: Original Canvas
  if (onAttemptProgress) onAttemptProgress({ attempt: 2, total: 8, strategy: 'Full Resolution Original' });
  const { canvas: origCanvas, ctx: origCtx } = createCanvas(origWidth, origHeight);
  origCtx.drawImage(img, 0, 0);
  let res = await decodeCanvasWithEngines(origCanvas);
  if (res) return res;

  // Variant 2: Rotated 90° Clockwise
  if (onAttemptProgress) onAttemptProgress({ attempt: 3, total: 8, strategy: 'Rotated 90° Right' });
  const { canvas: rot90, ctx: ctx90 } = createCanvas(origHeight, origWidth);
  ctx90.translate(origHeight / 2, origWidth / 2);
  ctx90.rotate((90 * Math.PI) / 180);
  ctx90.drawImage(img, -origWidth / 2, -origHeight / 2);
  res = await decodeCanvasWithEngines(rot90);
  if (res) return res;

  // Variant 3: Rotated 180°
  if (onAttemptProgress) onAttemptProgress({ attempt: 4, total: 8, strategy: 'Rotated 180° Upside Down' });
  const { canvas: rot180, ctx: ctx180 } = createCanvas(origWidth, origHeight);
  ctx180.translate(origWidth / 2, origHeight / 2);
  ctx180.rotate((180 * Math.PI) / 180);
  ctx180.drawImage(img, -origWidth / 2, -origHeight / 2);
  res = await decodeCanvasWithEngines(rot180);
  if (res) return res;

  // Variant 4: Rotated 270° Counter-Clockwise
  if (onAttemptProgress) onAttemptProgress({ attempt: 5, total: 8, strategy: 'Rotated 270° Left' });
  const { canvas: rot270, ctx: ctx270 } = createCanvas(origHeight, origWidth);
  ctx270.translate(origHeight / 2, origWidth / 2);
  ctx270.rotate((270 * Math.PI) / 180);
  ctx270.drawImage(img, -origWidth / 2, -origHeight / 2);
  res = await decodeCanvasWithEngines(rot270);
  if (res) return res;

  // Variant 5: Binarized High-Contrast Grayscale
  if (onAttemptProgress) onAttemptProgress({ attempt: 6, total: 8, strategy: 'High Contrast Grayscale' });
  const { canvas: contrastCanvas, ctx: contrastCtx } = createCanvas(origWidth, origHeight);
  contrastCtx.drawImage(img, 0, 0);
  const imgData = contrastCtx.getImageData(0, 0, origWidth, origHeight);
  const d = imgData.data;
  for (let i = 0; i < d.length; i += 4) {
    const avg = (d[i] + d[i + 1] + d[i + 2]) / 3;
    const val = avg > 128 ? 255 : 0;
    d[i] = val;
    d[i + 1] = val;
    d[i + 2] = val;
  }
  contrastCtx.putImageData(imgData, 0, 0);
  res = await decodeCanvasWithEngines(contrastCanvas);
  if (res) return res;

  // Variant 6: 2x Upscaled Canvas
  if (onAttemptProgress) onAttemptProgress({ attempt: 7, total: 8, strategy: '2x High Resolution Upscale' });
  const { canvas: upCanvas, ctx: upCtx } = createCanvas(origWidth * 2, origHeight * 2);
  upCtx.imageSmoothingEnabled = false;
  upCtx.drawImage(img, 0, 0, origWidth * 2, origHeight * 2);
  res = await decodeCanvasWithEngines(upCanvas);
  if (res) return res;

  // Variant 7: Center Crop
  if (onAttemptProgress) onAttemptProgress({ attempt: 8, total: 8, strategy: 'Center Region Isolation' });
  const cropSize = Math.floor(Math.min(origWidth, origHeight) * 0.7);
  const cropX = Math.floor((origWidth - cropSize) / 2);
  const cropY = Math.floor((origHeight - cropSize) / 2);
  const { canvas: cropCanvas, ctx: cropCtx } = createCanvas(cropSize, cropSize);
  cropCtx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, cropSize, cropSize);
  res = await decodeCanvasWithEngines(cropCanvas);
  if (res) return res;

  return null;
}
