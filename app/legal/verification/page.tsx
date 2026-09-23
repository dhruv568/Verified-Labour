import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function VerificationPolicyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-brand-700" />
            <h1 className="text-3xl font-black text-slate-900">Worker Verification Policy</h1>
          </div>
          <p className="text-xs text-slate-400">Cashfree Secure ID Architecture</p>

          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900">How Workers Become "Verified"</h2>
            <p>
              To ensure safety and reliability for both customers and commercial contractors, no worker
              receives the Verified badge without passing our multi-point background checks:
            </p>
            <ul className="space-y-2 list-disc pl-5">
              <li>
                <strong>Aadhaar Identity Verification (UIDAI OTP):</strong> Completed via Cashfree Secure ID.
                Worker enters their 12-digit Aadhaar number with voluntary consent, and inputs the one-time password
                received directly from UIDAI.
              </li>
              <li>
                <strong>Bank Account & IFSC Validation:</strong> Cashfree performs an automated account verification,
                validating account existence and comparing the beneficiary name against the Aadhaar identity name.
              </li>
              <li>
                <strong>Trade Skill & Document Screening:</strong> Administrative moderators review experience, trade
                history, and certifications before public search indexing.
              </li>
            </ul>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
