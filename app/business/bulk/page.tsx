'use client';

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
  Briefcase,
  Users,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  Plus,
  AlertCircle,
  Building2,
  FileCheck,
} from 'lucide-react';

export default function BusinessBulkPage() {
  const [requirements, setRequirements] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showPostModal, setShowPostModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [workersNeeded, setWorkersNeeded] = useState(5);
  const [experienceRequiredYears, setExperienceRequiredYears] = useState(2);
  const [location, setLocation] = useState('Vesu Canal Road, Surat');
  const [city, setCity] = useState('Surat');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0]
  );
  const [dailyHours, setDailyHours] = useState(8);
  const [budgetPerWorker, setBudgetPerWorker] = useState(700);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchBulkData = async () => {
    try {
      const [reqRes, catRes] = await Promise.all([
        fetch('/api/business/bulk'),
        fetch('/api/categories'),
      ]);
      const reqData = await reqRes.json();
      const catData = await catRes.json();

      if (reqData.success) setRequirements(reqData.requirements || []);
      if (catData.categories) {
        setCategories(catData.categories);
        if (catData.categories.length > 0) setCategoryId(catData.categories[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBulkData();
  }, []);

  const handlePostRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/business/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          categoryId,
          workersNeeded: Number(workersNeeded),
          experienceRequiredYears: Number(experienceRequiredYears),
          location,
          city,
          startDate,
          endDate,
          dailyHours: Number(dailyHours),
          budgetPerWorker: Number(budgetPerWorker),
          description,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to post bulk requirement');
        return;
      }
      alert('Bulk requirement posted successfully!');
      setShowPostModal(false);
      fetchBulkData();
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApply = async (reqId: string) => {
    try {
      const res = await fetch(`/api/business/bulk/${reqId}/apply`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Please login as a verified worker to apply');
        return;
      }
      alert('Application submitted successfully!');
      fetchBulkData();
    } catch (err: any) {
      alert('Application error: ' + err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full flex-1">
        {/* Banner */}
        <div className="bg-navy-900 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-white shadow-xl mb-8 sm:mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border border-navy-800">
          <div className="max-w-2xl space-y-2">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-400">
              Commercial & Construction Staffing
            </span>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              Bulk Labour Solutions for Builders & Contractors
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Hire verified crews of masons, carpenters, electricians, loaders, and cleaners for long-term sites
              with unified GST invoicing and direct attendance tracking.
            </p>
          </div>

          <button
            onClick={() => setShowPostModal(true)}
            className="w-full sm:w-auto px-6 py-3.5 min-h-[46px] bg-amber-500 hover:bg-amber-600 active:scale-98 text-navy-950 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Post Bulk Requirement
          </button>
        </div>

        {/* Requirements Feed */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              Active Bulk Contracts in Surat & Gujarat
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {requirements.length} Open Positions
            </span>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : requirements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {requirements.map((req) => (
                <div
                  key={req.id}
                  className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[11px] font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-full border border-brand-200">
                          {req.category?.name || 'Labour'}
                        </span>
                        <h3 className="font-black text-slate-900 text-base sm:text-lg mt-2">{req.title}</h3>
                        <p className="text-xs font-bold text-slate-500 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-navy-800 shrink-0" />
                          <span className="truncate">{req.business?.companyName || 'Verified Builder'}</span>
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-400 font-bold block">Rate / Worker</span>
                        <span className="text-base sm:text-lg font-black text-navy-900">₹{req.budgetPerWorker}</span>
                        <span className="text-[10px] text-slate-500 block">/ day</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                      {req.description}
                    </p>

                    <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-2 text-xs pt-3 border-t border-slate-100 text-slate-600">
                      <span className="flex items-center gap-1.5 font-medium">
                        <Users className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <strong>{req.workersNeeded} Workers</strong> needed
                      </span>
                      <span className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {req.dailyHours} Hours daily
                      </span>
                      <span className="flex items-center gap-1.5 font-medium min-[360px]:col-span-2">
                        <MapPin className="w-3.5 h-3.5 text-brand-600 shrink-0" />
                        <span className="truncate">{req.location}, {req.city}</span>
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-col min-[380px]:flex-row min-[380px]:items-center justify-between gap-3">
                    <span className="text-xs text-slate-500 font-semibold">
                      {req._count?.applications || 0} Workers Applied
                    </span>

                    <button
                      onClick={() => handleApply(req.id)}
                      className="w-full min-[380px]:w-auto px-5 py-2.5 min-h-[44px] bg-brand-700 hover:bg-brand-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center"
                    >
                      Apply as Worker →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-8 sm:p-12 text-center">
              <p className="text-sm font-bold text-slate-800">No bulk contracts active right now.</p>
              <button
                onClick={() => setShowPostModal(true)}
                className="mt-3 px-5 py-2.5 min-h-[44px] bg-brand-700 text-white font-bold text-xs rounded-xl"
              >
                Post the First Requirement
              </button>
            </div>
          )}
        </div>

        {/* Modal: Post Requirement */}
        {showPostModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
              <h3 className="text-lg font-black text-slate-900">Post Bulk Labour Staffing</h3>
              <form onSubmit={handlePostRequirement} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Requirement Title</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Need 10 Skilled Masons for 30 Days Site Project"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs outline-none min-h-[44px]"
                  />
                </div>

                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Trade Category</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs outline-none bg-white min-h-[44px]"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Workers Needed</label>
                    <input
                      type="number"
                      min={1}
                      value={workersNeeded}
                      onChange={(e) => setWorkersNeeded(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Daily Rate / Worker (₹)</label>
                    <input
                      type="number"
                      min={300}
                      value={budgetPerWorker}
                      onChange={(e) => setBudgetPerWorker(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs outline-none min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Work Hours / Day</label>
                    <input
                      type="number"
                      min={4}
                      max={12}
                      value={dailyHours}
                      onChange={(e) => setDailyHours(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Site Location & City</label>
                  <input
                    type="text"
                    required
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs outline-none min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Detailed Requirements</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Details about site safety gear, lunch, overtime allowances, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base sm:text-xs outline-none resize-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPostModal(false)}
                    className="flex-1 min-h-[46px] py-2.5 border border-slate-300 text-slate-700 font-bold text-xs rounded-xl active:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 min-h-[46px] py-2.5 bg-brand-700 hover:bg-brand-800 active:scale-98 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition-all"
                  >
                    {submitting ? 'Posting...' : 'Publish Contract'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
