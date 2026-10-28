'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, GraduationCap, Calendar, Mail, Phone, User, Users, AlertCircle, Lock, RefreshCw, FileText,
} from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useChild } from '@/context/child-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

export default function ChildProfilePage() {
  const params = useParams<{ studentId: string }>();
  const studentId = params?.studentId;
  const router = useRouter();
  const { activeSchoolId } = useAuth();
  const { children, setActiveChild } = useChild();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  async function load() {
    if (!studentId || !activeSchoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDenied(false);
    try {
      const data = await apiFetch(`/parent/children/${studentId}/profile`);
      setStudent(data);
      const match = children.find((child) => child.id === studentId);
      if (match) setActiveChild(match);
    } catch (err) {
      setStudent(null);
      if (err instanceof ApiError && err.isPermissionDenied()) setDenied(true);
      else setError(err instanceof Error ? err.message : 'Could not load this child profile.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, activeSchoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
        <RefreshCw size={16} className="animate-spin" /> Loading child profile…
      </div>
    );
  }

  if (denied) {
    return (
      <EmptyState
        title="Profile not available"
        description="Your account is not linked to this student record."
        icon={<Lock className="h-8 w-8" />}
        actionButton={<Link href="/parent/children"><Button variant="outline" size="sm">Back to Children</Button></Link>}
      />
    );
  }

  if (error || !student) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 py-6">
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error || 'This student profile could not be found.'}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load} leftIcon={<RefreshCw size={15} />}>Try Again</Button>
          <Button variant="ghost" size="sm" onClick={() => router.push('/parent/children')} leftIcon={<ArrowLeft size={15} />}>Back</Button>
        </div>
      </div>
    );
  }

  const enrollment = student.enrollments?.[0];
  const guardians: any[] = Array.isArray(student.guardians) ? student.guardians : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/parent/children"
            className="mt-1 rounded-lg border border-warm-200 bg-card p-2 text-warm-500 transition-colors hover:border-warm-300 hover:text-forest-700"
            aria-label="Back to children"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">
              {student.firstName} {student.middleName ? `${student.middleName} ` : ''}{student.lastName}
            </h1>
            <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
              Student profile and enrollment details.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/parent/attendance"><Button variant="outline" size="sm">Attendance</Button></Link>
          <Link href="/parent/results"><Button variant="outline" size="sm">Results</Button></Link>
          <Link href="/parent/fees"><Button variant="outline" size="sm">Fees</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs lg:col-span-2">
          <div className="flex items-center gap-2 border-b border-warm-100 p-5 sm:p-6">
            <FileText size={20} className="text-forest-700" />
            <h2 className="font-bold text-charcoal-900">Student Details</h2>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 p-5 sm:grid-cols-2 sm:p-6">
            <Detail label="Student number" value={student.studentNumber} />
            <Detail label="Admission number" value={student.admissionNumber} />
            <Detail label="Gender" value={student.gender} />
            <Detail label="Date of birth" value={student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : null} />
            <Detail label="Admission date" value={student.admissionDate ? new Date(student.admissionDate).toLocaleDateString() : null} />
            <Detail label="Status" value={student.status} />
          </dl>
        </section>

        <section className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
          <div className="flex items-center gap-2 border-b border-warm-100 p-5">
            <GraduationCap size={20} className="text-forest-700" />
            <h2 className="font-bold text-charcoal-900">Enrollment</h2>
          </div>
          <div className="space-y-4 p-5">
            {enrollment ? (
              <>
                <Detail label="Class" value={enrollment.class?.name} icon={<GraduationCap size={14} />} />
                <Detail label="Section" value={enrollment.section?.name} />
                <Detail label="Academic year" value={enrollment.academicYear?.name} icon={<Calendar size={14} />} />
                <Detail label="Term" value={enrollment.term?.name} />
                <Detail label="Status" value={enrollment.status} />
              </>
            ) : (
              <p className="py-4 text-center text-sm text-warm-500">No active enrollment on record.</p>
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
        <div className="flex items-center gap-2 border-b border-warm-100 p-5 sm:p-6">
          <Users size={20} className="text-forest-700" />
          <h2 className="font-bold text-charcoal-900">Guardians</h2>
        </div>
        <div className="divide-y divide-warm-100">
          {guardians.length === 0 ? (
            <p className="p-5 text-center text-sm text-warm-500 sm:p-6">No guardians recorded for this student.</p>
          ) : (
            guardians.map((link: any) => {
              const guardian = link.guardian || {};
              return (
                <div key={link.id} className="flex flex-col gap-2 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-50 text-forest-700">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-charcoal-900">
                        {guardian.firstName} {guardian.lastName}
                      </p>
                      <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">
                        {link.relation || 'Guardian'} {link.isPrimary ? '• Primary contact' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs font-medium text-warm-500 sm:text-right">
                    {guardian.email && (
                      <p className="flex items-center gap-1.5 sm:justify-end"><Mail size={12} /> {guardian.email}</p>
                    )}
                    {guardian.phone && (
                      <p className="flex items-center gap-1.5 sm:justify-end"><Phone size={12} /> {guardian.phone}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-warm-400">{label}</dt>
      <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-semibold text-charcoal-900">
        {icon}
        {value || '—'}
      </dd>
    </div>
  );
}
