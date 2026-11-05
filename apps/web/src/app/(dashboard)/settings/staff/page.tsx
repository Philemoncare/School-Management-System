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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, GraduationCap, Plus, ShieldCheck } from 'lucide-react';

/**
 * Staff & user management settings.
 *
 * Read-only headcount of the two people directories plus navigation into the
 * modules that own those records (HR and Users). This page never edits a
 * staff, teacher or user record itself (Settings standard).
 */
export default function StaffSettingsPage() {
  // Mirrors the API: /schools/me/* is restricted to SCHOOL_ADMIN, PRINCIPAL and
  // SUPER_ADMIN, so other roles (including HR_OFFICER) would only see failures.
  const { canManage } = useSettingsAccess(['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL']);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [t, s] = await Promise.all([
        apiFetch('/teachers?limit=100'),
        apiFetch('/schools/me/staff'),
      ]);
      setTeachers(Array.isArray(t?.items) ? t.items : []);
      setStaff(Array.isArray(s) ? s : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load staff data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SettingsLoading label="Loading staff settings…" />;

  if (error) {
    return (
      <SettingsError
        title="Unable to load staff settings"
        message={error}
        onRetry={load}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <SettingsPageHeader
        title="Staff & User Management"
        description="Staff accounts, teacher accounts, roles, and permissions."
        actions={
          canManage && (
            <Link href="/dashboard/hr/staff/new">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Add Staff Member</Button>
            </Link>
          )
        }
      />

      {!canManage && (
        <div className="rounded-xl border border-warm-200 bg-ivory-50 p-4 text-sm font-medium text-warm-600">
          You have view-only access to staff settings.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teachers */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              <CardTitle>Teachers</CardTitle>
            </div>
            <Badge variant="neutral" className="text-[10px]">{teachers.length}</Badge>
          </CardHeader>
          <CardContent>
            {teachers.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-warm-500 text-sm">No teachers registered yet.</p>
                {canManage && (
                  <Link href="/dashboard/hr/staff/new">
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      Register First Teacher
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-warm-200">
                    <caption className="sr-only">Teachers</caption>
                    <thead className="bg-ivory-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Name</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Employee ID</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100">
                      {teachers.slice(0, 5).map((t) => (
                        <tr key={t.id} className="hover:bg-ivory-50">
                          <td className="px-5 py-3 text-sm font-medium text-charcoal-900">
                            {t.firstName} {t.lastName}
                          </td>
                          <td className="px-5 py-3 text-xs text-warm-500 font-mono">{t.employeeId}</td>
                          <td className="px-5 py-3">
                            <Badge variant={t.status === 'ACTIVE' ? 'default' : 'neutral'} className="text-[10px]">
                              {t.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link href="/dashboard/hr/staff?type=TEACHER">
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View All Teachers
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Staff */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              <CardTitle>Administrative Staff</CardTitle>
            </div>
            <Badge variant="neutral" className="text-[10px]">{staff.length}</Badge>
          </CardHeader>
          <CardContent>
            {staff.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-warm-500 text-sm">No staff members registered yet.</p>
                {canManage ? (
                  <Link href="/dashboard/hr/staff/new">
                    <Button variant="outline" size="sm" className="w-full mt-3">
                      Add First Staff Member
                    </Button>
                  </Link>
                ) : (
                  <p className="text-[10px] text-warm-400 mt-2">
                    An administrator can register staff from the HR module.
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-warm-200">
                    <caption className="sr-only">Administrative staff</caption>
                    <thead className="bg-ivory-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Name</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Employee ID</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Designation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100">
                      {staff.slice(0, 5).map((s) => (
                        <tr key={s.id} className="hover:bg-ivory-50">
                          <td className="px-5 py-3 text-sm font-medium text-charcoal-900">
                            {s.firstName} {s.lastName}
                          </td>
                          <td className="px-5 py-3 text-xs text-warm-500 font-mono">{s.employeeId}</td>
                          <td className="px-5 py-3 text-xs text-warm-500">{s.designation || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Link href="/dashboard/hr/staff">
                  <Button variant="outline" size="sm" className="w-full mt-3">
                    View All Staff
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <SettingsSection
        title="Roles, Permissions & Organisation"
        description="Accounts and structure are managed in their own modules."
        icon={ShieldCheck}
      >
        <SettingRow
          label="User Accounts & Roles"
          description="Manage school user accounts and role assignments."
          icon={ShieldCheck}
          href="/dashboard/users"
          canManage={canManage}
        />
        <SettingRow
          label="HR & Staff Records"
          description="Staff employment, departments, and positions."
          icon={Briefcase}
          href="/dashboard/hr/staff"
          canManage={canManage}
        />
        <SettingRow
          label="Positions"
          description="Job titles used across staff records."
          icon={GraduationCap}
          href="/dashboard/hr/positions"
          canManage={canManage}
        />
        <SettingRow
          label="Departments"
          description="Organisational units staff and teachers belong to."
          icon={Briefcase}
          href="/dashboard/hr/departments"
          canManage={canManage}
        />
      </SettingsSection>
    </div>
  );
}
