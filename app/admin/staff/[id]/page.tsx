'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  ArrowLeft,
  Shield,
  Key,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
  Clock,
  UserCheck,
  UserX,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Logo from '@/components/Logo';

export default function StaffDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${params.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load staff member details');
        return;
      }
      setStaff(data.staff);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <Card variant="default" padding="lg" className="max-w-md w-full bg-white text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Staff Member Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'The requested staff member does not exist.'}</p>
          <Button variant="brand" size="sm" onClick={() => router.push('/admin/staff')}>
            Back to Staff Directory
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12">
      <header className="bg-navy-950 text-white border-b border-navy-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/staff')}
              icon={<ArrowLeft className="w-4 h-4 text-slate-300" />}
              className="text-slate-200 border-navy-800 hover:bg-navy-900"
            >
              Back to Staff
            </Button>
            <div className="bg-white px-2.5 py-1 rounded-xl">
              <Logo variant="header" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Profile Card Header */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900">{staff.fullName}</h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{staff.email}</p>
            </div>

            <div className="flex items-center gap-2">
              {staff.status === 'ACTIVE' ? (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                  Active Staff
                </span>
              ) : staff.status === 'DISABLED' ? (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full font-bold text-xs">
                  Disabled
                </span>
              ) : (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs">
                  {staff.status}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold text-[11px] uppercase">Assigned Role</span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{staff.role?.name}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold text-[11px] uppercase">Invitation Status</span>
              <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{staff.invitationStatus}</span>
            </div>

            <div>
              <span className="text-slate-400 block font-semibold text-[11px] uppercase">Last Login</span>
              <span className="font-mono text-slate-700 text-xs mt-0.5 block">
                {staff.lastLogin ? new Date(staff.lastLogin).toLocaleString() : 'Never'}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Permissions Summary */}
        <Card variant="default" padding="md" className="bg-white border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Assigned Permissions Summary ({staff.permissions?.length || 0})
            </h2>
            <span className="text-xs text-brand-600 font-bold">Enforced Server-Side</span>
          </div>

          {staff.permissions && staff.permissions.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {staff.permissions.map((p: any) => (
                <div key={p.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{p.category}</span>
                  <span className="font-bold text-slate-900 text-xs mt-0.5 block">{p.label}</span>
                  <span className="font-mono text-[10px] text-brand-600 font-semibold">{p.key}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No permissions assigned to this role.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
