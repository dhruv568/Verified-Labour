import React from 'react';
import AadhaarQrTestScanner from '@/components/AadhaarQrTestScanner';
import Footer from '@/components/Footer';

export const metadata = {
  title: 'Aadhaar Secure QR Verification Test | Verified Labour',
  description: 'Test scanner interface for UIDAI Secure QR Code cryptographic signature verification.',
};

export default function AadhaarQrTestPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <AadhaarQrTestScanner />
        </div>
      </main>
      <Footer />
    </div>
  );
}
