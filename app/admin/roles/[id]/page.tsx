'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  Users,
  Key,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Check,
  X,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Logo from '@/components/Logo';
import { ALL_PERMISSIONS, PERMISSIONS_BY_CATEGORY, getPermissionLabel } from '@/lib/permissions';

export default function RoleDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [role, setRole] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRole = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/roles/${params.id}`);
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load role details');
        return;
      }
      setRole(data.role);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRole();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 p-4">
        <Card variant="default" padding="lg" className="max-w-md w-full bg-white text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Role Not Found</h2>
          <p className="text-xs text-slate-500">{error || 'The requested role does not exist.'}</p>
          <Button variant="brand" size="sm" onClick={() => router.push('/admin/roles')}>
            Back to Roles
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
              onClick={() => router.push('/admin/roles')}
              icon={<ArrowLeft className="w-4 h-4 text-slate-300" />}
              className="text-slate-200 border-navy-800 hover:bg-navy-900"
            >
              Back to Roles
            </Button>
            <div className="bg-white px-2.5 py-1 rounded-xl">
              <Logo variant="header" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Role Overview Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900">{role.name}</h1>
                {role.isSystem && (
                  <span className="px-2.5 py-0.5 bg-navy-950 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                    System Role
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">{role.description || 'No description available.'}</p>
            </div>

            <Button
              variant="brand"
              size="sm"
              onClick={() => router.push('/admin/roles')}
            >
              Manage Roles
            </Button>
          </div>

          <div className="flex items-center gap-6 text-xs pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Users className="w-4 h-4 text-brand-600" />
              <span>Assigned Staff: {role.staff?.length || 0}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 font-bold">
              <Key className="w-4 h-4 text-amber-500" />
              <span>Enabled Permissions: {role.permissionKeys.length}</span>
            </div>
          </div>
        </div>

        {/* Assigned Staff List */}
        <Card variant="default" padding="md" className="bg-white border-slate-200 shadow-xs space-y-3">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Assigned Staff Members ({role.staff?.length || 0})</h2>
          {role.staff && role.staff.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {role.staff.map((s: any) => (
                <div key={s.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{s.email}</span>
                    <span className="text-slate-400 text-[11px] block">{s.phone}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No staff members currently assigned to this role.</p>
          )}
        </Card>

        {/* Permission Breakdown */}
        <div className="space-y-4">
          <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Permission Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(PERMISSIONS_BY_CATEGORY).map(([category, perms]) => {
              return (
                <div key={category} className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2">
                    {category}
                  </h3>
                  <div className="space-y-1.5">
                    {perms.map((p) => {
                      const isGranted = role.permissionKeys.includes(p.key);
                      return (
                        <div key={p.key} className="flex items-center justify-between text-xs py-1">
                          <span className={isGranted ? 'font-bold text-slate-900' : 'text-slate-400'}>
                            {p.label}
                          </span>
                          {isGranted ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                              <Check className="w-3.5 h-3.5" /> Allowed
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] flex items-center gap-1">
                              <X className="w-3.5 h-3.5" /> No Access
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
