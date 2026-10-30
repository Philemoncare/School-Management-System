'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  Users,
  Search,
  Filter,
  GraduationCap,
  Loader2,
  ExternalLink,
  AlertCircle,
  Mail,
  Smartphone,
  Send,
} from 'lucide-react';

export default function MyStudentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [classFilter, setClassFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Compose message modal state
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeContact, setComposeContact] = useState<{ name: string; email?: string | null; phone?: string | null } | null>(null);
  const [composeChannel, setComposeChannel] = useState<'sms' | 'email'>('sms');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeSending, setComposeSending] = useState(false);

  async function loadStudents() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/teacher-portal/students');
      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setEnrollments([]);
      setError(err?.message || 'Could not load your students.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const classOptions = useMemo(() => {
    const names = new Set<string>();
    for (const enrollment of enrollments) {
      if (enrollment.class?.name) names.add(enrollment.class.name);
    }
    return Array.from(names).sort();
  }, [enrollments]);

  const statusOptions = useMemo(() => {
    const statuses = new Set<string>();
    for (const enrollment of enrollments) {
      if (enrollment.status) statuses.add(String(enrollment.status));
    }
    return Array.from(statuses).sort();
  }, [enrollments]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return enrollments.filter((enrollment) => {
      if (classFilter && enrollment.class?.name !== classFilter) return false;
      if (statusFilter && String(enrollment.status) !== statusFilter) return false;
      if (!needle) return true;
      const haystack = [
        enrollment.student?.firstName,
        enrollment.student?.lastName,
        enrollment.student?.studentNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [enrollments, search, classFilter, statusFilter]);

  const activeFilterCount = [classFilter, statusFilter].filter(Boolean).length;

  function openCompose(contact: { name: string; email?: string | null; phone?: string | null }, channel: 'sms' | 'email') {
    setComposeContact(contact);
    setComposeChannel(channel);
    setComposeMessage('');
    setComposeSubject('');
    setComposeOpen(true);
  }

  async function sendComposedMessage() {
    if (!composeContact) return;
    setComposeSending(true);
    try {
      if (composeChannel === 'sms') {
        if (!composeContact.phone) {
          setError('This contact has no phone number on file.');
          return;
        }
        await apiFetch('/communications/send-direct', {
          method: 'POST',
          body: JSON.stringify({
            to: composeContact.phone,
            channel: 'SMS',
            content: composeMessage.trim(),
            recipientName: composeContact.name,
          }),
        });
        showFeedback('SUCCESS', `SMS queued to ${composeContact.name}.`);
      } else {
        if (!composeContact.email) {
          setError('This contact has no email address on file.');
          return;
        }
        await apiFetch('/communications/send-direct', {
          method: 'POST',
          body: JSON.stringify({
            to: composeContact.email,
            channel: 'EMAIL',
            subject: composeSubject.trim() || 'Message from your teacher',
            content: composeMessage.trim(),
            recipientName: composeContact.name,
          }),
        });
        showFeedback('SUCCESS', `Email queued to ${composeContact.name}.`);
      }
      setComposeOpen(false);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.isServiceUnconfigured()) {
          setError(`${composeChannel === 'sms' ? 'SMS' : 'Email'} service is not configured. Please ask your administrator to set it up.`);
        } else {
          setError(err.message || `Could not send ${composeChannel}.`);
        }
      } else {
        setError(`Could not send ${composeChannel}. Please try again.`);
      }
    } finally {
      setComposeSending(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
          <GraduationCap className="text-forest-700" /> My students
        </h1>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
          {enrollments.length} enrolled student{enrollments.length === 1 ? '' : 's'} in your assigned classes
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 border-b border-danger-100 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </span>
          <Button variant="outline" size="sm" onClick={loadStudents}>
            Try again
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <div className="space-y-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center rounded-2xl border border-warm-200 bg-card px-5 py-3 shadow-sm">
              <Search size={18} className="mr-3 shrink-0 text-warm-400" />
              <input
                type="search"
                aria-label="Search students"
                placeholder="Search students by name or ID…"
                className="w-full border-none bg-transparent text-sm font-bold text-charcoal-900 placeholder:text-warm-400 focus:ring-0"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="teacher-student-filters"
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-[11px] font-semibold uppercase tracking-wide shadow-sm transition-all ${filtersOpen || activeFilterCount ? 'border-forest-700 bg-forest-700 text-white' : 'border-warm-200 bg-card text-warm-600 hover:bg-ivory-50'}`}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 text-[10px]">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {filtersOpen && (
            <div
              id="teacher-student-filters"
              className="grid grid-cols-1 gap-3 rounded-2xl border border-warm-200 bg-card p-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              <Select
                label="Class"
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                options={[
                  { value: '', label: 'All classes' },
                  ...classOptions.map((name) => ({ value: name, label: name })),
                ]}
              />
              <Select
                label="Enrollment status"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                options={[
                  { value: '', label: 'All statuses' },
                  ...statusOptions.map((status) => ({
                    value: status,
                    label: status.replace(/_/g, ' '),
                  })),
                ]}
              />
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeFilterCount === 0}
                  onClick={() => {
                    setClassFilter('');
                    setStatusFilter('');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-medium text-warm-500">
            <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading students…
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 sm:p-10">
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title={search || activeFilterCount ? 'No students match your filters' : 'No students assigned yet'}
              description={
                search || activeFilterCount
                  ? 'Try a different name, class or status.'
                  : 'Students appear here once they are enrolled in a class you teach.'
              }
              actionButton={
                search || activeFilterCount ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setClassFilter('');
                      setStatusFilter('');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50/50">
                <tr>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    Student
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    Placement
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    Status
                  </th>
                  <th className="px-5 py-4 text-left text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    Guardian contact
                  </th>
                  <th className="px-5 py-4 text-right text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {filtered.map((enrollment) => {
                  const student = enrollment.student;
                  const guardians = student?.guardians ?? [];
                  const primaryGuardian = guardians.find((g: any) => g.isPrimary) ?? guardians[0] ?? null;
                  return (
                    <tr key={enrollment.id} className="group transition-colors hover:bg-sage-50/30">
                      <td className="px-5 py-5">
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-warm-100 bg-warm-100 font-semibold text-warm-500 transition-colors group-hover:bg-card">
                            {student?.firstName?.[0]}
                            {student?.lastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-semibold leading-tight text-charcoal-900">
                              {student?.firstName} {student?.lastName}
                            </p>
                            <p className="mt-0.5 text-[11px] font-bold uppercase text-warm-400">
                              {student?.studentNumber}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-5">
                        <p className="text-sm font-semibold text-charcoal-800">{enrollment.class?.name ?? '—'}</p>
                        <p className="text-[11px] font-bold uppercase tracking-tight text-warm-400">
                          {enrollment.section?.name ? `Section ${enrollment.section.name}` : 'No section'}
                        </p>
                      </td>
                      <td className="px-5 py-5">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${enrollment.status === 'ACTIVE' ? 'bg-success-100 text-success-700' : 'bg-warm-100 text-warm-600'}`}
                        >
                          {String(enrollment.status).replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-5">
                        {primaryGuardian ? (
                          <div className="space-y-1">
                            <p className="text-sm font-semibold text-charcoal-900">
                              {primaryGuardian.firstName} {primaryGuardian.lastName}
                            </p>
                            <p className="mt-0.5 text-[11px] font-bold uppercase text-warm-400">
                              {primaryGuardian.relation ?? 'Guardian'}
                            </p>
                            {primaryGuardian.phone && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <Smartphone size={12} />
                                <span className="text-xs font-medium text-warm-600 truncate">{primaryGuardian.phone}</span>
                                <button
                                  type="button"
                                  onClick={() => openCompose({ name: `${primaryGuardian.firstName} ${primaryGuardian.lastName}`, phone: primaryGuardian.phone }, 'sms')}
                                  className="ml-1 p-1 text-warm-400 hover:text-forest-700 hover:bg-sage-50 rounded transition-colors"
                                  aria-label={`Send SMS to ${primaryGuardian.firstName} ${primaryGuardian.lastName}`}
                                  title="Send SMS"
                                >
                                  <Send size={12} />
                                </button>
                              </div>
                            )}
                            {primaryGuardian.email && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <Mail size={12} />
                                <span className="text-xs font-medium text-warm-600 truncate">{primaryGuardian.email}</span>
                                <button
                                  type="button"
                                  onClick={() => openCompose({ name: `${primaryGuardian.firstName} ${primaryGuardian.lastName}`, email: primaryGuardian.email }, 'email')}
                                  className="ml-1 p-1 text-warm-400 hover:text-forest-700 hover:bg-sage-50 rounded transition-colors"
                                  aria-label={`Send Email to ${primaryGuardian.firstName} ${primaryGuardian.lastName}`}
                                  title="Send Email"
                                >
                                  <Send size={12} />
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-xs text-warm-400">No guardian on file</p>
                        )}
                      </td>
                      <td className="px-5 py-5 text-right">
                        <Link
                          href={`/dashboard/students/${enrollment.studentId}`}
                          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:underline"
                        >
                          View profile <ExternalLink size={14} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {composeOpen && composeContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-charcoal-900/40 backdrop-blur-sm" onClick={() => setComposeOpen(false)} />
          <div className="relative bg-card rounded-2xl border border-warm-200 p-6 shadow-2xl w-full max-w-md mx-4 sm:mx-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-charcoal-900">
                {composeChannel === 'sms' ? 'Send SMS' : 'Send Email'}
              </h3>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                className="rounded-md p-1.5 text-warm-400 hover:text-charcoal-900 hover:bg-warm-100 transition-colors"
                aria-label="Close"
              >
                <span className="text-warm-400">✕</span>
              </button>
            </div>

            <p className="mb-4 text-sm text-charcoal-800">
              To: <strong className="text-forest-700">{composeContact.name}</strong>
              {composeChannel === 'sms' && composeContact.phone && (
                <span className="block text-xs mt-1 text-warm-500">+ {composeContact.phone}</span>
              )}
              {composeChannel === 'email' && composeContact.email && (
                <span className="block text-xs mt-1 text-warm-500">✉ {composeContact.email}</span>
              )}
            </p>

            <form onSubmit={(e) => { e.preventDefault(); sendComposedMessage(); }} className="space-y-3">
              {composeChannel === 'email' && (
                <div className="space-y-1.5">
                  <label className="ml-0.5 text-[11px] font-semibold text-warm-600">Subject</label>
                  <input
                    type="text"
                    placeholder="Enter subject"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                    className="flex h-10 w-full rounded-lg border border-warm-300 bg-card px-3 py-2 text-sm text-charcoal-900 outline-none transition-colors focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/15"
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <label className="ml-0.5 text-[11px] font-semibold text-warm-600">{composeChannel === 'sms' ? 'Message *' : 'Message body *'}</label>
                <textarea
                  rows={4}
                  placeholder={composeChannel === 'sms' ? 'Type your SMS message…' : 'Type your email…'}
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  className="flex h-32 w-full resize-none rounded-lg border border-warm-300 bg-card px-3 py-2 text-sm text-charcoal-900 outline-none transition-colors focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/15"
                  required
                />
              </div>
              <p className="text-xs text-warm-500">
                Message will be sent through the school&rsquo;s configured {composeChannel === 'sms' ? 'SMS' : 'email'} provider.
              </p>
            </form>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setComposeOpen(false)} disabled={composeSending}>
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={composeSending}
                disabled={composeSending || !composeMessage.trim()}
                leftIcon={<Send size={16} />}
              >
                {composeSending ? 'Sending&hellip;' : composeChannel === 'sms' ? 'Send SMS' : 'Send Email'}
              </Button>
            </div>
          </div>
        </div>
      )}
      </div>
  )
}