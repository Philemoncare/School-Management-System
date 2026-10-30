'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShieldCheck, GraduationCap, Plus, Briefcase } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function StaffSettingsPage() {
  const { user } = useAuth();
  const activeSchoolId = localStorage.getItem('schoolId');
  const roles = user ? collectUserRoles(user, activeSchoolId || undefined) : [];
  const canManage = roles.some((r) => ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'HR_OFFICER'].includes(r));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [teachers, setTeachers] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch('/teachers?limit=100').catch(() => ({ items: [] })),
      apiFetch('/schools/me/staff').catch(() => []),
    ]).then(([t, s]) => {
      setTeachers(Array.isArray(t?.items) ? t.items : []);
      setStaff(Array.isArray(s) ? s : []);
      setLoading(false);
    }).catch((err) => {
      setError(err.message || 'Unable to load staff data');
      setLoading(false);
    });
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
          <h2 className="text-lg font-bold text-danger-800 mb-2">Unable to load staff settings</h2>
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
            Staff & User Management
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Manage staff accounts, teacher accounts, roles, and permissions.
          </p>
        </div>
        {canManage && (
          <Link href="/dashboard/teachers/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Register Teacher</Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
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
            <Badge variant="default" className="text-[10px]">{teachers.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {teachers.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-warm-500 text-sm">No teachers registered yet.</p>
                  {canManage && (
                    <Button asChild href="/dashboard/teachers/new" variant="outline" size="sm" className="w-full mt-3">
                      Register First Teacher
                    </Button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-warm-200">
                    <thead className="bg-ivory-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Name</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Employee ID</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100">
                      {teachers.map((t) => (
                        <tr key={t.id} className="hover:bg-ivory-50">
                          <td className="px-5 py-3 text-sm font-medium text-charcoal-900">
                            {t.firstName} {t.lastName}
                          </td>
                          <td className="px-5 py-3 text-xs text-warm-500 font-mono">{t.employeeId}</td>
                          <td className="px-5 py-3">
                            <Badge variant={t.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px]">
                              {t.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {canManage && teachers.length > 0 && (
              <Button asChild href="/dashboard/teachers" variant="outline" size="sm" className="w-full mt-3">
                View All Teachers
              </Button>
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
            <Badge variant="default" className="text-[10px]">{staff.length}</Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {staff.length === 0 ? (
                <div className="py-6 text-center">
                  <p className="text-warm-500 text-sm">No staff members registered yet.</p>
                  <p className="text-[10px] text-warm-400 mt-2">Use HR module to add administrative staff.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-warm-200">
                    <thead className="bg-ivory-50">
                      <tr>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Name</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Employee ID</th>
                        <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Designation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100">
                      {staff.map((s) => (
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <div className="bg-sage-50 border border-sage-100 rounded-xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-forest-700 mb-4">Role-Based Access Control</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4 border border-warm-200 hover:border-forest-200 transition-all cursor-pointer" onClick={() => window.location.href = '/dashboard/users'}>
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-forest-700" />
              <div>
                <p className="text-sm font-semibold text-charcoal-900">User Accounts & Roles</p>
                <p className="text-[10px] text-warm-500">Manage school user accounts and role assignments</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-warm-200 hover:border-forest-200 transition-all cursor-pointer" onClick={() => window.location.href = '/dashboard/hr/staff'}>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-forest-700" />
              <div>
                <p className="text-sm font-semibold text-charcoal-900">HR & Staff Records</p>
                <p className="text-[10px] text-warm-500">Staff employment, departments, and positions</p>
              </div>
            </div>
          </Card>
          <Card className="p-4 border border-warm-200 hover:border-forest-200 transition-all cursor-pointer" onClick={() => window.location.href = '/dashboard/hr/positions'}>
            <div className="flex items-center gap-3">
              <Briefcase className="w-5 h-5 text-forest-700" />
              <div>
                <p className="text-sm font-semibold text-charcoal-900">Positions & Departments</p>
                <p className="text-[10px] text-warm-500">Organizational structure configuration</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

