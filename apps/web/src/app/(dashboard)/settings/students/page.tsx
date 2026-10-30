'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, Plus, AlertTriangle, Mail, Phone, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StudentConfigPage() {
  const { user } = useAuth();
  const activeSchoolId = localStorage.getItem('schoolId');
  const roles = user ? collectUserRoles(user, activeSchoolId || undefined) : [];
  const canManage = roles.some((r) => ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'RECEPTIONIST'].includes(r));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    apiFetch('/schools/me/students').catch(() => ({ items: [] })).then((d) => {
      setStats({ total: (d?.items?.length || 0) });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
          <h2 className="text-lg font-bold text-danger-800 mb-2">Unable to load student configuration</h2>
          <p className="text-danger-700 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            Student Management Configuration
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Configure admission settings, student numbering, enrollment, and student records.
          </p>
        </div>
        {canManage && (
          <Link href="/dashboard/students/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Admit Student</Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admission Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Admission Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-warm-600">
              Configure how students are admitted to your school, including application
              requirements, student numbering, and enrollment workflows.
            </p>
            <div className="space-y-3">
              <SettingRow
                label="Admission Campaigns"
                description="Manage public admission campaigns and applications."
                icon={<AlertTriangle />}
                href="/dashboard/admissions"
                canManage={canManage}
              />
              <SettingRow
                label="Student Numbering"
                description="Configure automatic student number generation."
                icon={<FileText />}
                href="/dashboard/settings/numbering"
                canManage={canManage}
              />
              <SettingRow
                label="Enrollment Rules"
                description="Configure enrollment statuses and academic year assignment."
                icon={<GraduationCap />}
                href="/dashboard/academics/enrollments"
                canManage={canManage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Student Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> Student Records
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-warm-600">
              Manage student profiles, guardian relationships, and document requirements.
            </p>
            <div className="space-y-3">
              <SettingRow
                label="Guardian Configuration"
                description="Set guardian information requirements and contact preferences."
                icon={<Phone />}
                href="/dashboard/guardians"
                canManage={canManage}
              />
              <SettingRow
                label="Student Status Options"
                description="Configure available student statuses (Active, Suspended, Withdrawn, etc.)."
                icon={<FileText />}
                href="/dashboard/students"
                canManage={canManage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-center py-4">
              <p className="text-2xl font-bold text-charcoal-900">{stats.total || 0}</p>
              <p className="text-[10px] text-warm-500">Total Students</p>
            </div>
            {canManage && (
              <Button asChild href="/dashboard/students" variant="outline" size="sm" className="w-full mt-3">
                Manage All Students
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="bg-sage-50 border border-sage-100 rounded-xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-forest-700 mb-4">Configuration Notes</h3>
        <ul className="text-sm text-warm-600 space-y-2 list-disc pl-6">
          <li>Student numbers are auto-generated unless manually specified during admission.</li>
          <li>Guardian relationships must be established for each student for communication purposes.</li>
          <li>Enrollment is tied to the active academic year and term.</li>
          <li>Student records are isolated to your school workspace only.</li>
        </ul>
      </div>
    </div>
  );
}

function SettingRow({ label, description, icon: Icon, href, canManage }: {
  label: string;
  description: string;
  Icon: any;
  href: string;
  canManage: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-warm-200 hover:bg-forest-50/50 transition-all cursor-pointer" onClick={() => window.location.href = href}>
      <Icon className="w-4 h-4 text-warm-500" />
      <div className="flex-1">
        <p className="text-sm font-medium text-charcoal-900">{label}</p>
        <p className="text-[10px] text-warm-500">{description}</p>
      </div>
      <span className="text-[10px] font-bold text-warm-400">→</span>
    </div>
  );
}

import { Separator } from '@/components/ui/separator';
