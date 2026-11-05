'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  SettingRow,
  SettingsError,
  SettingsLoading,
  SettingsPageHeader,
  SettingsSection,
  useSettingsAccess,
} from '@/components/settings/settings-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, GraduationCap, Plus, Users, UserCheck } from 'lucide-react';

/**
 * Student management settings.
 *
 * Reports the real enrolled-student count and links into the modules that own
 * admissions, numbering, enrollment and student/guardian records.
 */
export default function StudentConfigPage() {
  // /schools/me/students is only readable by SCHOOL_ADMIN/PRINCIPAL (ADMIN is an
  // alias of SCHOOL_ADMIN), so the page is limited to those roles.
  const { canManage } = useSettingsAccess(['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL']);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totalStudents, setTotalStudents] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      // /schools/me/students returns the full list (no pagination wrapper).
      const students = await apiFetch('/schools/me/students');
      setTotalStudents(
        Array.isArray(students) ? students.length : Number(students?.total ?? 0),
      );
    } catch (err: any) {
      setError(err?.message || 'Unable to load student configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SettingsLoading label="Loading student settings…" />;

  if (error) {
    return <SettingsError title="Unable to load student configuration" message={error} onRetry={load} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <SettingsPageHeader
        title="Student Management Configuration"
        description="Admissions, student numbering, enrollment and student records."
        actions={
          canManage && (
            <Link href="/dashboard/students/new">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Admit Student</Button>
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsSection
          title="Admissions & Enrollment"
          icon={GraduationCap}
          actions={<Badge variant="neutral" className="text-[10px]">{totalStudents} students</Badge>}
        >
          <p className="text-sm text-warm-600">
            How students enter your school: application campaigns, automatically generated student
            numbers, and enrollment into a class for the current academic year.
          </p>
          <SettingRow
            label="Admission Campaigns"
            description="Manage public admission campaigns and applications."
            icon={UserCheck}
            href="/dashboard/admissions"
            canManage={canManage}
          />
          <SettingRow
            label="Student Numbering"
            description="Configure automatic student number generation."
            icon={FileText}
            href="/settings/numbering"
            canManage={canManage}
          />
          <SettingRow
            label="Enrollments"
            description="Assign students to classes and sections for the active academic year."
            icon={GraduationCap}
            href="/dashboard/academics/enrollments"
            canManage={canManage}
          />
        </SettingsSection>

        <SettingsSection title="Student Records" icon={Users}>
          <p className="text-sm text-warm-600">
            Manage student profiles, guardian relationships, and documents.
          </p>
          <SettingRow
            label="Student Directory"
            description="Browse, search and edit student records and statuses."
            icon={Users}
            href="/dashboard/students"
            canManage={canManage}
          />
          <SettingRow
            label="Guardians"
            description="Manage guardian records and their linked students."
            icon={UserCheck}
            href="/dashboard/guardians"
            canManage={canManage}
          />
        </SettingsSection>

        <SettingsSection title="Overview" icon={FileText}>
          <div className="text-center py-4">
            <p className="text-2xl font-bold text-charcoal-900">{totalStudents}</p>
            <p className="text-[10px] text-warm-500 uppercase tracking-wide">Registered Students</p>
          </div>
          <Link href="/dashboard/students" className="block">
            <Button variant="outline" size="sm" className="w-full">
              Manage All Students
            </Button>
          </Link>
        </SettingsSection>
      </div>

      <div className="bg-sage-50 border border-sage-100 rounded-xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-forest-700 mb-4">
          How student records behave
        </h3>
        <ul className="text-sm text-warm-600 space-y-2 list-disc pl-6">
          <li>
            A student number is generated automatically during admission when one is not supplied.
          </li>
          <li>
            Enrollment links a student to a class and section within an academic year and term, so
            create those first.
          </li>
          <li>
            Adding a guardian to each student enables parent-facing messaging, attendance alerts and
            report-card delivery.
          </li>
          <li>Student records are visible only inside your school workspace.</li>
        </ul>
      </div>
    </div>
  );
}
