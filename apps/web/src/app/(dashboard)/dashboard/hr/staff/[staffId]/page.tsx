'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  User,
  Briefcase,
  FileText,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  ChevronLeft,
  Loader2,
  AlertCircle,
  CheckCircle,
  GraduationCap,
  CalendarClock,
  Plus,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

type TabId = 'employment' | 'qualifications' | 'documents' | 'attendance' | 'leave';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'employment', label: 'Employment' },
  { id: 'qualifications', label: 'Qualifications' },
  { id: 'documents', label: 'Documents' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'leave', label: 'Leave History' },
];

function formatDate(value: unknown) {
  if (!value) return '—';
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

function formatTime(value: unknown) {
  if (!value) return '—';
  const date = new Date(value as string);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function StaffProfilePage() {
  const { staffId } = useParams<{ staffId: string }>();
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['HR_OFFICER', 'SCHOOL_ADMIN'].includes(role));

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('employment');
  const [uploadOpen, setUploadOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const profile = await apiFetch(`/hr/staff/${staffId}/profile`);
      setData(profile);
    } catch (err: any) {
      setData(null);
      setError(err?.message || 'Could not load this staff record.');
    } finally {
      setLoading(false);
    }
  }, [staffId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-16 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading staff record…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <Link href="/dashboard/hr/staff" className="inline-flex items-center gap-2 text-sm font-semibold text-forest-700">
          <ChevronLeft size={16} /> Back to staff directory
        </Link>
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> {error || 'Staff record not found.'}
          </span>
          <Button variant="outline" size="sm" onClick={loadProfile}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const profile = data.profile;
  const summary = data.summary ?? {};
  const displayName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Link
          href="/dashboard/hr/staff"
          aria-label="Back to staff directory"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-warm-200 bg-card text-warm-400 shadow-sm transition-all hover:text-forest-700"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            <span className="truncate">{displayName || 'Staff record'}</span>
            <span className="rounded-full bg-sage-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-forest-700">
              {data.entityType === 'TEACHER' ? 'Teacher' : 'Staff'}
            </span>
            <span
              className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                profile?.status === 'ACTIVE' ? 'bg-success-50 text-success-700' : 'bg-warm-100 text-warm-600'
              }`}
            >
              {String(profile?.status ?? 'UNKNOWN').replace(/_/g, ' ')}
            </span>
          </h1>
          <p className="mt-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-warm-500">
            <Briefcase size={14} className="text-warm-400" />
            {profile?.position?.name || profile?.designation || profile?.specialization || 'Unassigned position'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex h-20 w-20 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-ivory-50 text-warm-200 shadow-xs">
              <User size={56} />
            </div>
            <div className="space-y-5">
              <ContactItem icon={<Mail size={16} />} label="Email address" value={profile?.user?.email || 'Not on file'} />
              <ContactItem icon={<Phone size={16} />} label="Phone number" value={profile?.user?.phone || 'Not on file'} />
              <ContactItem icon={<Building size={16} />} label="Department" value={profile?.department?.name || 'Unassigned'} />
              <ContactItem icon={<ShieldCheck size={16} />} label="Staff number" value={profile?.employeeId || 'Not assigned'} />
            </div>
          </section>

          <section className="rounded-xl bg-charcoal-900 p-5 text-white shadow-sm sm:p-6">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide">Workforce pulse</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-warm-400">Attendance</p>
                <p className="text-lg font-semibold">
                  {summary.attendanceRate == null ? '—' : `${summary.attendanceRate}%`}
                </p>
                <p className="text-[10px] text-warm-400">
                  {summary.attendanceRecords ?? 0} recent record{summary.attendanceRecords === 1 ? '' : 's'}
                </p>
              </div>
              <div className="rounded-2xl border border-white/5 bg-white/5 p-3">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-warm-400">Leave used</p>
                <p className="text-lg font-semibold">
                  {summary.usedDays ?? 0}/{summary.entitledDays ?? 0}
                </p>
                <p className="text-[10px] text-warm-400">
                  {summary.pendingLeaveRequests ?? 0} pending request
                  {(summary.pendingLeaveRequests ?? 0) === 1 ? '' : 's'}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-xl border border-warm-200 bg-card p-4 shadow-sm sm:p-6">
            <div
              role="tablist"
              aria-label="Staff record sections"
              className="mb-6 flex gap-6 overflow-x-auto border-b border-warm-100 pb-3"
            >
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap border-b-2 pb-2 text-[11px] font-semibold uppercase tracking-wide transition-all ${
                    activeTab === tab.id
                      ? 'border-forest-700 text-forest-700'
                      : 'border-transparent text-warm-400 hover:text-warm-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'employment' && (
              <div className="grid grid-cols-1 gap-6 rounded-xl border border-warm-100 bg-ivory-50 p-5 sm:grid-cols-2 sm:p-6">
                <ProfileField label="Employee ID" value={profile?.employeeId || 'Not assigned'} />
                <ProfileField label="Employment status" value={String(profile?.status ?? '—').replace(/_/g, ' ')} />
                <ProfileField label="Department" value={profile?.department?.name || 'Unassigned'} />
                <ProfileField label="Position" value={profile?.position?.name || 'Unassigned'} />
                <ProfileField label="Designation" value={profile?.designation || profile?.specialization || '—'} />
                <ProfileField label="Record created" value={formatDate(profile?.createdAt)} />
                <ProfileField label="Account email" value={profile?.user?.email || 'No login account'} />
                <ProfileField label="Account status" value={profile?.user ? (profile.user.isActive ? 'Active' : 'Disabled') : 'No login account'} />
              </div>
            )}

            {activeTab === 'qualifications' && (
              <div className="space-y-3">
                {data.qualifications?.length ? (
                  data.qualifications.map((qualification: any) => (
                    <div
                      key={qualification.id}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-warm-100 bg-card p-4"
                    >
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="rounded-xl bg-ivory-50 p-2.5 text-warm-400">
                          <GraduationCap size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-charcoal-900">
                            {qualification.qualification}
                          </p>
                          <p className="text-[11px] font-bold uppercase tracking-tight text-warm-400">
                            {qualification.institution} • {qualification.fieldOfStudy}
                          </p>
                          <p className="mt-1 text-[11px] text-warm-500">
                            {formatDate(qualification.startDate)} – {formatDate(qualification.completionDate)}
                            {qualification.grade ? ` • Grade ${qualification.grade}` : ''}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase ${
                          qualification.verificationStatus === 'VERIFIED'
                            ? 'bg-success-50 text-success-700'
                            : 'bg-warning-50 text-warning-700'
                        }`}
                      >
                        {qualification.verificationStatus}
                      </span>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={<GraduationCap className="h-7 w-7" />}
                    title="No qualifications recorded"
                    description="Academic and professional qualifications added to this staff record will appear here."
                  />
                )}
              </div>
            )}

            {activeTab === 'documents' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                    {data.documents?.length ?? 0} document{data.documents?.length === 1 ? '' : 's'}
                  </p>
                  {canManage && (
                    <Button variant="outline" size="sm" onClick={() => setUploadOpen(true)} leftIcon={<Plus size={14} />}>
                      Add document
                    </Button>
                  )}
                </div>
                {data.documents?.length ? (
                  data.documents.map((document: any) => (
                    <div
                      key={document.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warm-100 bg-card p-4"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="rounded-xl bg-ivory-50 p-2.5 text-warm-400">
                          <FileText size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-charcoal-900">{document.title}</p>
                          <p className="text-[11px] font-bold uppercase tracking-tight text-warm-400">
                            {document.documentType} • {formatDate(document.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase ${
                            document.verificationStatus === 'VERIFIED'
                              ? 'bg-success-50 text-success-700'
                              : 'bg-warning-50 text-warning-700'
                          }`}
                        >
                          {document.verificationStatus}
                        </span>
                        <a
                          href={document.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-warm-200 px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-forest-700 hover:bg-ivory-50"
                        >
                          Open <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    icon={<FileText className="h-7 w-7" />}
                    title="No documents uploaded"
                    description="Add links to contracts, certificates and other staff documents."
                  />
                )}
              </div>
            )}

            {activeTab === 'attendance' && (
              <div>
                {data.attendance?.length ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-warm-100 text-[10px] font-semibold uppercase tracking-wide text-warm-400">
                          <th className="pb-3">Date</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Check-in</th>
                          <th className="pb-3">Check-out</th>
                          <th className="pb-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                        {data.attendance.map((record: any) => (
                          <tr key={record.id}>
                            <td className="py-3 font-semibold text-charcoal-900">{formatDate(record.date)}</td>
                            <td className="py-3">
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                  ['PRESENT', 'REMOTE', 'LATE', 'HALF_DAY'].includes(String(record.status))
                                    ? 'bg-success-50 text-success-700'
                                    : 'bg-danger-50 text-danger-700'
                                }`}
                              >
                                {String(record.status).replace(/_/g, ' ')}
                              </span>
                            </td>
                            <td className="py-3">{formatTime(record.checkIn)}</td>
                            <td className="py-3">{formatTime(record.checkOut)}</td>
                            <td className="py-3 text-warm-500">{record.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState
                    icon={<CalendarClock className="h-7 w-7" />}
                    title="No attendance records"
                    description="Attendance recorded by HR for this staff member will appear here."
                  />
                )}
              </div>
            )}

            {activeTab === 'leave' && (
              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                    Leave balances
                  </h3>
                  {data.leaveBalances?.length ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {data.leaveBalances.map((balance: any) => (
                        <div key={balance.id} className="rounded-2xl border border-warm-100 bg-ivory-50/60 p-4">
                          <p className="text-xs font-semibold text-charcoal-900">
                            {balance.leaveType?.name ?? 'Leave'}
                          </p>
                          <p className="mt-1 text-[11px] font-bold uppercase tracking-tight text-warm-400">
                            Period {balance.period}
                          </p>
                          <p className="mt-2 text-sm font-semibold text-charcoal-900">
                            {Number(balance.usedDays ?? 0)} used of {Number(balance.entitledDays ?? 0)} days
                          </p>
                          <p className="text-[11px] text-warm-500">
                            {Math.max(
                              Number(balance.entitledDays ?? 0) -
                                Number(balance.usedDays ?? 0) -
                                Number(balance.pendingDays ?? 0),
                              0,
                            )}{' '}
                            remaining
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-warm-200 p-4 text-center text-xs font-semibold uppercase tracking-wide text-warm-400">
                      No leave balances set up
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                    Leave requests
                  </h3>
                  {data.leaveRequests?.length ? (
                    <div className="space-y-3">
                      {data.leaveRequests.map((request: any) => (
                        <div
                          key={request.id}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warm-100 bg-card p-4"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-charcoal-900">
                              {request.leaveType?.name ?? 'Leave'}
                            </p>
                            <p className="text-[11px] font-bold uppercase tracking-tight text-warm-400">
                              {formatDate(request.startDate)} – {formatDate(request.endDate)} •{' '}
                              {Number(request.totalDays)} day{Number(request.totalDays) === 1 ? '' : 's'}
                            </p>
                            <p className="mt-1 line-clamp-2 text-[11px] text-warm-500">{request.reason}</p>
                          </div>
                          <span
                            className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase ${
                              request.status === 'APPROVED'
                                ? 'bg-success-50 text-success-700'
                                : request.status === 'REJECTED'
                                  ? 'bg-danger-50 text-danger-700'
                                  : 'bg-warning-50 text-warning-700'
                            }`}
                          >
                            {String(request.status).replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-lg border border-dashed border-warm-200 p-4 text-center text-xs font-semibold uppercase tracking-wide text-warm-400">
                      No leave requests
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {uploadOpen && (
        <UploadDocumentModal
          staffId={data.entityType === 'STAFF' ? profile.id : undefined}
          teacherId={data.entityType === 'TEACHER' ? profile.id : undefined}
          onClose={() => setUploadOpen(false)}
          onSaved={() => {
            setUploadOpen(false);
            showFeedback('SUCCESS', 'Document added to the staff record.');
            loadProfile();
          }}
        />
      )}
    </div>
  );
}

function ContactItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-xl bg-ivory-50 p-2.5 text-warm-400">{icon}</div>
      <div className="min-w-0">
        <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
        <p className="truncate text-xs font-bold text-warm-700">{value}</p>
      </div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      <p className="text-sm font-bold text-warm-700">{value}</p>
    </div>
  );
}

const DOCUMENT_TYPES = [
  'Contract',
  'Certificate',
  'Identification',
  'Police clearance',
  'Medical report',
  'Reference letter',
  'Other',
];

function UploadDocumentModal({
  staffId,
  teacherId,
  onClose,
  onSaved,
}: {
  staffId?: string;
  teacherId?: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    documentType: 'Contract',
    fileUrl: '',
    expiryDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.title.trim() || !form.fileUrl.trim()) {
      setError('Enter a document title and a link to the stored file.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/hr/documents', {
        method: 'POST',
        body: JSON.stringify({
          staffId,
          teacherId,
          title: form.title.trim(),
          documentType: form.documentType,
          fileUrl: form.fileUrl.trim(),
          storageKey: form.fileUrl.trim(),
          expiryDate: form.expiryDate
            ? new Date(`${form.expiryDate}T00:00:00`).toISOString()
            : undefined,
        }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the document.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Add staff document"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="staff-document-form" isLoading={saving}>
            Add document
          </Button>
        </>
      }
    >
      <form id="staff-document-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <p className="rounded-lg bg-ivory-50 p-3 text-[11px] font-medium text-warm-500">
          Documents are stored in your school&apos;s file store. Paste the link to the uploaded file.
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Title *"
            required
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
          />
          <Select
            label="Document type *"
            value={form.documentType}
            options={DOCUMENT_TYPES.map((type) => ({ value: type, label: type }))}
            onChange={(event) => setForm({ ...form, documentType: event.target.value })}
          />
        </div>
        <Input
          label="File link *"
          type="url"
          required
          placeholder="https://…"
          value={form.fileUrl}
          onChange={(event) => setForm({ ...form, fileUrl: event.target.value })}
        />
        <Input
          label="Expiry date"
          type="date"
          value={form.expiryDate}
          onChange={(event) => setForm({ ...form, expiryDate: event.target.value })}
        />
      </form>
    </Modal>
  );
}
