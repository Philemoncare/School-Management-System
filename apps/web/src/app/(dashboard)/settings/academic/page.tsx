'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, GraduationCap, Layers, Book, CalendarCheck, AlertTriangle, Plus } from 'lucide-react';

export default function AcademicConfigPage() {
  const { user } = useAuth();
  const activeSchoolId = localStorage.getItem('schoolId');
  const roles = user ? collectUserRoles(user, activeSchoolId || undefined) : [];
  const canManage = roles.some((r) => ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'].includes(r));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch('/academic-years').catch(() => []),
      apiFetch('/schools/me/classes').catch(() => []),
      apiFetch('/schools/me/subjects').catch(() => []),
    ]).then(([y, c, s]) => {
      setYears(Array.isArray(y) ? y : []);
      setClasses(Array.isArray(c) ? c : []);
      setSubjects(Array.isArray(s) ? s : []);
      setLoading(false);
    }).catch((err) => {
      setError(err.message || 'Unable to load academic configuration');
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
          <h2 className="text-lg font-bold text-danger-800 mb-2">Unable to load configuration</h2>
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
            Academic Configuration
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Configure academic years, terms, classes, sections, and subjects.
          </p>
        </div>
        {canManage && (
          <Link href="/dashboard/academics/classes">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Add Class</Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      {/* Academic Years */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5" />
            <CardTitle>Academic Years</CardTitle>
          </div>
          <p className="text-xs text-warm-500">{years.length} configured</p>
        </CardHeader>
        <CardContent>
          {years.length === 0 ? (
            <div className="py-8 text-center">
              <AlertTriangle className="mx-auto text-warm-200 mb-3" size={32} />
              <p className="text-warm-500 text-sm font-medium">No academic years configured.</p>
              {canManage && (
                <Button asChild href="/dashboard/academics/years" variant="outline" size="sm">
                  Create Academic Year
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200">
                <thead className="bg-ivory-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Year</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Code</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Status</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Current</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {years.map((y) => (
                    <tr key={y.id} className="hover:bg-ivory-50">
                      <td className="px-5 py-3 text-sm font-medium text-charcoal-900">{y.name}</td>
                      <td className="px-5 py-3 text-xs text-warm-500 font-mono">{y.code}</td>
                      <td className="px-5 py-3">
                        <Badge variant="default" className="text-[10px]">{y.status}</Badge>
                      </td>
                      <td className="px-5 py-3 text-xs font-bold text-warm-500 text-right">
                        {y.isCurrent ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="w-4 h-4" /> Classes & Streams
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-center py-4">
              <p className="text-sm font-medium text-charcoal-900">{classes.length} classes</p>
              <p className="text-[10px] text-warm-500">Manage classes and sections</p>
            </div>
            {canManage && (
              <Button asChild href="/dashboard/academics/classes" variant="outline" size="sm" className="w-full mt-3">
                Manage Classes
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="w-4 h-4" /> Subjects
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-center py-4">
              <p className="text-sm font-medium text-charcoal-900">{subjects.length} subjects</p>
              <p className="text-[10px] text-warm-500">Configure subject offerings</p>
            </div>
            {canManage && (
              <Button asChild href="/dashboard/academics/subjects" variant="outline" size="sm" className="w-full mt-3">
                Manage Subjects
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Terms
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="text-center py-4">
              <p className="text-sm font-medium text-charcoal-900">{terms.length} terms</p>
              <p className="text-[10px] text-warm-500">Academic terms configuration</p>
            </div>
            {canManage && (
              <Button asChild href="/dashboard/academics/years" variant="outline" size="sm" className="w-full mt-3">
                Manage Terms
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Badge } from '@/components/ui/badge';
