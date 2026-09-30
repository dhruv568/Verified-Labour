import assert from 'assert';

export async function runAadhaarScannerUiTests(): Promise<{ passed: number; failed: number }> {
  console.log('\n--- 12. Aadhaar Secure QR Test Scanner UI & Safety Tests ---');
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
      path.join(process.cwd(), 'components', 'AadhaarQrTestScanner.tsx'),
      'utf8'
    );
    assert(scannerCode.includes('stopScanner'), 'Scanner must define stopScanner cleanup helper');
    assert(scannerCode.includes('return () =>'), 'Scanner useEffect must return unmount cleanup callback');
  });

  // Test 4: Mobile Rear Camera facingMode Preference
  test('Scanner specifies facingMode: "environment" for mobile camera stream', () => {
    const fs = require('fs');
    const path = require('path');
    const scannerCode = fs.readFileSync(
      path.join(process.cwd(), 'components', 'AadhaarQrTestScanner.tsx'),
      'utf8'
    );
    assert(scannerCode.includes('facingMode: \'environment\'') || scannerCode.includes('facingMode: "environment"'), 'Scanner must prefer rear camera');
  });

  // Test 5: Single API Dispatch & Duplicate Scan Guard
  test('Scanner includes duplicate scan prevention ref flag', () => {
    const fs = require('fs');
    const path = require('path');
    const scannerCode = fs.readFileSync(
      path.join(process.cwd(), 'components', 'AadhaarQrTestScanner.tsx'),
      'utf8'
    );
    assert(scannerCode.includes('isProcessingScanRef'), 'Scanner must use duplicate scan ref guard');
  });

  // Test 6: Safe Display of Verified Data
  test('Result UI masks sensitive data and displays only safe identity fields', () => {
    const fs = require('fs');
    const path = require('path');
    const scannerCode = fs.readFileSync(
      path.join(process.cwd(), 'components', 'AadhaarQrTestScanner.tsx'),
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
      path.join(process.cwd(), 'components', 'AadhaarQrTestScanner.tsx'),
      'utf8'
    );
    assert(!scannerCode.includes('localStorage.setItem'), 'Must NOT save payload to localStorage');
    assert(!scannerCode.includes('sessionStorage.setItem'), 'Must NOT save payload to sessionStorage');
  });

  // Test 8: Worker Onboarding Scanner Component Export & Lifecycle Guard
  test('WorkerAadhaarQrScanner component export exists and uses STARTING state before Html5Qrcode init', () => {
    const component = require('../components/WorkerAadhaarQrScanner');
    assert(component.default !== undefined, 'WorkerAadhaarQrScanner default export must exist');

    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes("setScannerState('STARTING')"), 'Must use STARTING state to mount DOM container');
    assert(code.includes("onboarding-aadhaar-qr-viewport"), 'Must reference DOM viewport container ID');
  });

  // Test 9: Camera Error Mapping & Fallbacks
  test('WorkerAadhaarQrScanner includes camera error mapping and getCameras fallback', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes('mapCameraError'), 'Must define mapCameraError helper');
    assert(code.includes('Html5Qrcode.getCameras()'), 'Must include getCameras fallback');
  });

  // Test 10: QR Image File Upload Fallback
  test('WorkerAadhaarQrScanner includes local client-side QR image file upload fallback', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes('handleImageFileSelect'), 'Must define handleImageFileSelect');
    assert(code.includes('scanFile'), 'Must call scanFile on local image file');
    assert(code.includes('offscreen-file-qr-container'), 'Must use offscreen container for image scan');
  });

  // Test 11: Production Dev Mode Guard
  test('WorkerAadhaarQrScanner hides manual paste UI in production environment', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes("process.env.NODE_ENV !== 'production'"), 'Manual paste UI must be wrapped in NODE_ENV check');
  });

  // Test 12: Stream Verification Guard (videoWidth & videoHeight > 0 check)
  test('WorkerAadhaarQrScanner verifies video rendering & readyState before setting SCANNING state', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes('verifyVideoRendering'), 'Must define verifyVideoRendering stream check');
    assert(code.includes('videoEl.videoWidth > 0'), 'Must check videoWidth > 0');
    assert(code.includes('videoEl.videoHeight > 0'), 'Must check videoHeight > 0');
    assert(code.includes('videoEl.readyState >= 2'), 'Must check video readyState >= 2');
  });

  // Test 13: HTTPS / Secure Context Check
  test('WorkerAadhaarQrScanner performs HTTPS secure context check', () => {
    const fs = require('fs');
    const path = require('path');
    const code = fs.readFileSync(
      path.join(process.cwd(), 'components', 'WorkerAadhaarQrScanner.tsx'),
      'utf8'
    );
    assert(code.includes('window.isSecureContext'), 'Must check window.isSecureContext');
  });

  return { passed, failed };
}
