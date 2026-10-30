'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, ShieldCheck, Users, AlertCircle, FileText, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SecurityAccessPage() {
  const { user } = useAuth();
  const activeSchoolId = localStorage.getItem('schoolId');
  const roles = user ? collectUserRoles(user, activeSchoolId || undefined) : [];
  const canManage = roles.some((r) => ['SCHOOL_ADMIN', 'ADMIN'].includes(r));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/security/policy?schoolId=' + activeSchoolId).catch(() => null).finally(() => setLoading(false));
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
          <h2 className="text-lg font-bold text-danger-800 mb-2">Unable to load security settings</h2>
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
            Security & Access
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Manage staff roles, permission assignments, and school-level audit history.
          </p>
        </div>
        {canManage && (
          <Link href="/dashboard/users">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Manage Users</Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles & Permissions */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              <CardTitle>Roles & Permissions</CardTitle>
            </div>
            <Badge variant="default" className="text-[10px]">School-level</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-warm-600">
              Define staff roles and assign permissions for school functions. Teachers and
              staff only access modules assigned to them.
            </p>
            <div className="space-y-3">
              <SettingRow
                label="Staff Roles"
                description="Create and manage staff roles (Teacher, Accountant, Librarian, etc.)."
                icon={<Users />}
                href="/dashboard/users"
                canManage={canManage}
              />
              <SettingRow
                label="Permission Assignments"
                description="Assign specific permissions to each role for granular access control."
                icon={<ShieldCheck />}
                href="/dashboard/users"
                canManage={canManage}
              />
              <SettingRow
                label="Account Activation"
                description="Activate or suspend staff and teacher accounts."
                icon={<Lock />}
                href="/dashboard/users"
                canManage={canManage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Activity History */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              <CardTitle>School Activity History</CardTitle>
            </div>
            <Badge variant="default" className="text-[10px]">Audit Log</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-warm-600">
              Review school-level audit events including staff actions, student changes,
              and configuration updates.
            </p>
            <div className="space-y-3">
              <SettingRow
                label="View Activity Log"
                description="Review recent actions performed within your school workspace."
                icon={<FileText />}
                href="/dashboard/activity"
                canManage={canManage}
              />
              <SettingRow
                label="Staff Supervision"
                description="Monitor teacher task completion and activity summaries."
                icon={<Users />}
                href="/dashboard/tasks"
                canManage={canManage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Security Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="w-5 h-5" /> Security Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-warm-600">
              Configure school-level password policies, session management, and MFA settings.
            </p>
            <div className="space-y-3">
              <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
                <p className="text-[10px] font-bold uppercase text-warm-500">Password Policy</p>
                <p className="text-xs text-warm-500 mt-1">
                  Minimum 8 characters, require uppercase, numbers, and symbols.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
                <p className="text-[10px] font-bold uppercase text-warm-500">Session Timeout</p>
                <p className="text-xs text-warm-500 mt-1">
                  60 minutes idle timeout, 5 concurrent sessions max.
                </p>
              </div>
              <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
                <p className="text-[10px] font-bold uppercase text-warm-500">MFA Enforcement</p>
                <p className="text-xs text-warm-500 mt-1">
                  Optional — can be enforced by Platform Super Admin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-terracotta-200 bg-terracotta-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-terracotta-700" /> Platform Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-terracotta-700 mb-3">
              Platform-wide security configuration, global audit monitoring, and cross-school
              user administration are managed exclusively by the Platform Super Admin.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-terracotta-100/50 border border-terracotta-200/50 text-xs text-terracotta-700">
                <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                <span>Global security policies are NOT configurable from school settings.</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-terracotta-100/50 border border-terracotta-200/50 text-xs text-terracotta-700">
                <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                <span>School-level audit events remain private to your workspace.</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
