'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  SettingsError,
  SettingsLoading,
  SettingsPageHeader,
  SettingsSection,
  useSettingsAccess,
} from '@/components/settings/settings-ui';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Book,
  CalendarCheck,
  GraduationCap,
  Layers,
  Plus,
} from 'lucide-react';

/**
 * Academic configuration.
 *
 * Read-only overview of the school's academic structure plus links into the
 * pages that own each entity. This page never edits academic data itself — the
 * academics module is the single owner (Settings standard).
 */
export default function AcademicConfigPage() {
  const { canManage } = useSettingsAccess();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [years, setYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [y, c, s] = await Promise.all([
        apiFetch('/academic-years'),
        apiFetch('/classes'),
        apiFetch('/schools/me/subjects'),
      ]);
      setYears(Array.isArray(y) ? y : []);
      setClasses(Array.isArray(c) ? c : []);
      setSubjects(Array.isArray(s) ? s : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load academic configuration');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SettingsLoading label="Loading academic configuration…" />;

  if (error) {
    return (
      <SettingsError
        title="Unable to load academic configuration"
        message={error}
        onRetry={load}
      />
    );
  }

  // Terms belong to an academic year and are only exposed through it.
  const termsCount = years.reduce((total, y) => total + (y._count?.terms ?? y.terms?.length ?? 0), 0);
  const sectionsCount = classes.reduce((total, c) => total + (c._count?.sections ?? 0), 0);
  const currentYear = years.find((y) => y.isCurrent);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <SettingsPageHeader
        title="Academic Configuration"
        description="Academic years, terms, classes, sections, and subjects. Each area is edited in its own module."
        actions={
          canManage && (
            <Link href="/dashboard/academics/classes">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Add Class</Button>
            </Link>
          )
        }
      />

      {!canManage && (
        <div className="rounded-xl border border-warm-200 bg-ivory-50 p-4 text-sm font-medium text-warm-600">
          You have view-only access to academic settings.
        </div>
      )}

      {/* Academic Years */}
      <SettingsSection
        title="Academic Years"
        description="The calendar container for terms, enrollments, fees and results."
        icon={CalendarCheck}
        actions={<p className="text-xs text-warm-500">{years.length} configured</p>}
      >
        {years.length === 0 ? (
          <div className="py-8 text-center">
            <AlertTriangle className="mx-auto text-warm-300 mb-3" size={32} />
            <p className="text-warm-500 text-sm font-medium">No academic years configured.</p>
            <p className="text-xs text-warm-400 mt-1 mb-4">
              Create an academic year and its terms before enrolling students.
            </p>
            {canManage && (
              <Link href="/dashboard/academics/years" className="inline-block">
                <Button variant="outline" size="sm">
                  Create Academic Year
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Academic years</caption>
              <thead className="bg-ivory-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Year</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Code</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Terms</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Current</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {years.map((y) => (
                  <tr key={y.id} className="hover:bg-ivory-50">
                    <td className="px-5 py-3 text-sm font-medium text-charcoal-900">{y.name}</td>
                    <td className="px-5 py-3 text-xs text-warm-500 font-mono">{y.code}</td>
                    <td className="px-5 py-3 text-xs text-warm-500">{y._count?.terms ?? y.terms?.length ?? 0}</td>
                    <td className="px-5 py-3">
                      <Badge variant={y.status === 'ACTIVE' ? 'default' : 'neutral'} className="text-[10px]">
                        {y.status}
                      </Badge>
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
      </SettingsSection>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsSection title="Classes & Streams" icon={Layers}>
          <p className="text-sm font-medium text-charcoal-900">{classes.length} classes</p>
          <p className="text-xs text-warm-500">
            {sectionsCount} section{sectionsCount === 1 ? '' : 's'} across all classes
          </p>
          <Link href="/dashboard/academics/classes" className="block">
            <Button variant="outline" size="sm" className="w-full mt-1">
              Manage Classes
            </Button>
          </Link>
        </SettingsSection>

        <SettingsSection title="Subjects" icon={Book}>
          <p className="text-sm font-medium text-charcoal-900">{subjects.length} subjects</p>
          <p className="text-xs text-warm-500">Subject offerings and their class assignments</p>
          {canManage ? (
            <Link href="/dashboard/academics/subjects" className="block">
              <Button variant="outline" size="sm" className="w-full mt-1">
                Manage Subjects
              </Button>
            </Link>
          ) : (
            <Link href="/dashboard/academics/subjects" className="block">
              <Button variant="outline" size="sm" className="w-full mt-1">
                View Subjects
              </Button>
            </Link>
          )}
        </SettingsSection>

        <SettingsSection title="Terms" icon={GraduationCap}>
          <p className="text-sm font-medium text-charcoal-900">{termsCount} terms</p>
          <p className="text-xs text-warm-500">
            {currentYear ? `Within ${currentYear.name}` : 'No current academic year set'}
          </p>
          <Link href="/dashboard/academics/years" className="block">
            <Button variant="outline" size="sm" className="w-full mt-1">
              Manage Terms
            </Button>
          </Link>
        </SettingsSection>
      </div>
    </div>
  );
}
