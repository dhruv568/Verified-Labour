'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import WorkerOnboardingWizard from '@/components/WorkerOnboardingWizard';
import { Loader2 } from 'lucide-react';

export default function WorkerOnboardingPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-700 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-semibold">Loading onboarding portal...</p>
          </div>
        ) : (
          <WorkerOnboardingWizard
            categories={categories}
            onComplete={() => {
              window.location.href = '/worker/dashboard';
            }}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
