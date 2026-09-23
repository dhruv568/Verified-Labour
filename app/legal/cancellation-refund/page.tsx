import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CancellationRefundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 py-12 flex-1">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-sm space-y-6 text-sm text-slate-700 leading-relaxed">
          <h1 className="text-3xl font-black text-slate-900">Cancellation & Refund Policy</h1>
          <p className="text-xs text-slate-400">Last updated: September 2026</p>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">1. Customer Cancellation</h2>
            <p>
              Customers may cancel a requested or accepted job without penalty prior to the worker departing
              ("WORKER_ON_THE_WAY"). If cancelled after arrival, a nominal inspection charge (₹100) may apply
              to reimburse the professional's travel expenses.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-bold text-slate-900">2. Dispute Resolution & Refunds</h2>
            <p>
              If a customer opens a legitimate dispute ("Work not completed", "Substandard service"),
              payment settlement is placed ON_HOLD. An administrative arbitrator reviews message history, photos,
              and evidence to grant a partial or full refund where justified within 3-5 business days.
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
