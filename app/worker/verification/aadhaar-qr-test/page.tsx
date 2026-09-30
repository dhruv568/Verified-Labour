import React from 'react';
import AadhaarQrTestScanner from '@/components/AadhaarQrTestScanner';

export const metadata = {
  title: 'Aadhaar Secure QR Verification Test | Verified Labour',
  description: 'Test scanner interface for UIDAI Secure QR Code cryptographic signature verification.',
};

export default function AadhaarQrTestPage() {
  return (
    <main className="min-h-screen bg-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <AadhaarQrTestScanner />
      </div>
    </main>
  );
}
