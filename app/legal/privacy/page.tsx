import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <h1 className="text-3xl font-black text-slate-900">Privacy & Aadhaar Data Policy</h1>
          <p className="text-xs text-slate-400">Last updated: September 2026</p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Strict Aadhaar Privacy Architecture</h2>
            <p>
              Verified Labour strictly complies with the Aadhaar Act, 2016 and UIDAI guidelines.
              Aadhaar verification is processed via Cashfree Secure ID consent-based OTP flow.
              Under no circumstances does Verified Labour store raw 12-digit Aadhaar numbers or expose
              unmasked Aadhaar identifiers publicly or to unauthorized staff. Only masked identifiers
              (e.g., <span className="font-mono font-bold">XXXXXXXX8291</span>) and verification status tokens are retained.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Financial & Bank Details Security</h2>
            <p>
              Bank accounts entered by skilled workers are validated via Cashfree Bank Account Verification.
              Account numbers are masked in all user interfaces (e.g., <span className="font-mono font-bold">XXXXXXXX4512</span>).
              Payment transactions processed via Cashfree Payments follow PCI-DSS compliant protocols.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">3. Worker Geolocation Privacy</h2>
            <p>
              A worker's exact real-time or residential coordinates are never broadcast publicly.
              The platform computes server-side proximity using the Haversine formula and displays only approximate
              distances (e.g., "2.4 km away") and designated city service areas to prospective customers.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">4. Grievance Officer</h2>
            <p>
              For privacy inquiries, contact our Data Protection Officer at:
              <br />
              <strong>Email:</strong> privacy@verifiedlabour.com • <strong>Phone:</strong> +91 99999 99999
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
