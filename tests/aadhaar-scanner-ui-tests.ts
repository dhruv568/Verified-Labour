import assert from 'assert';

export async function runAadhaarScannerUiTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- 12. Aadhaar Secure QR Native Scanner UI & Safety Tests ---');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`  ✔ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✖ FAIL: ${name}`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  // Test 1: Page Route & Component Importability
  test('Aadhaar QR test page route and scanner component exist', () => {
    const component = require('../components/AadhaarQrTestScanner');
    assert(component.default !== undefined, 'AadhaarQrTestScanner default export must exist');
  });

  // Test 2: Isolated Test Mode Guard
  test('Test Mode: Phase 3 scanner UI does NOT import or update WorkerProfile DB status', () => {
    const fs = require('fs');
    const path = require('path');
    const scannerCode = fs.readFileSync(
      path.join(process.cwd(), 'components', 'AadhaarQrTestScanner.tsx'),
      'utf8'
    );
    assert(!scannerCode.includes('identityVerified: true'), 'Test scanner must NOT set identityVerified=true');
    assert(!scannerCode.includes('prisma.'), 'Test scanner component must NOT perform direct database writes');
  });

  // Test 3: Camera Cleanup & Unmount Hooks
  test('Scanner includes unmount cleanup hook for camera video stream', () => {
    const fs = require('fs');
    const path = require('path');
    const scannerCode = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(scannerCode.includes('stopCamera'), 'Scanner must define stopCamera cleanup helper');
    assert(scannerCode.includes('return () =>'), 'Scanner useEffect must return unmount cleanup callback');
  });

  // Test 4: Mobile Rear Camera facingMode Preference
  test('Scanner specifies facingMode: "environment" for mobile camera stream', () => {
    const fs = require('fs');
    const path = require('path');
    const scannerCode = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(
      scannerCode.includes('facingMode') && scannerCode.includes('environment'),
      'Scanner must prefer rear camera via environment facingMode'
    );
  });

  // Test 5: Single API Dispatch & Duplicate Scan Guard
  test('Scanner includes duplicate scan prevention ref flag', () => {
    const fs = require('fs');
    const path = require('path');
    const scannerCode = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(scannerCode.includes('isProcessingScanRef'), 'Scanner must use duplicate scan ref guard');
  });

  // Test 6: Safe Display of Verified Data
  test('Result UI masks sensitive data and displays only safe identity fields', () => {
    const fs = require('fs');
    const path = require('path');
    const scannerCode = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(scannerCode.includes('maskedAadhaar'), 'Scanner UI must render maskedAadhaar');
    assert(!scannerCode.includes('rawBytes'), 'Scanner UI must not render raw byte streams');
  });

  // Test 7: No LocalStorage / SessionStorage Persistence
  test('Scanner code does NOT persist raw QR payloads in localStorage or sessionStorage', () => {
    const fs = require('fs');
    const path = require('path');
    const scannerCode = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(!scannerCode.includes('localStorage.setItem'), 'Must NOT save payload to localStorage');
    assert(!scannerCode.includes('sessionStorage.setItem'), 'Must NOT save payload to sessionStorage');
  });

  // Test 8: Native getUserMedia & Synchronous Click Context
  test('WorkerAadhaarQrScanner uses native getUserMedia and videoRef element', () => {
    const component = require('../components/WorkerAadhaarQrScanner');
    assert(component.default !== undefined, 'WorkerAadhaarQrScanner default export must exist');

    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes('navigator.mediaDevices.getUserMedia'), 'Must use native getUserMedia');
    assert(code.includes('videoRef'), 'Must use videoRef for native HTMLVideoElement');
    assert(code.includes('playsinline') || code.includes('playsInline'), 'Must enforce playsinline attribute');
  });

  // Test 9: Native jsQR Frame Decoding & Throttled Loop
  test('WorkerAadhaarQrScanner uses jsQR frame decoding loop', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes("import('jsqr')"), 'Must dynamically import jsQR');
    assert(code.includes('startFrameScanningLoop'), 'Must define startFrameScanningLoop');
    assert(code.includes('jsQR('), 'Must execute jsQR frame decoding');
  });

  // Test 10: 5-Second Hard Promise.race Timeout Guard
  test('WorkerAadhaarQrScanner includes 5-second hard startup timeout guard via Promise.race', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes('Promise.race'), 'Must use Promise.race for hard getUserMedia timeout');
    assert(code.includes('5000'), 'Must set 5-second timeout (5000ms)');
    assert(code.includes('timed out after 5 seconds'), 'Must include 5-second timeout error message');
  });

  // Test 11: Local Image QR Upload Fallback via ZXing + jsQR
  test('WorkerAadhaarQrScanner includes client-side local image QR file upload fallback', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes('handleImageFileSelect'), 'Must define handleImageFileSelect');
    assert(
      code.includes('createObjectURL') || code.includes('FileReader'),
      'Must load image file via URL.createObjectURL or FileReader'
    );
    assert(code.includes('Scan QR from Image'), 'Must provide Scan QR from Image button text');
  });

  // Test 12: Production Dev Mode Guard
  test('WorkerAadhaarQrScanner hides manual paste UI in production environment', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes("process.env.NODE_ENV !== 'production'"), 'Manual paste UI must be wrapped in NODE_ENV check');
  });

  // Test 13: HTTPS / Secure Context Pre-flight Check
  test('WorkerAadhaarQrScanner performs HTTPS secure context pre-flight check', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes('window.isSecureContext'), 'Must check window.isSecureContext');
  });

  // Test 14: 10-Second Hard Image Decoding Timeout Guard
  test('Client decoder includes 10-second hard image decoding timeout guard', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'lib', 'aadhaar', 'secure-qr', 'client-decoder.ts'),
      'utf8'
    );
    assert(
      code.includes('decodeAadhaarQrFromImageElementWithTimeout'),
      'Must define decodeAadhaarQrFromImageElementWithTimeout'
    );
    assert(code.includes('10000'), 'Must enforce 10-second (10000ms) timeout limit');
    assert(code.includes('MAX_DIM = 1800'), 'Must clamp maximum image dimensions to 1800px');
  });

  return { passed, failed };
}
