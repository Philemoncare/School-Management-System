'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Search,
  Plus,
  ChevronRight,
  Loader2,
  Building,
  UserCircle,
  AlertCircle,
  Mail,
} from 'lucide-react';

export default function StaffDirectory() {
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [departmentId, setDepartmentId] = useState('');

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    apiFetch('/hr/departments')
      .then((data) => setDepartments(Array.isArray(data) ? data : []))
      .catch(() => setDepartments([]));
  }, []);

  // Honour a deep-linked employee type filter (e.g. /dashboard/hr/staff?type=TEACHER).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('type');
    if (requested === 'TEACHER' || requested === 'STAFF') setType(requested);
  }, []);

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (status) params.set('status', status);
      if (type) params.set('type', type);
      if (departmentId) params.set('departmentId', departmentId);
      const data = await apiFetch(`/hr/staff${params.toString() ? `?${params.toString()}` : ''}`);
      setStaff(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setStaff([]);
      setError(err?.message || 'Could not load the staff directory.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status, type, departmentId]);

  useEffect(() => {
    loadStaff();
  }, [loadStaff]);

  const hasFilters = Boolean(debouncedSearch || status || type || departmentId);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            Staff directory
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
            {staff.length} teaching and administrative record{staff.length === 1 ? '' : 's'}
          </p>
        </div>
        <Link
          href="/dashboard/hr/staff/new"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-charcoal-900 px-6 py-3 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-charcoal-950"
        >
          <Plus size={18} /> Register employee
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <div className="grid grid-cols-1 gap-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="flex items-center rounded-2xl border border-warm-200 bg-card px-5 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-forest-700/10 md:col-span-2 xl:col-span-1">
            <Search size={18} className="mr-3 shrink-0 text-warm-400" />
            <input
              type="search"
              aria-label="Search staff"
              placeholder="Name, staff ID or email…"
              className="w-full border-none bg-transparent text-sm font-bold text-charcoal-900 placeholder:text-warm-400 focus:ring-0"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <Select
            label="Employee type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            options={[
              { value: '', label: 'All types' },
              { value: 'TEACHER', label: 'Teachers' },
              { value: 'STAFF', label: 'Non-teaching staff' },
            ]}
          />
          <Select
            label="Department"
            value={departmentId}
            onChange={(event) => setDepartmentId(event.target.value)}
            options={[
              { value: '', label: 'All departments' },
              ...departments.map((department) => ({
                value: department.id,
                label: department.name,
              })),
            ]}
          />
          <Select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspended' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'TERMINATED', label: 'Terminated' },
              { value: 'RETIRED', label: 'Retired' },
            ]}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 border-b border-danger-100 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </span>
            <Button variant="outline" size="sm" onClick={loadStaff}>
              Try again
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-medium text-warm-500">
            <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading workforce records…
          </div>
        ) : staff.length === 0 ? (
          <div className="p-6 sm:p-10">
            <EmptyState
              icon={<UserCircle className="h-8 w-8" />}
              title={hasFilters ? 'No staff match your filters' : 'No workforce records yet'}
              description={
                hasFilters
                  ? 'Clear the search or filters to see the full directory.'
                  : 'Register the first employee to start building the staff directory.'
              }
              actionButton={
                hasFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setStatus('');
                      setType('');
                      setDepartmentId('');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Link
                    href="/dashboard/hr/staff/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
                  >
                    <Plus size={15} /> Register employee
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50/50">
                <tr>
                  {['Employee', 'Department & position', 'Type', 'Status', 'Actions'].map(
                    (heading) => (
                      <th
                        key={heading}
                        className={`px-5 py-4 text-[10px] font-semibold uppercase tracking-wide text-warm-400 sm:px-8 ${
                          heading === 'Actions' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {staff.map((member) => (
                  <tr key={`${member.type}-${member.id}`} className="group transition-colors hover:bg-ivory-50/50">
                    <td className="px-5 py-5 sm:px-8">
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warm-100 text-xs font-semibold text-warm-400 transition-colors group-hover:bg-sage-100 group-hover:text-forest-700">
                          {member.firstName?.[0] ?? ''}
                          {member.lastName?.[0] ?? ''}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight text-charcoal-900">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="mt-0.5 text-[11px] font-bold uppercase tracking-tight text-warm-400">
                            {member.employeeId || 'No staff ID'}
                          </p>
                          {member.user?.email && (
                            <p className="mt-0.5 flex items-center gap-1 text-[11px] font-medium text-warm-400">
                              <Mail size={10} /> {member.user.email}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-5 sm:px-8">
                      <p className="text-xs font-bold text-warm-700">
                        {member.position?.name || member.designation || 'Unassigned'}
                      </p>
                      <p className="mt-1 flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                        <Building size={10} /> {member.department?.name || 'General'}
                      </p>
                    </td>
                    <td className="px-5 py-5 sm:px-8">
                      <span
                        className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold uppercase tracking-tight ${
                          member.type === 'TEACHER'
                            ? 'bg-sage-50 text-forest-700'
                            : 'bg-terracotta-50 text-terracotta-600'
                        }`}
                      >
                        {member.type}
                      </span>
                    </td>
                    <td className="px-5 py-5 sm:px-8">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${
                          member.status === 'ACTIVE'
                            ? 'bg-success-50 text-success-700'
                            : 'bg-warm-100 text-warm-500'
                        }`}
                      >
                        {String(member.status).replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-5 text-right sm:px-8">
                      <Link
                        href={`/dashboard/hr/staff/${member.id}?type=${member.type}`}
                        aria-label={`Open ${member.firstName} ${member.lastName}`}
                        className="inline-flex rounded-xl border border-transparent p-2 text-warm-400 transition-all hover:border-warm-100 hover:bg-card hover:text-forest-700 hover:shadow-md"
                      >
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
