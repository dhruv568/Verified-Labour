'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Users,
  Key,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Search,
  Lock,
  ArrowLeft,
  X,
  Loader2,
  Check,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Logo from '@/components/Logo';
import { ALL_PERMISSIONS, PERMISSIONS_BY_CATEGORY, getPermissionLabel } from '@/lib/permissions';

export default function RolesManagementPage() {
  const router = useRouter();

  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<any | null>(null);
  const [roleName, setRoleName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Permission Group Accordion States (all expanded by default)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>(
    Object.keys(PERMISSIONS_BY_CATEGORY).reduce((acc, cat) => ({ ...acc, [cat]: true }), {})
  );

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Toast Action Message
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/roles');
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to load roles');
        return;
      }
      setRoles(data.roles || []);
    } catch (err: any) {
      setError(err.message || 'Error connecting to server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const openCreateModal = () => {
    setEditingRole(null);
    setRoleName('');
    setRoleDescription('');
    setSelectedPermissions([]);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (role: any) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || '');
    setSelectedPermissions(role.permissionKeys || []);
    setFormError(null);
    setIsModalOpen(true);
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const selectAllCategory = (category: string) => {
    const categoryKeys = PERMISSIONS_BY_CATEGORY[category]?.map((p) => p.key) || [];
    setSelectedPermissions((prev) => Array.from(new Set([...prev, ...categoryKeys])));
  };

  const clearCategory = (category: string) => {
    const categoryKeys = PERMISSIONS_BY_CATEGORY[category]?.map((p) => p.key) || [];
    setSelectedPermissions((prev) => prev.filter((k) => !categoryKeys.includes(k)));
  };

  const toggleCategoryExpand = (category: string) => {
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleSubmitRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!roleName.trim()) {
      setFormError('Role name is required.');
      return;
    }

    setSubmitting(true);
    try {
      const isEdit = Boolean(editingRole);
      const url = isEdit ? `/api/admin/roles/${editingRole.id}` : '/api/admin/roles';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: roleName.trim(),
          description: roleDescription.trim(),
          permissionKeys: selectedPermissions,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || 'Failed to save role');
        return;
      }

      setActionMessage({
        type: 'success',
        msg: isEdit ? `Role "${roleName}" updated successfully!` : `Role "${roleName}" created successfully!`,
      });

      setIsModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      setFormError(err.message || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete custom role "${roleName}"?`)) return;

    try {
      const res = await fetch(`/api/admin/roles/${roleId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Failed to delete role');
        return;
      }
      setActionMessage({ type: 'success', msg: `Role "${roleName}" deleted.` });
      fetchRoles();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 pb-12">
      {/* Navigation Bar */}
      <header className="bg-navy-950 text-white border-b border-navy-900 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin')}
              icon={<ArrowLeft className="w-4 h-4 text-slate-300" />}
              className="text-slate-200 border-navy-800 hover:bg-navy-900"
            >
              Back to Admin Panel
            </Button>
            <div className="bg-white px-2.5 py-1 rounded-xl">
              <Logo variant="header" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Role-Based Access Control (RBAC)</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Toast Message */}
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

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-brand-600" />
              Role Management
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Create custom roles, assign backend-enforced permissions, and control staff access levels across the Verified Labour panel.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRoles}
              isLoading={loading}
              icon={<RefreshCw className="w-4 h-4" />}
            >
              Refresh
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={openCreateModal}
              icon={<Plus className="w-4 h-4" />}
              className="w-full sm:w-auto justify-center"
            >
              Create Role
            </Button>
          </div>
        </div>

        {/* Search Bar & Role Cards */}
        <div className="space-y-4">
          <div className="relative max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search roles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-brand-500"
            />
          </div>

          {loading ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-bold">Loading Custom Roles & Permissions...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <span>{error}</span>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">No roles found</p>
              <p className="text-xs text-slate-500 mt-1">Click "Create Role" to define a custom role.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredRoles.map((role) => (
                <Card
                  key={role.id}
                  variant="default"
                  padding="md"
                  className="bg-white border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-900 text-base">{role.name}</h3>
                          {role.isSystem && (
                            <span className="px-2 py-0.5 bg-navy-950 text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                              System
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {role.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Users className="w-3.5 h-3.5 text-brand-600" />
                        <span>{role.staffCount} Staff</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Key className="w-3.5 h-3.5 text-amber-500" />
                        <span>{role.permissionsCount} Permissions</span>
                      </div>
                    </div>

                    {/* Permission Pills Preview */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {role.permissionKeys.slice(0, 5).map((key: string) => (
                        <span
                          key={key}
                          className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-medium border border-slate-200"
                        >
                          {getPermissionLabel(key)}
                        </span>
                      ))}
                      {role.permissionKeys.length > 5 && (
                        <span className="px-2 py-0.5 bg-brand-50 text-brand-700 rounded-md text-[10px] font-bold border border-brand-200">
                          +{role.permissionKeys.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/admin/roles/${role.id}`)}
                      className="text-xs w-full justify-center"
                    >
                      View Details
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(role)}
                      icon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
                      className="text-xs shrink-0"
                    >
                      Edit
                    </Button>
                    {!role.isSystem && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        className="text-xs shrink-0 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT ROLE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-navy-950 text-white flex items-center justify-between border-b border-navy-900">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-6 h-6 text-brand-400" />
                <h2 className="text-lg font-black">{editingRole ? 'Edit Custom Role' : 'Create Custom Role'}</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleSubmitRole} className="flex-1 overflow-y-auto p-6 space-y-6">
              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Role Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Content Manager"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    disabled={editingRole?.isSystem}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">Description</label>
                  <input
                    type="text"
                    placeholder="e.g. Can manage website content and testimonials."
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Role Summary Bar */}
              <div className="p-4 bg-brand-50 border border-brand-200 rounded-2xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-brand-950 uppercase tracking-wider text-[11px] block">Role Summary</span>
                  <span className="font-extrabold text-slate-900 text-sm">{roleName || 'Unnamed Role'}</span>
                </div>
                <div className="text-right">
                  <span className="px-3 py-1 bg-brand-600 text-white rounded-full font-bold text-xs">
                    {selectedPermissions.length} permissions enabled
                  </span>
                </div>
              </div>

              {/* PERMISSION MATRIX */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <h3 className="font-black text-slate-900 text-sm uppercase tracking-wider">Permission Matrix</h3>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions(ALL_PERMISSIONS.map((p) => p.key))}
                      className="text-xs font-bold text-brand-600 hover:text-brand-800 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => setSelectedPermissions([])}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 hover:underline"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-3">
                  {Object.entries(PERMISSIONS_BY_CATEGORY).map(([category, perms]) => {
                    const isExpanded = expandedCategories[category];
                    const categoryKeys = perms.map((p) => p.key);
                    const selectedCategoryCount = categoryKeys.filter((k) => selectedPermissions.includes(k)).length;
                    const allCategorySelected = selectedCategoryCount === categoryKeys.length;

                    return (
                      <div key={category} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                        {/* Group Header */}
                        <div className="px-4 py-3 bg-slate-50 flex items-center justify-between border-b border-slate-200">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => toggleCategoryExpand(category)}
                              className="text-slate-500 hover:text-slate-800"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <span className="font-extrabold text-xs text-slate-900 uppercase tracking-wider">
                              {category}
                            </span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                              {selectedCategoryCount} / {categoryKeys.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => (allCategorySelected ? clearCategory(category) : selectAllCategory(category))}
                              className="text-[11px] font-bold text-brand-600 hover:underline"
                            >
                              {allCategorySelected ? 'Clear Group' : 'Select Group'}
                            </button>
                          </div>
                        </div>

                        {/* Permission Checkboxes */}
                        {isExpanded && (
                          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white">
                            {perms.map((perm) => {
                              const isChecked = selectedPermissions.includes(perm.key);
                              return (
                                <label
                                  key={perm.key}
                                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                                    isChecked
                                      ? 'bg-brand-50/50 border-brand-300 text-slate-900'
                                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermission(perm.key)}
                                    className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                                  />
                                  <div>
                                    <div className="text-xs font-bold text-slate-900">{perm.label}</div>
                                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                                      {perm.description}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="brand"
                  size="sm"
                  isLoading={submitting}
                  icon={<Check className="w-4 h-4" />}
                >
                  {editingRole ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
