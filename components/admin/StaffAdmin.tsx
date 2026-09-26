'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  RefreshCw,
  Mail,
  Shield,
  Search,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Trash2,
  Eye,
  Check,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';

interface StaffAdminProps {
  onSwitchToRoles?: () => void;
  initialStaffId?: string | null;
}

export default function StaffAdmin({ onSwitchToRoles, initialStaffId }: StaffAdminProps) {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Add Staff Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFullName, setAddFullName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addRoleId, setAddRoleId] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  // Change Role Modal State
  const [roleModalStaff, setRoleModalStaff] = useState<any | null>(null);
  const [changeRoleId, setChangeRoleId] = useState('');
  const [changeRoleLoading, setChangeRoleLoading] = useState(false);

  // Staff Details Modal State
  const [detailStaff, setDetailStaff] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Confirmation Dialog State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  // Action Message Banner
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [staffRes, rolesRes] = await Promise.all([
        fetch('/api/admin/staff'),
        fetch('/api/admin/roles'),
      ]);

      const [staffData, rolesData] = await Promise.all([
        staffRes.json(),
        rolesRes.json(),
      ]);

      if (staffData.success) setStaffList(staffData.staff || []);
      if (rolesData.success) {
        setRoles(rolesData.roles || []);
        if (rolesData.roles.length > 0 && !addRoleId) {
          setAddRoleId(rolesData.roles[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch staff data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle initialStaffId if present
  useEffect(() => {
    if (initialStaffId) {
      fetchStaffDetails(initialStaffId);
    }
  }, [initialStaffId]);

  const fetchStaffDetails = async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/staff/${id}`);
      const data = await res.json();
      if (data.success && data.staff) {
        setDetailStaff(data.staff);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);

    if (!addFullName.trim() || !addEmail.trim() || !addRoleId) {
      setAddError('All fields are required.');
      return;
    }

    setAddLoading(true);
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: addFullName.trim(),
          email: addEmail.trim(),
          roleId: addRoleId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setAddError(data.error || 'Failed to invite staff member.');
        return;
      }

      setActionMessage({
        type: 'success',
        msg: `Invitation sent to ${addEmail}!`,
      });

      setAddFullName('');
      setAddEmail('');
      setIsAddModalOpen(false);
      fetchData();
    } catch (err: any) {
      setAddError(err.message || 'Request failed');
    } finally {
      setAddLoading(false);
    }
  };

  const handleToggleStaffStatus = (staff: any) => {
    const newStatus = staff.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
    setConfirmModal({
      isOpen: true,
      title: `${newStatus === 'DISABLED' ? 'Disable' : 'Enable'} Staff Access`,
      description: `Are you sure you want to ${newStatus.toLowerCase()} admin access for "${staff.fullName}" (${staff.email})?`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/staff/${staff.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            setActionMessage({ type: 'error', msg: data.error || 'Action failed' });
            return;
          }
          setActionMessage({ type: 'success', msg: `Staff access ${newStatus.toLowerCase()}d successfully.` });
          fetchData();
        } catch (err: any) {
          setActionMessage({ type: 'error', msg: err.message });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleChangeRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleModalStaff || !changeRoleId) return;

    setChangeRoleLoading(true);
    try {
      const res = await fetch(`/api/admin/staff/${roleModalStaff.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roleId: changeRoleId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage({ type: 'error', msg: data.error || 'Failed to update role' });
        return;
      }
      setActionMessage({ type: 'success', msg: 'Staff role updated successfully!' });
      setRoleModalStaff(null);
      fetchData();
    } catch (err: any) {
      setActionMessage({ type: 'error', msg: err.message });
    } finally {
      setChangeRoleLoading(false);
    }
  };

  const handleResendInvitation = async (staff: any) => {
    try {
      const targetId = staff.invitationId || staff.id;
      const res = await fetch(`/api/admin/staff/${targetId}/resend-invite`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionMessage({ type: 'error', msg: data.error || 'Failed to resend invitation' });
        return;
      }
      setActionMessage({ type: 'success', msg: `Invitation resent to ${staff.email}!` });
      fetchData();
    } catch (err: any) {
      setActionMessage({ type: 'error', msg: err.message });
    }
  };

  const handleRemoveStaff = (staff: any) => {
    setConfirmModal({
      isOpen: true,
      title: 'Remove Staff Member?',
      description: `Removing "${staff.fullName}" (${staff.email}) will immediately revoke all their admin access privileges. This action is logged.`,
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/staff/${staff.id}`, {
            method: 'DELETE',
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            setActionMessage({ type: 'error', msg: data.error || 'Failed to remove staff' });
            return;
          }
          setActionMessage({ type: 'success', msg: 'Staff member removed successfully.' });
          fetchData();
        } catch (err: any) {
          setActionMessage({ type: 'error', msg: err.message });
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roleName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || s.roleId === roleFilter;
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl shadow-xl border flex items-center justify-between text-xs font-bold ${
            actionMessage.type === 'success'
              ? 'bg-emerald-900 text-emerald-100 border-emerald-700'
              : 'bg-red-900 text-red-100 border-red-700'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionMessage.msg}</span>
          </div>
          <button onClick={() => setActionMessage(null)}>
            <X className="w-4 h-4 text-slate-300" />
          </button>
        </div>
      )}

      {/* Page Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-brand-600" />
            Staff Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Add staff members, assign custom roles, send secure invitations, and manage permissions.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onSwitchToRoles && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSwitchToRoles}
              icon={<Shield className="w-4 h-4" />}
            >
              Role Management
            </Button>
          )}
          <Button
            variant="brand"
            size="sm"
            onClick={() => {
              setAddError(null);
              setIsAddModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
            className="w-full sm:w-auto justify-center"
          >
            Add Staff
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search staff name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Roles</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DISABLED">Disabled</option>
            <option value="PENDING">Pending Invitation</option>
            <option value="EXPIRED">Expired Invitation</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchData} isLoading={loading} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Staff Table */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-bold">Loading Verified Labour Staff Directory...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No staff members found</p>
          <p className="text-xs text-slate-500 mt-1">Click "Add Staff" to invite team members.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                  <th className="px-5 py-3.5">Staff Details</th>
                  <th className="px-5 py-3.5">Assigned Role</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Invitation</th>
                  <th className="px-5 py-3.5">Last Login</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900">{staff.fullName}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{staff.email}</div>
                    </td>

                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 font-extrabold text-slate-800 bg-brand-50 border border-brand-200 px-2.5 py-1 rounded-lg">
                        <Shield className="w-3.5 h-3.5 text-brand-600" />
                        {staff.roleName}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      {staff.status === 'ACTIVE' ? (
                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px] uppercase">
                          Active
                        </span>
                      ) : staff.status === 'DISABLED' ? (
                        <span className="px-2.5 py-1 bg-red-100 text-red-800 rounded-full font-bold text-[10px] uppercase">
                          Disabled
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] uppercase">
                          {staff.status}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {staff.invitationStatus === 'ACCEPTED' ? (
                        <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Accepted
                        </span>
                      ) : staff.invitationStatus === 'EXPIRED' ? (
                        <span className="text-red-600 font-bold text-[11px]">Expired</span>
                      ) : (
                        <span className="text-amber-600 font-bold text-[11px]">Pending</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                      {staff.lastLogin ? new Date(staff.lastLogin).toLocaleString() : 'Never'}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchStaffDetails(staff.id)}
                          icon={<Eye className="w-3.5 h-3.5" />}
                          className="text-[11px]"
                        >
                          Details
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRoleModalStaff(staff);
                            setChangeRoleId(staff.roleId);
                          }}
                          className="text-[11px]"
                        >
                          Role
                        </Button>

                        {staff.invitationStatus !== 'ACCEPTED' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResendInvitation(staff)}
                            icon={<Mail className="w-3.5 h-3.5 text-blue-600" />}
                            className="text-[11px]"
                          >
                            Resend
                          </Button>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStaffStatus(staff)}
                          className={`text-[11px] ${
                            staff.status === 'ACTIVE' ? 'text-amber-700 border-amber-300' : 'text-emerald-700 border-emerald-300'
                          }`}
                        >
                          {staff.status === 'ACTIVE' ? 'Disable' : 'Enable'}
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveStaff(staff)}
                          icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                          className="text-[11px] text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-600" />
                <h3 className="font-extrabold text-slate-900 text-base">Add New Staff Member</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {addError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Rahul Sharma"
                  value={addFullName}
                  onChange={(e) => setAddFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="rahul@example.com"
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Assigned Role <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={addRoleId}
                  onChange={(e) => setAddRoleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-brand-500"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.permissionsCount} permissions)
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-slate-900">🔒 Invitation Security Notice:</p>
                <p>An invitation email containing a secure single-use link will be dispatched immediately.</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="brand" size="sm" isLoading={addLoading} icon={<Mail className="w-4 h-4" />}>
                  Send Staff Invitation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE ROLE MODAL */}
      {roleModalStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Change Staff Role</h3>
              <button onClick={() => setRoleModalStaff(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangeRoleSubmit} className="space-y-4">
              <div>
                <span className="text-xs text-slate-500 block mb-1">Staff Member:</span>
                <span className="font-bold text-slate-900 text-sm block">{roleModalStaff.fullName}</span>
                <span className="text-xs text-slate-500 font-mono">{roleModalStaff.email}</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">Select New Role</label>
                <select
                  value={changeRoleId}
                  onChange={(e) => setChangeRoleId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.permissionsCount} permissions)
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <Button type="button" variant="outline" size="sm" onClick={() => setRoleModalStaff(null)}>
                  Cancel
                </Button>
                <Button type="submit" variant="brand" size="sm" isLoading={changeRoleLoading}>
                  Update Staff Role
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STAFF DETAILS MODAL */}
      {detailStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">{detailStaff.fullName}</h3>
                <p className="text-xs text-slate-500 font-mono">{detailStaff.email}</p>
              </div>
              <button onClick={() => setDetailStaff(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase">Assigned Role</span>
                <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{detailStaff.role?.name || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase">Invitation Status</span>
                <span className="font-extrabold text-slate-900 text-sm mt-0.5 block">{detailStaff.invitationStatus || 'N/A'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-slate-400 block font-semibold text-[11px] uppercase">Last Login</span>
                <span className="font-mono text-slate-700 text-xs mt-0.5 block">
                  {detailStaff.lastLogin ? new Date(detailStaff.lastLogin).toLocaleString() : 'Never'}
                </span>
              </div>
            </div>

            {/* Assigned Permissions */}
            <Card variant="default" padding="md" className="bg-white border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                Assigned Permissions ({detailStaff.permissions?.length || 0})
              </h4>
              {detailStaff.permissions && detailStaff.permissions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                  {detailStaff.permissions.map((p: any) => (
                    <div key={p.key} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{p.category}</span>
                      <span className="font-bold text-slate-900 block">{p.label}</span>
                      <span className="font-mono text-[10px] text-brand-600 font-semibold">{p.key}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No permissions assigned.</p>
              )}
            </Card>

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setDetailStaff(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200 text-center">
            <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-black text-slate-900 text-base">{confirmModal.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{confirmModal.description}</p>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button variant="outline" size="sm" onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}>
                Cancel
              </Button>
              <Button variant="brand" size="sm" onClick={confirmModal.onConfirm}>
                Confirm Action
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
