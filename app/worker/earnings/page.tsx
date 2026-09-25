'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import {
  CreditCard,
  TrendingUp,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building,
} from 'lucide-react';

export default function WorkerEarningsPage() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setSession(data.user);
        } else {
          window.location.href = '/?auth=login';
        }
      })
      .catch(() => {
        window.location.href = '/';
      })
      .finally(() => setLoading(false));
  }, []);

  const transactions = [
    {
      id: 'TXN-9021',
      jobId: 'VL-9021',
      date: 'Sep 15, 2026',
      service: 'Tap & Shower Fitting Repair',
      grossAmount: 350.0,
      platformFee: 35.0, // 10%
      taxAmount: 6.3, // 18% GST on platform fee
      workerAmount: 308.7,
      status: 'SETTLED',
      bankReference: 'NEFT_SBI_891023',
    },
    {
      id: 'TXN-8840',
      jobId: 'VL-8840',
      date: 'Sep 12, 2026',
      service: 'Pipeline Leakage Fixing',
      grossAmount: 400.0,
      platformFee: 40.0,
      taxAmount: 7.2,
      workerAmount: 352.8,
      status: 'SETTLED',
      bankReference: 'NEFT_SBI_772911',
    },
    {
      id: 'TXN-8712',
      jobId: 'VL-8712',
      date: 'Sep 09, 2026',
      service: 'Toilet Sanitary Installation',
      grossAmount: 600.0,
      platformFee: 60.0,
      taxAmount: 10.8,
      workerAmount: 529.2,
      status: 'SETTLED',
      bankReference: 'NEFT_SBI_651902',
    },
  ];

  const totalGross = transactions.reduce((acc, t) => acc + t.grossAmount, 0);
  const totalWorkerNet = transactions.reduce((acc, t) => acc + t.workerAmount, 0);
  const totalPlatformFees = transactions.reduce((acc, t) => acc + t.platformFee, 0);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <Link href="/worker/dashboard" className="text-xs font-semibold text-brand-700 hover:underline">
              ← Back to Worker Cockpit
            </Link>
            <h1 className="text-xl sm:text-3xl font-black text-slate-900 mt-1">
              Earnings & Wallet Settlements
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Transparent platform fee calculation with direct bank transfers.
            </p>
          </div>

          <div className="text-left sm:text-right bg-white sm:bg-transparent p-3 sm:p-0 rounded-2xl border sm:border-0 border-slate-200">
            <span className="text-[11px] text-slate-400 font-semibold block">Available Payout Balance</span>
            <span className="text-xl sm:text-2xl font-black text-brand-700">₹{totalWorkerNet.toFixed(1)}</span>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 block mb-1">Today's Earnings</span>
            <span className="text-xl sm:text-2xl font-black text-slate-900">₹0.00</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-1">0 jobs today</span>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 block mb-1">Weekly Net Payout</span>
            <span className="text-xl sm:text-2xl font-black text-brand-700">₹{totalWorkerNet.toFixed(1)}</span>
            <span className="text-[10px] sm:text-[11px] text-brand-600 font-semibold block mt-1">3 completed jobs</span>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 block mb-1">Gross Billings</span>
            <span className="text-xl sm:text-2xl font-black text-navy-900">₹{totalGross.toFixed(0)}</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-1">Customer payments</span>
          </div>

          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-[11px] sm:text-xs font-bold text-slate-400 block mb-1">Platform Fee (10%)</span>
            <span className="text-xl sm:text-2xl font-black text-slate-700">₹{totalPlatformFees.toFixed(0)}</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block mt-1">Configured commission</span>
          </div>
        </div>

        {/* Verified Bank Account Card */}
        <div className="bg-navy-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-xl mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-navy-800">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-navy-800 flex items-center justify-center border border-navy-700 shrink-0">
              <Building className="w-6 h-6 sm:w-7 sm:h-7 text-brand-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-sm sm:text-base text-white">
                  State Bank of India
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-brand-500/20 text-brand-300 border border-brand-500/30">
                  Cashfree Verified
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Account: <span className="font-mono font-bold text-white">XXXXXXXX4512</span> • IFSC: <span className="font-mono">SBIN0001824</span>
              </p>
              <p className="text-[11px] text-brand-400 mt-0.5">
                Verified Account Holder: Ramesh Mohanbhai Patel
              </p>
            </div>
          </div>

          <div className="w-full sm:w-auto text-left sm:text-right">
            <span className="inline-block px-3 py-1.5 bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs">
              Daily Auto-Settlement Active
            </span>
          </div>
        </div>

        {/* Transactions Section: Mobile Cards (<md) + Desktop Table (>=md) */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm sm:text-base font-black text-slate-900">Settlement Ledger & Transactions</h3>
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">All amounts in INR (₹)</span>
          </div>

          {/* Mobile Card List View (<md) */}
          <div className="md:hidden divide-y divide-slate-100">
            {transactions.map((t) => (
              <div key={t.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{t.service}</span>
                    <span className="text-[11px] text-slate-400 font-mono">#{t.jobId} • {t.date}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-50 text-brand-800 border border-brand-200 shrink-0">
                    {t.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Gross</span>
                    <span className="font-bold text-slate-800">₹{t.grossAmount.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Fee (10%)</span>
                    <span className="font-bold text-red-600">-₹{t.platformFee.toFixed(0)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-brand-700 block font-bold">Net Payout</span>
                    <span className="font-black text-brand-700">₹{t.workerAmount.toFixed(1)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
                  <span>Txn: {t.id}</span>
                  <span>Ref: {t.bankReference}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View (>=md) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-6">Transaction</th>
                  <th className="py-3.5 px-6">Service & Job ID</th>
                  <th className="py-3.5 px-6">Gross Amount</th>
                  <th className="py-3.5 px-6">Platform Fee (10%)</th>
                  <th className="py-3.5 px-6">GST (18%)</th>
                  <th className="py-3.5 px-6">Net Payout</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-4 px-6 font-mono font-bold text-slate-800">
                      {t.id}
                      <span className="block text-[11px] font-normal text-slate-400 font-sans">{t.date}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-bold text-slate-800 block">{t.service}</span>
                      <span className="text-slate-400 font-mono text-[11px]">#{t.jobId}</span>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">₹{t.grossAmount.toFixed(2)}</td>
                    <td className="py-4 px-6 text-red-600 font-medium">- ₹{t.platformFee.toFixed(2)}</td>
                    <td className="py-4 px-6 text-slate-500">₹{t.taxAmount.toFixed(2)}</td>
                    <td className="py-4 px-6 font-black text-brand-700 text-sm">
                      ₹{t.workerAmount.toFixed(2)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-brand-50 text-brand-800 border border-brand-200">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
