'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Download,
  Edit3,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  PencilLine,
  Phone,
  Plus,
  RefreshCw,
  ShieldCheck,
  Send,
  Smartphone,
  Trash2,
  User,
  Users,
} from 'lucide-react';

type TabKey = 'overview' | 'academics' | 'attendance' | 'finance';

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: 'bg-success-100 text-success-800',
  WITHDRAWN: 'bg-danger-100 text-danger-700',
  GRADUATED: 'bg-sage-100 text-forest-800',
  TRANSFERRED: 'bg-warning-100 text-warning-800',
  SUSPENDED: 'bg-warning-100 text-warning-800',
  INACTIVE: 'bg-warm-100 text-warm-700',
};

const LIFECYCLE_STATUSES = ['ACTIVE', 'SUSPENDED', 'WITHDRAWN', 'GRADUATED', 'TRANSFERRED'];

function formatDate(value?: string | null) {
  if (!value) return 'â€”';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'â€”';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function money(value: unknown, currency: string) {
  const amount = Number(value ?? 0);
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function initials(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ''}${lastName?.[0] ?? ''}`.toUpperCase() || 'ST';
}

function csvCell(value: unknown) {
  const text = value == null ? '' : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

interface Option {
  id: string;
  name: string;
}

export default function StudentProfilePage() {
  const params = useParams();
  const rawId = params?.id;
  const studentId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(role));
  const canLinkGuardian = roles.some((role) =>
    ['SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST'].includes(role),
  );

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<TabKey>('overview');

  const [editOpen, setEditOpen] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [guardianOpen, setGuardianOpen] = useState(false);
  const [statementOpen, setStatementOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeContact, setComposeContact] = useState<{ name: string; email?: string | null; phone?: string | null } | null>(null);
  const [composeChannel, setComposeChannel] = useState<'sms' | 'email'>('sms');
  const [composeMessage, setComposeMessage] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeSending, setComposeSending] = useState(false);
  const [existingGuardians, setExistingGuardians] = useState<{ id: string; firstName: string; lastName: string; email?: string | null; phone?: string | null }[]>([]);
  const [guardianEditOpen, setGuardianEditOpen] = useState(false);
  const [editGuardianId, setEditGuardianId] = useState('');
  const [editRelation, setEditRelation] = useState('');
  const [editIsPrimary, setEditIsPrimary] = useState(false);

  const load = useCallback(async () => {
    if (!studentId) return;
    setLoading(true);
    setError('');
    try {
      const result = await apiFetch(`/students/${studentId}/overview`);
      setData(result);
    } catch (err: any) {
      setData(null);
      setError(err?.message || 'Could not load this student.');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!studentId) return;
    apiFetch(`/guardians/student/${studentId}`)
      .then((data) => {
        const links = Array.isArray(data) ? data : [];
        setExistingGuardians(links.map((l: any) => ({
          id: l.guardianId,
          firstName: l.guardian?.firstName ?? '',
          lastName: l.guardian?.lastName ?? '',
          email: l.guardian?.email ?? null,
          phone: l.guardian?.phone ?? null,
        })));
      })
      .catch(() => setExistingGuardians([]));
  }, [studentId]);

  async function removeGuardian(guardianId: string) {
    try {
      await apiFetch(`/guardians/unlink/${studentId}/${guardianId}`, {
        method: 'DELETE',
      });
      showFeedback('SUCCESS', 'Guardian unlinked from student.');
      load();
    } catch (err: any) {
      setError(err?.message || 'Could not unlink the guardian.');
      showFeedback('ERROR', err?.message || 'Could not unlink the guardian.');
    }
  }

  function openGuardianEdit(guardianId: string, relation: string, isPrimary: boolean) {
    setEditGuardianId(guardianId);
    setEditRelation(relation);
    setEditIsPrimary(isPrimary);
    setGuardianEditOpen(true);
  }

  async function updateGuardianLink() {
    try {
      await apiFetch(`/guardians/link/${studentId}/${editGuardianId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          relation: editRelation.trim(),
          isPrimary: editIsPrimary,
        }),
      });
      showFeedback('SUCCESS', 'Guardian relationship updated.');
      setGuardianEditOpen(false);
      load();
    } catch (err: any) {
      setError(err?.message || 'Could not update the guardian relationship.');
      showFeedback('ERROR', err?.message || 'Could not update the guardian relationship.');
    }
  }

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
            studentId,
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
            subject: composeSubject.trim() || 'Message from SchooMA',
            content: composeMessage.trim(),
            recipientName: composeContact.name,
            studentId,
          }),
        });
        showFeedback('SUCCESS', `Email queued to ${composeContact.name}.`);
      }
      setComposeOpen(false);
    } catch (err: any) {
      setError(err?.message || 'Could not send message.');
      showFeedback('ERROR', err?.message || 'Message could not be sent.');
    } finally {
      setComposeSending(false);
    }
  }

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading student profileâ€¦
      </div>
    );
  }

  if (error || !data?.student) {
    return (
      <div className="mx-auto max-w-xl space-y-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-50 text-danger-600">
          <User size={24} />
        </div>
        <h1 className="text-xl font-bold text-charcoal-900">Student not available</h1>
        <p className="text-sm text-warm-500">{error || 'This student could not be found in your school.'}</p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Button variant="outline" onClick={load} leftIcon={<RefreshCw size={16} />}>
            Try again
          </Button>
          <Link href="/dashboard/students">
            <Button variant="primary">Back to students</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { student, currentEnrollment, finance, attendance, results } = data;
  const currency = finance?.currency || 'GHS';
  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(' ');
  const statusStyle = STATUS_STYLES[student.status] ?? 'bg-warm-100 text-warm-700';
  const classLabel = currentEnrollment?.class
    ? `${currentEnrollment.class.name}${currentEnrollment.section ? ` Â· ${currentEnrollment.section.name}` : ''}`
    : 'Not enrolled';

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'overview', label: 'Overview', icon: <User size={15} /> },
    { key: 'academics', label: 'Academics', icon: <BookOpen size={15} /> },
    { key: 'attendance', label: 'Attendance', icon: <ClipboardCheck size={15} /> },
    { key: 'finance', label: 'Finance', icon: <CreditCard size={15} /> },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-2 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
        >
          <ArrowLeft size={16} /> Back to students
        </Link>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />}
        >
          Refresh
        </Button>
      </div>

      <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-sage-100 text-xl font-bold text-forest-800">
              {initials(student.firstName, student.lastName)}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-charcoal-900 sm:text-2xl">
                  {fullName}
                </h1>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${statusStyle}`}>
                  {student.status}
                </span>
              </div>
              <p className="mt-1 font-mono text-xs text-warm-600">
                {student.studentNumber}
                {student.admissionNumber ? ` Â· ${student.admissionNumber}` : ''}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-warm-500">
                <span className="inline-flex items-center gap-1.5">
                  <GraduationCap size={14} /> {classLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={14} /> Admitted {formatDate(student.admissionDate)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <User size={14} /> {student.gender || 'Gender not recorded'}
                </span>
              </div>
            </div>
          </div>

          {canManage && (
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} leftIcon={<Edit3 size={14} />}>
                Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStatusOpen(true)} leftIcon={<ShieldCheck size={14} />}>
                Change Status
              </Button>
              <Button variant="outline" size="sm" onClick={() => setStatementOpen(true)} leftIcon={<FileText size={14} />}>
                Statement
              </Button>
            </div>
          )}
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Outstanding" value={money(finance.invoiceBalance, currency)} />
          <Stat
            label="Attendance"
            value={attendance.rate == null ? 'No records' : `${attendance.rate}%`}
          />
          <Stat
            label="Average result"
            value={
              results.overall?.[0]?.averagePercentage != null
                ? `${Number(results.overall[0].averagePercentage).toFixed(1)}%`
                : 'No result'
            }
          />
          <Stat
            label="Subjects"
            value={results.subjects?.length ? String(results.subjects.length) : '0'}
          />
        </div>
      </section>

      <div role="tablist" aria-label="Student record sections" className="flex gap-1 overflow-x-auto rounded-xl border border-warm-200 bg-card p-1">
        {tabs.map((item) => (
          <button
            key={item.key}
            role="tab"
            type="button"
            id={`tab-${item.key}`}
            aria-selected={tab === item.key}
            aria-controls={`panel-${item.key}`}
            onClick={() => setTab(item.key)}
            className={`inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
              tab === item.key
                ? 'bg-forest-800 text-ivory-50'
                : 'text-warm-600 hover:bg-warm-50 hover:text-charcoal-900'
            }`}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div role="tabpanel" id="panel-overview" aria-labelledby="tab-overview" className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <section className="space-y-4 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-charcoal-900">Placement history</h2>
              {canManage && (
                <Button variant="outline" size="xs" onClick={() => setMoveOpen(true)} disabled={!currentEnrollment}>
                  Move class
                </Button>
              )}
            </div>
            {student.enrollments?.length ? (
              <ul className="divide-y divide-warm-100">
                {student.enrollments.map((enrollment: any) => (
                  <li key={enrollment.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="text-sm font-semibold text-charcoal-900">
                        {enrollment.class?.name ?? 'Class'}
                        {enrollment.section ? ` Â· ${enrollment.section.name}` : ''}
                      </p>
                      <p className="text-xs text-warm-500">
                        {enrollment.academicYear?.name ?? 'â€”'}
                        {enrollment.term?.name ? ` Â· ${enrollment.term.name}` : ''}
                      </p>
                    </div>
                    <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-[11px] font-bold uppercase text-warm-700">
                      {enrollment.status}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-warm-500">
                This student has no enrollment yet. Use â€œMove classâ€ once a class exists, or enroll
                them from Enrollments.
              </p>
            )}
          </section>

          <section className="space-y-4 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-charcoal-900">Guardians</h2>
              {canLinkGuardian && (
                <Button variant="outline" size="xs" onClick={() => setGuardianOpen(true)} leftIcon={<Plus size={12} />}>
                  Link
                </Button>
              )}
            </div>
            {student.guardians?.length ? (
              <ul className="space-y-3">
                {student.guardians.map((link: any) => (
                  <li key={link.guardianId} className="rounded-xl bg-ivory-50 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-charcoal-900">
                          {link.guardian.firstName} {link.guardian.lastName}
                        </p>
                        {link.isPrimary && (
                          <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-bold uppercase text-forest-800">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        {canLinkGuardian && (
                          <button
                            type="button"
                            onClick={() => openGuardianEdit(link.guardianId, link.relation, link.isPrimary)}
                            className="p-1 text-warm-400 hover:text-forest-700 hover:bg-sage-50 rounded transition-colors"
                            aria-label={`Edit relationship for ${link.guardian.firstName} ${link.guardian.lastName}`}
                            title="Edit relationship"
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                        {canLinkGuardian && (
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Remove ${link.guardian.firstName} ${link.guardian.lastName} as a guardian for this student?`)) {
                                removeGuardian(link.guardianId);
                              }
                            }}
                            className="p-1 text-warm-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors"
                            aria-label={`Remove ${link.guardian.firstName} ${link.guardian.lastName} as guardian`}
                            title="Remove guardian"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="mt-1 text-xs text-warm-500 capitalize">{link.relation}</p>
                    {link.guardian.phone && (
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-warm-600">
                        <Phone size={12} /> {link.guardian.phone}
                        {canLinkGuardian && (
                          <button
                            type="button"
                            onClick={() => openCompose({ name: `${link.guardian.firstName} ${link.guardian.lastName}`, phone: link.guardian.phone }, 'sms')}
                            className="ml-2 p-1 text-warm-400 hover:text-forest-700 hover:bg-sage-50 rounded transition-colors"
                            aria-label={`Send SMS to ${link.guardian.firstName} ${link.guardian.lastName}`}
                            title="Send SMS"
                          >
                            <Smartphone size={12} />
                          </button>
                        )}
                      </div>
                    )}
                    {link.guardian.email && (
                      <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-warm-600">
                        <Mail size={12} /> {link.guardian.email}
                        {canLinkGuardian && (
                          <button
                            type="button"
                            onClick={() => openCompose({ name: `${link.guardian.firstName} ${link.guardian.lastName}`, email: link.guardian.email }, 'email')}
                            className="ml-2 p-1 text-warm-400 hover:text-forest-700 hover:bg-sage-50 rounded transition-colors"
                            aria-label={`Send Email to ${link.guardian.firstName} ${link.guardian.lastName}`}
                            title="Send Email"
                          >
                            <Send size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-warm-500">No guardian linked yet.</p>
            )}
          </section>

          <section className="space-y-3 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs lg:col-span-3">
            <h2 className="text-sm font-bold text-charcoal-900">Personal record</h2>
            <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <Detail label="Date of birth" value={formatDate(student.dateOfBirth)} />
              <Detail label="Admission date" value={formatDate(student.admissionDate)} />
              <Detail label="Student number" value={student.studentNumber} mono />
              <Detail label="Admission number" value={student.admissionNumber || 'â€”'} mono />
              <Detail label="Linked account" value={student.user?.email || 'No portal account'} />
              <Detail label="Account status" value={student.user ? (student.user.isActive ? 'Active' : 'Suspended') : 'â€”'} />
              <Detail label="Gender" value={student.gender || 'â€”'} />
              <Detail label="Created" value={formatDate(student.createdAt)} />
            </dl>
          </section>
        </div>
      )}

      {tab === 'academics' && (
        <div role="tabpanel" id="panel-academics" aria-labelledby="tab-academics" className="space-y-4">
          <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs">
            <h2 className="text-sm font-bold text-charcoal-900">Current subject results</h2>
            {results.subjects?.length ? (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full divide-y divide-warm-200 text-sm">
                  <thead>
                    <tr>
                      {['Subject', 'Score', 'Grade', 'Remark', 'Status'].map((heading) => (
                        <th key={heading} scope="col" className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-warm-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {results.subjects.map((result: any) => (
                      <tr key={result.id}>
                        <td className="px-3 py-2.5 font-semibold text-charcoal-900">{result.subject?.name ?? 'â€”'}</td>
                        <td className="px-3 py-2.5">{Number(result.percentage).toFixed(1)}%</td>
                        <td className="px-3 py-2.5">{result.grade}</td>
                        <td className="px-3 py-2.5 text-warm-600">{result.remark || 'â€”'}</td>
                        <td className="px-3 py-2.5 text-xs font-bold uppercase text-warm-600">{result.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-warm-500">
                No subject results have been calculated for the current enrollment.
              </p>
            )}
          </section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs">
              <h2 className="text-sm font-bold text-charcoal-900">Overall results</h2>
              {results.overall?.length ? (
                <ul className="mt-3 divide-y divide-warm-100">
                  {results.overall.map((result: any) => (
                    <li key={result.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-semibold text-charcoal-900">
                          {result.term?.name || result.academicYear?.name || 'Result'}
                        </p>
                        <p className="text-xs text-warm-500">
                          {result.class?.name}
                          {result.position ? ` Â· Position ${result.position}` : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-forest-800">
                          {Number(result.averagePercentage).toFixed(1)}%
                        </p>
                        <p className="text-[10px] font-bold uppercase text-warm-500">{result.status}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-warm-500">No overall results recorded.</p>
              )}
            </section>

            <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs">
              <h2 className="text-sm font-bold text-charcoal-900">Report cards</h2>
              {results.reportCards?.length ? (
                <ul className="mt-3 divide-y divide-warm-100">
                  {results.reportCards.map((card: any) => (
                    <li key={card.id} className="flex items-center justify-between gap-3 py-3">
                      <div>
                        <p className="text-sm font-semibold text-charcoal-900">
                          {card.term?.name || 'Report card'}
                        </p>
                        <p className="text-xs text-warm-500">
                          {card.averagePercentage != null
                            ? `Average ${Number(card.averagePercentage).toFixed(1)}%`
                            : 'Not calculated'}
                          {card.publishedAt ? ` Â· Published ${formatDate(card.publishedAt)}` : ''}
                        </p>
                      </div>
                      <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-warm-700">
                        {card.status}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-8 text-center text-sm text-warm-500">No report cards generated.</p>
              )}
            </section>
          </div>
        </div>
      )}

      {tab === 'attendance' && (
        <div role="tabpanel" id="panel-attendance" aria-labelledby="tab-attendance" className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs">
          <h2 className="text-sm font-bold text-charcoal-900">Attendance summary</h2>
          {attendance.total === 0 ? (
            <p className="py-10 text-center text-sm text-warm-500">
              No attendance has been recorded for this enrollment yet.
            </p>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Stat label="Sessions" value={String(attendance.total)} />
                <Stat label="Present" value={String(attendance.present)} tone="success" />
                <Stat label="Late" value={String(attendance.late)} tone="warning" />
                <Stat label="Absent" value={String(attendance.absent)} tone="danger" />
                <Stat label="Excused" value={String(attendance.excused)} />
              </div>
              <p className="mt-4 text-xs text-warm-500">
                Attendance rate is calculated from recorded sessions in the current enrollment:
                {' '}
                <strong>{attendance.rate}%</strong>.
              </p>
            </>
          )}
        </div>
      )}

      {tab === 'finance' && (
        <div role="tabpanel" id="panel-finance" aria-labelledby="tab-finance" className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Invoiced" value={money(finance.invoiceTotal, currency)} />
            <Stat label="Paid" value={money(finance.invoicePaid, currency)} tone="success" />
            <Stat label="Outstanding" value={money(finance.invoiceBalance, currency)} tone={finance.invoiceBalance > 0 ? 'danger' : 'success'} />
            <Stat label="Last payment" value={formatDate(finance.lastPaymentAt)} />
          </div>

          <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs">
            <h2 className="text-sm font-bold text-charcoal-900">Invoices</h2>
            {finance.invoices?.length ? (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full divide-y divide-warm-200 text-sm">
                  <thead>
                    <tr>
                      {['Invoice', 'Issued', 'Due', 'Total', 'Paid', 'Balance', 'Status'].map((heading) => (
                        <th key={heading} scope="col" className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-warm-500">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {finance.invoices.map((invoice: any) => (
                      <tr key={invoice.id}>
                        <td className="px-3 py-2.5 font-mono text-xs font-semibold text-charcoal-900">{invoice.invoiceNumber}</td>
                        <td className="px-3 py-2.5 text-xs">{formatDate(invoice.issueDate)}</td>
                        <td className="px-3 py-2.5 text-xs">{formatDate(invoice.dueDate)}</td>
                        <td className="px-3 py-2.5">{money(invoice.totalAmount, invoice.currency || currency)}</td>
                        <td className="px-3 py-2.5">{money(invoice.amountPaid, invoice.currency || currency)}</td>
                        <td className={`px-3 py-2.5 font-semibold ${Number(invoice.balance) > 0 ? 'text-danger-700' : 'text-success-700'}`}>
                          {money(invoice.balance, invoice.currency || currency)}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] font-bold uppercase text-warm-600">{invoice.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-warm-500">No invoices for this student.</p>
            )}
          </section>

          <section className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs">
            <h2 className="text-sm font-bold text-charcoal-900">Payments</h2>
            {finance.payments?.length ? (
              <ul className="mt-3 divide-y divide-warm-100 text-sm">
                {finance.payments.map((payment: any) => (
                  <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                    <div>
                      <p className="font-mono text-xs font-semibold text-charcoal-900">{payment.paymentReference}</p>
                      <p className="text-xs text-warm-500">
                        {formatDate(payment.paymentDate)} Â· {payment.paymentMethod?.replaceAll('_', ' ')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-charcoal-900">{money(payment.amount, payment.currency || currency)}</p>
                      <p className="text-[10px] font-bold uppercase text-warm-500">{payment.status}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-8 text-center text-sm text-warm-500">No payments recorded.</p>
            )}
          </section>
        </div>
      )}

      {editOpen && (
        <EditStudentModal
          student={student}
          onClose={() => setEditOpen(false)}
          onSaved={() => {
            setEditOpen(false);
            load();
          }}
        />
      )}

      {statusOpen && (
        <StatusModal
          currentStatus={student.status}
          studentId={student.id}
          onClose={() => setStatusOpen(false)}
          onSaved={() => {
            setStatusOpen(false);
            load();
          }}
        />
      )}

      {guardianOpen && (
        <GuardianModal
          studentId={student.id}
          onClose={() => setGuardianOpen(false)}
          onSaved={() => {
            setGuardianOpen(false);
            load();
          }}
        />
      )}

      {guardianEditOpen && (
        <GuardianEditModal
          studentId={studentId}
          guardianId={editGuardianId}
          relation={editRelation}
          isPrimary={editIsPrimary}
          onClose={() => setGuardianEditOpen(false)}
          onSaved={() => {
            setGuardianEditOpen(false);
            load();
          }}
        />
      )}

      {moveOpen && (
        <MoveClassModal
          studentId={student.id}
          enrollment={currentEnrollment}
          onClose={() => setMoveOpen(false)}
          onSaved={() => {
            setMoveOpen(false);
            load();
          }}
        />
      )}

      {statementOpen && (
        <StatementModal
          studentId={student.id}
          studentName={fullName}
          data={data}
          onClose={() => setStatementOpen(false)}
        />
      )}

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
                Message will be sent through the school's configured {composeChannel === 'sms' ? 'SMS' : 'email'} provider.
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
                {composeSending ? 'Sending…' : composeChannel === 'sms' ? 'Send SMS' : 'Send Email'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'danger' | 'warning' }) {
  const toneClass =
    tone === 'success'
      ? 'text-success-700'
      : tone === 'danger'
        ? 'text-danger-700'
        : tone === 'warning'
          ? 'text-warning-700'
          : 'text-charcoal-900';
  return (
    <div className="rounded-xl border border-warm-100 bg-ivory-50 p-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-warm-500">{label}</p>
      <p className={`mt-1 truncate text-sm font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-[10px] font-bold uppercase tracking-wide text-warm-500">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold text-charcoal-800 ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>
  );
}

function EditStudentModal({
  student,
  onClose,
  onSaved,
}: {
  student: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    firstName: student.firstName ?? '',
    middleName: student.middleName ?? '',
    lastName: student.lastName ?? '',
    gender: student.gender ?? '',
    dateOfBirth: student.dateOfBirth ? String(student.dateOfBirth).slice(0, 10) : '',
    admissionDate: student.admissionDate ? String(student.admissionDate).slice(0, 10) : '',
    admissionNumber: student.admissionNumber ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError('First name and last name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/students/${student.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          middleName: form.middleName.trim() || undefined,
          lastName: form.lastName.trim(),
          gender: form.gender || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          admissionDate: form.admissionDate || undefined,
          admissionNumber: form.admissionNumber.trim() || undefined,
        }),
      });
      showFeedback('SUCCESS', 'Student details updated.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not update the student.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit student details"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-student-form" isLoading={saving} leftIcon={<PencilLine size={16} />}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-student-form" onSubmit={save} className="space-y-4">
        {error && <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">{error}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First name *" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Last name *" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input label="Middle name" value={form.middleName} onChange={(e) => setForm({ ...form, middleName: e.target.value })} />
          <Select
            label="Gender"
            value={form.gender}
            placeholder="Not specified"
            options={[
              { value: '', label: 'Not specified' },
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
            ]}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          />
          <Input label="Date of birth" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          <Input label="Admission date" type="date" value={form.admissionDate} onChange={(e) => setForm({ ...form, admissionDate: e.target.value })} />
          <Input label="Admission number" value={form.admissionNumber} onChange={(e) => setForm({ ...form, admissionNumber: e.target.value })} />
        </div>
      </form>
    </Modal>
  );
}

function StatusModal({
  studentId,
  currentStatus,
  onClose,
  onSaved,
}: {
  studentId: string;
  currentStatus: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (status === currentStatus) {
      setError('Choose a different status.');
      return;
    }
    if (!reason.trim()) {
      setError('A reason is required for the status change.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/students/${studentId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, reason: reason.trim() }),
      });
      showFeedback('SUCCESS', `Student status changed to ${status}.`);
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not change the student status.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Change student status"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="student-status-form" isLoading={saving} leftIcon={<CheckCircle2 size={16} />}>
            Confirm change
          </Button>
        </>
      }
    >
      <form id="student-status-form" onSubmit={save} className="space-y-4">
        {error && <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">{error}</p>}
        <Select
          label="New status"
          value={status}
          options={LIFECYCLE_STATUSES.map((value) => ({ value, label: value }))}
          onChange={(event) => setStatus(event.target.value)}
        />
        <Input
          label="Reason *"
          required
          placeholder="e.g. Family relocated to Kumasi"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
        <p className="text-xs text-warm-500">
          Withdrawing or transferring a student ends their active enrollment. Graduating keeps the
          record for reporting.
        </p>
      </form>
    </Modal>
  );
}

function GuardianModal({
  studentId,
  onClose,
  onSaved,
}: {
  studentId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relation: 'Guardian',
    isPrimary: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.firstName.trim() || !form.lastName.trim() || !form.relation.trim()) {
      setError('First name, last name and relationship are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const guardian = await apiFetch('/guardians', {
        method: 'POST',
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
        }),
      });
      await apiFetch(`/guardians/link/${studentId}`, {
        method: 'POST',
        body: JSON.stringify({
          guardianId: guardian.id,
          relation: form.relation.trim(),
          isPrimary: form.isPrimary,
        }),
      });
      showFeedback('SUCCESS', 'Guardian linked to the student.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not link the guardian.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Link a guardian"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="guardian-form" isLoading={saving} leftIcon={<Users size={16} />}>
            Link guardian
          </Button>
        </>
      }
    >
      <form id="guardian-form" onSubmit={save} className="space-y-4">
        {error && <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">{error}</p>}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="First name *" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Last name *" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Relationship *" required placeholder="e.g. Mother, Father, Uncle" value={form.relation} onChange={(e) => setForm({ ...form, relation: e.target.value })} />
          <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-warm-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-warm-300"
              checked={form.isPrimary}
              onChange={(e) => setForm({ ...form, isPrimary: e.target.checked })}
            />
            Primary guardian
          </label>
        </div>
        <p className="text-xs text-warm-500">
          A new guardian record is created and linked to this student. The email is used for the
          parent portal once the guardian accepts an invitation.
        </p>
      </form>
    </Modal>
  );
}


  function GuardianEditModal({
    studentId,
    guardianId,
    relation,
    isPrimary,
    onClose,
    onSaved,
  }: {
    studentId: string;
    guardianId: string;
    relation: string;
    isPrimary: boolean;
    onClose: () => void;
    onSaved: () => void;
  }) {
    const [formRelation, setFormRelation] = useState(relation);
    const [formIsPrimary, setFormIsPrimary] = useState(isPrimary);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    async function save(event: React.FormEvent) {
      event.preventDefault();
      if (saving) return;
      if (!formRelation.trim()) {
        setError('Relationship is required.');
        return;
      }
      setSaving(true);
      setError('');
      try {
        await apiFetch(`/guardians/link/${studentId}/${guardianId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            relation: formRelation.trim(),
            isPrimary: formIsPrimary,
          }),
        });
        showFeedback('SUCCESS', 'Guardian relationship updated.');
        onSaved();
      } catch (err: any) {
        setError(err?.message || 'Could not update the relationship.');
      } finally {
        setSaving(false);
      }
    }

    return (
      <Modal
        isOpen
        onClose={onClose}
        title="Edit guardian relationship"
        size="lg"
        footerActions={
          <>
            <Button variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="guardian-edit-form" isLoading={saving} leftIcon={<Edit3 size={16} />}>
              Save changes
            </Button>
          </>
        }
      >
        <form id="guardian-edit-form" onSubmit={save} className="space-y-4">
          {error && <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">{error}</p>}
          <Input
            label="Relationship *"
            required
            placeholder="e.g. Mother, Father, Uncle"
            value={formRelation}
            onChange={(e) => setFormRelation(e.target.value)}
          />
          <label className="flex items-center gap-2 self-end pb-2 text-xs font-semibold text-warm-700">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-warm-300"
              checked={formIsPrimary}
              onChange={(e) => setFormIsPrimary(e.target.checked)}
            />
            Primary guardian
          </label>
        </form>
      </Modal>
    );
  }

function MoveClassModal({
  studentId,
  enrollment,
  onClose,
  onSaved,
}: {
  studentId: string;
  enrollment: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [classes, setClasses] = useState<Option[]>([]);
  const [sections, setSections] = useState<Option[]>([]);
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/classes')
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch((err) => setError(err?.message || 'Could not load classes.'))
      .finally(() => setLoadingOptions(false));
  }, []);

  useEffect(() => {
    setSections([]);
    setSectionId('');
    if (!classId) return;
    apiFetch(`/sections/by-class/${classId}`)
      .then((data) => setSections(Array.isArray(data) ? data : []))
      .catch(() => setSections([]));
  }, [classId]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!classId) {
      setError('Select the new class.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/enrollments/${enrollment.id}/move`, {
        method: 'PATCH',
        body: JSON.stringify({
          newClassId: classId,
          newSectionId: sectionId || undefined,
        }),
      });
      showFeedback('SUCCESS', 'Student moved to the new class.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not move the student.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Move student to another class"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="move-class-form" isLoading={saving} leftIcon={<GraduationCap size={16} />}>
            Move student
          </Button>
        </>
      }
    >
      <form id="move-class-form" onSubmit={save} className="space-y-4">
        {error && <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">{error}</p>}
        <p className="text-xs text-warm-500">
          Current placement:{' '}
          <strong>
            {enrollment?.class?.name ?? 'â€”'}
            {enrollment?.section ? ` Â· ${enrollment.section.name}` : ''}
          </strong>
          . The current enrollment is marked as transferred and a new active enrollment is created
          in the same academic year.
        </p>
        {loadingOptions ? (
          <p className="flex items-center gap-2 text-sm text-warm-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading classesâ€¦
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="New class *"
              value={classId}
              placeholder="Select class"
              options={classes.map((option) => ({ value: option.id, label: option.name }))}
              onChange={(event) => setClassId(event.target.value)}
            />
            <Select
              label="Section"
              value={sectionId}
              placeholder={sections.length ? 'No section' : 'No sections for this class'}
              disabled={!sections.length}
              options={[{ value: '', label: 'No section' }, ...sections.map((option) => ({ value: option.id, label: option.name }))]}
              onChange={(event) => setSectionId(event.target.value)}
            />
          </div>
        )}
        <input type="hidden" value={studentId} readOnly />
      </form>
    </Modal>
  );
}

function StatementModal({
  studentId,
  studentName,
  data,
  onClose,
}: {
  studentId: string;
  studentName: string;
  data: any;
  onClose: () => void;
}) {
  const [statement, setStatement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch(`/finance/students/${studentId}/statement`)
      .then(setStatement)
      .catch((err) => setError(err?.message || 'Could not load the statement.'))
      .finally(() => setLoading(false));
  }, [studentId]);

  const currency = statement?.summary?.currency || data?.finance?.currency || 'GHS';

  function downloadCsv() {
    if (!statement) return;
    const rows: string[][] = [
      ['Student', studentName],
      ['Student number', data?.student?.studentNumber ?? ''],
      ['Generated', new Date().toISOString()],
      [],
      ['Invoice', 'Issued', 'Due', 'Total', 'Paid', 'Balance', 'Status'],
      ...(statement.invoices ?? []).map((invoice: any) => [
        invoice.invoiceNumber,
        formatDate(invoice.issueDate),
        formatDate(invoice.dueDate),
        invoice.totalAmount,
        invoice.amountPaid,
        invoice.balance,
        invoice.status,
      ]),
      [],
      ['Payment', 'Date', 'Method', 'Amount', 'Status'],
      ...(statement.payments ?? []).map((payment: any) => [
        payment.paymentReference,
        formatDate(payment.paymentDate),
        payment.paymentMethod,
        payment.amount,
        payment.status,
      ]),
      [],
      ['Total invoiced', statement.summary?.totalInvoiced ?? 0],
      ['Total paid', statement.summary?.totalPaid ?? 0],
      ['Balance', statement.summary?.balance ?? 0],
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `statement-${data?.student?.studentNumber ?? studentId}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Student financial statement"
      size="xl"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={downloadCsv} disabled={!statement || loading} leftIcon={<Download size={16} />}>
            Download CSV
          </Button>
        </>
      }
    >
      {loading ? (
        <p className="flex items-center gap-2 py-8 text-sm text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading statementâ€¦
        </p>
      ) : error ? (
        <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">{error}</p>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Stat label="Invoiced" value={money(statement.summary.totalInvoiced, currency)} />
            <Stat label="Paid" value={money(statement.summary.totalPaid, currency)} tone="success" />
            <Stat label="Balance" value={money(statement.summary.balance, currency)} tone={Number(statement.summary.balance) > 0 ? 'danger' : 'success'} />
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200 text-xs">
              <thead>
                <tr>
                  {['Invoice', 'Issued', 'Due', 'Total', 'Balance', 'Status'].map((heading) => (
                    <th key={heading} scope="col" className="px-2 py-2 text-left font-bold uppercase tracking-wide text-warm-500">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {(statement.invoices ?? []).map((invoice: any) => (
                  <tr key={invoice.id}>
                    <td className="px-2 py-2 font-mono">{invoice.invoiceNumber}</td>
                    <td className="px-2 py-2">{formatDate(invoice.issueDate)}</td>
                    <td className="px-2 py-2">{formatDate(invoice.dueDate)}</td>
                    <td className="px-2 py-2">{money(invoice.totalAmount, invoice.currency || currency)}</td>
                    <td className="px-2 py-2">{money(invoice.balance, invoice.currency || currency)}</td>
                    <td className="px-2 py-2 font-bold uppercase">{invoice.status}</td>
                  </tr>
                ))}
                {!statement.invoices?.length && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-warm-500">
                      No invoices recorded for this student.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-warm-600">Payments</h3>
            {statement.payments?.length ? (
              <ul className="mt-2 divide-y divide-warm-100 text-xs">
                {statement.payments.map((payment: any) => (
                  <li key={payment.id} className="flex items-center justify-between py-2">
                    <span className="font-mono">{payment.paymentReference}</span>
                    <span>{formatDate(payment.paymentDate)}</span>
                    <span className="font-semibold">{money(payment.amount, payment.currency || currency)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-xs text-warm-500">No payments recorded.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
