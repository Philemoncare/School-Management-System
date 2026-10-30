'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  Building2,
  Search,
  Plus,
  Filter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2,
  CheckCircle,
  XCircle,
  Ban,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

const STATUSES = ['PENDING', 'ACTIVE', 'TRIAL', 'SUSPENDED', 'MAINTENANCE', 'EXPIRED', 'REJECTED', 'DEACTIVATED'];

const emptyProvision = {
  name: '',
  code: '',
  email: '',
  phone: '',
  address: '',
  region: '',
  district: '',
  city: '',
  schoolType: 'Basic School',
  timezone: 'Africa/Accra',
  currency: 'GHS',
  adminFirstName: '',
  adminLastName: '',
  adminEmail: '',
  adminPassword: '',
  planId: '',
};

export default function SuperAdminSchools() {
  const [data, setData] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });
  const [filters, setFilters] = useState<any>({ statuses: [], regions: [], schoolTypes: [] });
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [region, setRegion] = useState('');
  const [schoolType, setSchoolType] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [provision, setProvision] = useState<any>(emptyProvision);
  const [saving, setSaving] = useState(false);
  const [tempPassword, setTempPassword] = useState('');
  const [actionBusy, setActionBusy] = useState('');
  const take = 10;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initialStatus = params.get('status');
    if (initialStatus && STATUSES.includes(initialStatus)) setStatusFilter(initialStatus);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadSchools();
  }, [debouncedSearch, statusFilter, region, schoolType, from, to, page]);

  useEffect(() => {
    Promise.all([
      apiFetch('/super-admin/schools/filters'),
      apiFetch('/super-admin/plans'),
    ])
      .then(([filterData, planData]) => {
        setFilters(filterData);
        setPlans(Array.isArray(planData) ? planData : []);
      })
      .catch(console.error);
  }, []);

  async function loadSchools() {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        skip: String((page - 1) * take),
        take: String(take),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && { status: statusFilter }),
        ...(region && { region }),
        ...(schoolType && { schoolType }),
        ...(from && { from }),
        ...(to && { to }),
      });
      setData(await apiFetch(`/super-admin/schools?${query}`));
    } catch (err: any) {
      setError(err.message || 'Unable to load schools');
    } finally {
      setLoading(false);
    }
  }

  async function provisionSchool() {
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch('/super-admin/schools', {
        method: 'POST',
        body: JSON.stringify({
          ...provision,
          adminPassword: provision.adminPassword || undefined,
          planId: provision.planId || undefined,
          region: provision.region || undefined,
          district: provision.district || undefined,
          city: provision.city || undefined,
          schoolType: provision.schoolType || undefined,
        }),
      });
      setTempPassword(result.adminTemporaryPassword || '');
      if (!result.adminTemporaryPassword) setProvisionOpen(false);
      setProvision(emptyProvision);
      setPage(1);
      await loadSchools();
    } catch (err: any) {
      setError(err.message || 'Unable to provision school');
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(school: any, status: string) {
    let reason = '';
    if (status === 'SUSPENDED' || status === 'REJECTED') {
      const input = window.prompt(`Reason for marking ${school.name} as ${status}:`);
      if (!input) return;
      reason = input;
    } else if (!window.confirm(`Change ${school.name} status to ${status}?`)) {
      return;
    }

    setActionBusy(school.id);
    setError('');
    try {
      await apiFetch(`/super-admin/schools/${school.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason: reason || undefined }),
      });
      await loadSchools();
    } catch (err: any) {
      setError(err.message || 'Unable to update school status');
    } finally {
      setActionBusy('');
    }
  }

  function resetFilters() {
    setStatusFilter('');
    setRegion('');
    setSchoolType('');
    setFrom('');
    setTo('');
    setSearch('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight flex items-center gap-3">
            <Building2 className="text-forest-700" /> School Directory
          </h1>
          <p className="text-warm-500 font-medium mt-1">Global registry of educational institutions.</p>
        </div>
        <Button onClick={() => { setProvisionOpen(true); setTempPassword(''); }} leftIcon={<Plus size={18} />}>
          Provision School
        </Button>
      </div>

      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      <div className="bg-card border border-warm-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-warm-100 space-y-4 bg-ivory-50/50">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 bg-card border border-warm-200 px-4 py-2.5 rounded-xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search name, code, slug, email or phone..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold outline-none"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select
              label="Status"
              value={statusFilter}
              placeholder="All Statuses"
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              options={[{ value: '', label: 'All Statuses' }].concat(STATUSES.map((status) => ({ value: status, label: status })))}
              className="w-auto min-w-[160px]"
            />
            <Button variant="outline" onClick={() => setShowFilters((value) => !value)} leftIcon={<Filter size={16} />}>
              Filters
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-xl border border-warm-200 bg-card p-4">
              <Select
                label="Region"
                value={region}
                placeholder="All regions"
                onChange={(e) => { setRegion(e.target.value); setPage(1); }}
                options={[{ value: '', label: 'All regions' }].concat((filters.regions || []).map((item: string) => ({ value: item, label: item })))}
              />
              <Select
                label="School type"
                value={schoolType}
                placeholder="All types"
                onChange={(e) => { setSchoolType(e.target.value); setPage(1); }}
                options={[{ value: '', label: 'All types' }].concat((filters.schoolTypes || []).map((item: string) => ({ value: item, label: item })))}
              />
              <Input label="Created from" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
              <Input label="Created to" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
              <div className="flex items-end">
                <Button variant="ghost" onClick={resetFilters} className="w-full">Clear filters</Button>
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
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">School Identity</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Location / Type</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Plan</th>
                <th className="px-5 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Usage</th>
                <th className="px-5 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {data.items.map((school) => (
                <tr key={school.id} className="hover:bg-sage-50/30 transition-colors group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center font-bold text-warm-500 text-base border border-warm-100 shrink-0">
                        {school.name[0]}
                      </div>
                      <div className="min-w-0">
                        <Link href={`/super-admin/schools/${school.id}`} className="text-sm font-semibold text-charcoal-900 leading-tight hover:text-forest-700 block truncate">{school.name}</Link>
                        <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5 truncate">{school.code} · {school.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-xs font-semibold text-charcoal-800">{school.region || 'No region'}</p>
                    <p className="text-[11px] font-bold text-warm-400 uppercase">{school.schoolType || 'Unspecified'}</p>
                  </td>
                  <td className="px-5 py-4"><StatusBadge status={school.status} /></td>
                  <td className="px-5 py-4">
                    <p className="text-xs font-semibold text-charcoal-800">{school.subscription?.plan?.name || 'No Plan'}</p>
                    <p className="text-[11px] font-bold text-warm-400 uppercase">{school.subscription?.status || 'INACTIVE'}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-4">
                      <UsageItem label="Students" value={school._count.students} />
                      <UsageItem label="Teachers" value={school._count.teachers} />
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {school.status === 'PENDING' && (
                        <>
                          <ActionButton title="Approve" onClick={() => changeStatus(school, 'ACTIVE')} busy={actionBusy === school.id} icon={<CheckCircle size={15} />} tone="success" />
                          <ActionButton title="Reject" onClick={() => changeStatus(school, 'REJECTED')} busy={actionBusy === school.id} icon={<XCircle size={15} />} tone="danger" />
                        </>
                      )}
                      {['ACTIVE', 'TRIAL'].includes(school.status) && (
                        <ActionButton title="Suspend" onClick={() => changeStatus(school, 'SUSPENDED')} busy={actionBusy === school.id} icon={<Ban size={15} />} tone="danger" />
                      )}
                      {['SUSPENDED', 'EXPIRED', 'REJECTED', 'DEACTIVATED', 'MAINTENANCE'].includes(school.status) && (
                        <ActionButton title="Reactivate" onClick={() => changeStatus(school, 'ACTIVE')} busy={actionBusy === school.id} icon={<RotateCcw size={15} />} tone="success" />
                      )}
                      <Link href={`/super-admin/schools/${school.id}`} className="p-2 text-warm-400 hover:text-forest-700 transition-colors" title="Open school">
                        <ExternalLink size={17} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.items.length === 0 && !loading && (
            <div className="py-20 text-center">
              <ShieldAlert className="mx-auto text-warm-200 mb-4" size={64} />
              <p className="text-warm-400 font-bold text-lg">No schools found matching your criteria</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 bg-ivory-50/50 border-t border-warm-100 flex items-center justify-between">
          <p className="text-xs font-bold text-warm-400 uppercase">Showing {data.items.length} of {data.total} schools</p>
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

      <Modal
        isOpen={provisionOpen}
        onClose={() => { setProvisionOpen(false); setTempPassword(''); }}
        title="Provision School Workspace"
        size="xl"
        footerActions={
          tempPassword ? (
            <Button onClick={() => { setProvisionOpen(false); setTempPassword(''); }}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => setProvisionOpen(false)}>Cancel</Button>
              <Button onClick={provisionSchool} isLoading={saving} disabled={!provision.name || !provision.code || !provision.adminEmail || !provision.adminFirstName || !provision.adminLastName}>
                Create School
              </Button>
            </>
          )
        }
      >
        {tempPassword ? (
          <div className="space-y-3">
            <p className="text-sm font-semibold text-foreground">School created successfully.</p>
            <p className="text-xs text-muted-foreground">Share this temporary administrator password securely. It will not be shown again.</p>
            <div className="rounded-xl border border-warm-200 bg-ivory-50 p-4 font-mono text-lg font-bold text-forest-800">{tempPassword}</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="School name" value={provision.name} onChange={(e) => setProvision({ ...provision, name: e.target.value })} />
              <Input label="School code" value={provision.code} onChange={(e) => setProvision({ ...provision, code: e.target.value })} />
              <Input label="School email" type="email" value={provision.email} onChange={(e) => setProvision({ ...provision, email: e.target.value })} />
              <Input label="Phone" value={provision.phone} onChange={(e) => setProvision({ ...provision, phone: e.target.value })} />
              <Input label="Region" value={provision.region} onChange={(e) => setProvision({ ...provision, region: e.target.value })} />
              <Input label="District" value={provision.district} onChange={(e) => setProvision({ ...provision, district: e.target.value })} />
              <Input label="City" value={provision.city} onChange={(e) => setProvision({ ...provision, city: e.target.value })} />
              <Input label="School type" value={provision.schoolType} onChange={(e) => setProvision({ ...provision, schoolType: e.target.value })} />
              <Input label="Timezone" value={provision.timezone} onChange={(e) => setProvision({ ...provision, timezone: e.target.value })} />
              <Input label="Currency" value={provision.currency} onChange={(e) => setProvision({ ...provision, currency: e.target.value })} />
              <Input label="Address" value={provision.address} onChange={(e) => setProvision({ ...provision, address: e.target.value })} className="sm:col-span-2" />
            </div>
            <div className="border-t border-border pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">School administrator</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input label="First name" value={provision.adminFirstName} onChange={(e) => setProvision({ ...provision, adminFirstName: e.target.value })} />
                <Input label="Last name" value={provision.adminLastName} onChange={(e) => setProvision({ ...provision, adminLastName: e.target.value })} />
                <Input label="Admin email" type="email" value={provision.adminEmail} onChange={(e) => setProvision({ ...provision, adminEmail: e.target.value })} />
                <Input label="Admin password (optional)" type="password" value={provision.adminPassword} onChange={(e) => setProvision({ ...provision, adminPassword: e.target.value })} helperText="Leave blank to generate a one-time temporary password." />
                <Select
                  label="Initial plan (optional)"
                  value={provision.planId}
                  placeholder="No plan"
                  onChange={(e) => setProvision({ ...provision, planId: e.target.value })}
                  options={[{ value: '', label: 'No plan' }].concat(plans.filter((plan) => plan.status !== 'ARCHIVED').map((plan) => ({ value: plan.id, label: plan.name })))}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function ActionButton({ title, onClick, busy, icon, tone }: any) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={busy}
      className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${tone === 'danger' ? 'text-danger-500 hover:bg-danger-50' : 'text-success-600 hover:bg-success-50'}`}
    >
      {busy ? <Loader2 size={15} className="animate-spin" /> : icon}
    </button>
  );
}

function StatusBadge({ status }: any) {
  const styles: any = {
    PENDING: 'bg-warning-100 text-warning-700',
    ACTIVE: 'bg-success-100 text-success-700',
    TRIAL: 'bg-sage-100 text-forest-800',
    SUSPENDED: 'bg-terracotta-100 text-terracotta-700',
    EXPIRED: 'bg-danger-100 text-danger-700',
    MAINTENANCE: 'bg-warning-100 text-warning-700',
    REJECTED: 'bg-danger-100 text-danger-700',
    DEACTIVATED: 'bg-warm-100 text-warm-700',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-tight ${styles[status] || 'bg-warm-100 text-warm-700'}`}>
      {status}
    </span>
  );
}

function UsageItem({ label, value }: any) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-warm-400 uppercase tracking-wide">{label}</p>
      <p className="text-xs font-semibold text-charcoal-800">{value}</p>
    </div>
  );
}
