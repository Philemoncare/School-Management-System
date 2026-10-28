'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Filter,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Unlock,
  Users,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

const PLATFORM_ROLE_OPTIONS = [
  { value: 'PLATFORM_SUPER_ADMIN', label: 'Platform Super Admin' },
  { value: 'PLATFORM_OPERATIONS_ADMIN', label: 'Platform Operations Admin' },
  { value: 'PLATFORM_SUPPORT_ADMIN', label: 'Platform Support Admin' },
];

export default function SuperAdminUsers() {
  const [data, setData] = useState<any>({ items: [], total: 0, roles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const take = 20;
  const [roleModal, setRoleModal] = useState(false);
  const [roleTarget, setRoleTarget] = useState<any>(null);
  const [roleForm, setRoleForm] = useState({ role: '', reason: '' });
  const [roleSaving, setRoleSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadUsers();
  }, [debouncedSearch, status, role, page]);

  async function loadUsers() {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        skip: String((page - 1) * take),
        take: String(take),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status && { status }),
        ...(role && { role }),
      });
      setData(await apiFetch(`/super-admin/users?${query}`));
    } catch (err: any) {
      setError(err.message || 'Unable to load users');
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(user: any) {
    const action = user.isActive ? 'disable' : 'enable';
    if (!window.confirm(`Are you sure you want to ${action} ${user.email}?`)) return;
    setBusy(`status-${user.id}`);
    setError('');
    try {
      await apiFetch(`/super-admin/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive, reason: user.isActive ? 'Disabled by Super Admin' : 'Enabled by Super Admin' }),
      });
      await loadUsers();
    } catch (err: any) {
      setError(err.message || 'Unable to update user');
    } finally {
      setBusy('');
    }
  }

  async function sendReset(user: any) {
    if (!window.confirm(`Send a secure password reset email to ${user.email}?`)) return;
    setBusy(`reset-${user.id}`);
    setError('');
    try {
      await apiFetch(`/super-admin/users/${user.id}/send-password-reset`, { method: 'POST' });
      setError('');
      showFeedback('SUCCESS', `Password reset instructions sent to ${user.email}.`);
    } catch (err: any) {
      setError(err.message || 'Unable to send reset email');
    } finally {
      setBusy('');
    }
  }

  async function openRoleAssignment(user: any) {
    setRoleTarget(user);
    setRoleForm({ role: '', reason: '' });
    setRoleModal(true);
  }

  async function closeRoleModal() {
    setRoleModal(false);
    setRoleTarget(null);
    setRoleForm({ role: '', reason: '' });
  }

  async function assignRole() {
    if (!roleForm.role) return setError('Select a platform role.');
    setRoleSaving(true);
    setError('');
    try {
      await apiFetch(`/super-admin/users/${roleTarget.id}/platform-role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: roleForm.role, reason: roleForm.reason || undefined }),
      });
      await loadUsers();
      closeRoleModal();
    } catch (err: any) {
      setError(err.message || 'Unable to assign platform role');
    } finally {
      setRoleSaving(false);
    }
  }

  function hasPlatformRole(user: any): boolean {
    return user.userRoles?.some(
      (ur: any) => ur.role?.schoolId === null && ur.role?.name?.startsWith('PLATFORM_'),
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
          <Users className="text-forest-700" /> Platform User Directory
        </h1>
        <p className="text-warm-500 font-medium mt-1">Search, inspect, and secure every platform account.</p>
      </div>

      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      <div className="bg-card border border-warm-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-warm-100 space-y-4 bg-ivory-50/50">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 bg-card border border-warm-200 px-4 py-2.5 rounded-xl flex items-center shadow-sm">
              <Mail size={18} className="text-warm-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search by name, email or phone..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold outline-none"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-card border border-warm-200 rounded-xl px-4 py-2.5 text-sm font-bold">
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="pending">Unverified</option>
              <option value="locked">Locked</option>
              <option value="SUSPENDED">Suspended</option>
            </Select>
            <Button variant="outline" onClick={() => setShowFilters((value) => !value)} leftIcon={<Filter size={16} />}>Filters</Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-xl border border-warm-200 bg-card p-4">
              <Select label="Role" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
                <option value="">All roles</option>
                {data.roles?.map((item: string) => <option key={item} value={item}>{item}</option>)}
              </Select>
              <div className="flex items-end">
                <Button variant="ghost" className="w-full" onClick={() => { setStatus(''); setRole(''); setSearch(''); setPage(1); }}>Clear filters</Button>
              </div>
            </div>
          )}
        </div>

        <div className="relative overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">User Profile</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Role & Permissions</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Memberships</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Security</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {data.items.map((user: any) => (
                <tr key={user.id} className="hover:bg-sage-50/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center font-semibold text-warm-500 border border-warm-100 shrink-0">
                        {user.firstName?.[0] || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-charcoal-900 leading-tight">{user.firstName} {user.lastName}</p>
                        <p className="flex items-center gap-1 text-[11px] font-bold text-warm-400 mt-1 truncate">
                          <Mail size={10} /> {user.email}
                        </p>
                        <p className="flex items-center gap-1 text-[10px] font-semibold text-warm-300 mt-0.5">
                          <Calendar size={9} /> Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1 max-w-[220px]">
                      {user.userRoles.map((ur: any) => (
                        <span key={ur.id} className="px-1.5 py-0.5 bg-sage-50 text-forest-700 rounded text-[10px] font-semibold uppercase" title={ur.school?.name || 'Platform'}>
                          {ur.role.name}
                        </span>
                      ))}
                      {user.userRoles.length === 0 && <span className="text-[11px] text-warm-400 italic">No roles</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs font-semibold text-warm-700">{user.memberships.length} school(s)</p>
                    <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5 truncate max-w-[150px]">
                      {user.memberships[0]?.school.name || 'Standalone'}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${user.emailVerified ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'}`}>
                        <ShieldCheck size={10} /> {user.emailVerified ? 'Email verified' : 'Unverified'}
                      </span>
                      <span className="text-[10px] font-semibold text-warm-400">
                        {user.MfaMethod?.some((method: any) => method.verifiedAt) ? 'MFA enabled' : 'MFA not enabled'}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold uppercase ${user.isActive ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'}`}>
                      {user.isActive ? 'Active' : 'Disabled'}
                    </span>
                    <p className="mt-1 text-[10px] font-bold uppercase text-warm-400">{user.accountState}</p>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => sendReset(user)} disabled={busy === `reset-${user.id}`} className="p-2 text-warm-400 hover:text-forest-700 transition-colors disabled:opacity-40" title="Send secure password reset">
                        {busy === `reset-${user.id}` ? <Loader2 size={17} className="animate-spin" /> : <KeyRound size={17} />}
                      </button>
                      <button onClick={() => toggleStatus(user)} disabled={busy === `status-${user.id}`} className={`p-2 transition-colors disabled:opacity-40 ${user.isActive ? 'text-warm-400 hover:text-terracotta-600' : 'text-warm-400 hover:text-success-600'}`} title={user.isActive ? 'Disable account' : 'Enable account'}>
                        {busy === `status-${user.id}` ? <Loader2 size={17} className="animate-spin" /> : user.isActive ? <Lock size={17} /> : <Unlock size={17} />}
                      </button>
                      {!hasPlatformRole(user) && (
                        <button
                          onClick={() => openRoleAssignment(user)}
                          disabled={busy === `status-${user.id}`}
                          className="p-2 text-forest-400 hover:text-forest-700 transition-colors disabled:opacity-40"
                          title="Assign platform role"
                        >
                          <Plus size={17} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 sm:p-6 bg-ivory-50/50 border-t border-warm-100 flex items-center justify-between">
          <p className="text-xs font-bold text-warm-400 uppercase">Showing {data.items.length} of {data.total} users</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="p-2 bg-card border border-warm-200 rounded-xl disabled:opacity-30 shadow-sm">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setPage((value) => value + 1)} disabled={page * take >= data.total} className="p-2 bg-card border border-warm-200 rounded-xl disabled:opacity-30 shadow-sm">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <PlatformRoleModal
        isOpen={roleModal}
        onClose={closeRoleModal}
        target={roleTarget}
        form={roleForm}
        setForm={setRoleForm}
        saving={roleSaving}
        assignRole={assignRole}
      />
    </div>
  );
}

function PlatformRoleModal({
  isOpen,
  onClose,
  target,
  form,
  setForm,
  saving,
  assignRole,
}: {
  isOpen: boolean;
  onClose: () => void;
  target: any;
  form: any;
  setForm: (value: any) => void;
  saving: boolean;
  assignRole: () => void;
}) {
  if (!isOpen) return null;
  const platformRoles = target.userRoles?.filter(
    (ur: any) => ur.role?.schoolId === null,
  );
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Platform Role" size="md">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Assign a platform-level role to <strong>{target.email}</strong>.
        </p>
        {platformRoles.length > 0 && (
          <div className="rounded-lg bg-warning-50 p-3 text-sm text-warning-800">
            This account already has platform role(s):{' '}
            {platformRoles.map((ur: any) => ur.role?.name).join(', ')}.
            Assigning another role adds it alongside existing ones.
          </div>
        )}
        <Select
          label="Platform role"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="">Select a role</option>
          {PLATFORM_ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          label="Reason (required for audit)"
          value={form.reason}
          onChange={(e) => setForm({ ...form, reason: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Only a Platform Super Admin can assign platform roles. This action is
          audited.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={assignRole} isLoading={saving} disabled={!form.role || !form.reason.trim()}>
            Assign Role
          </Button>
        </div>
      </div>
    </Modal>
  );
}
