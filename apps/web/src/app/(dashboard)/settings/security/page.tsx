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
import { AlertTriangle, FileText, Lock, ShieldCheck, Users, AlertCircle, Plus } from 'lucide-react';

/**
 * Security & access settings.
 *
 * Roles and audit history are edited in their own modules; this page surfaces
 * the *effective* security policy returned by `GET /security/policy` (platform
 * defaults strengthened by any school-level overrides) instead of hard-coded
 * values. Schools cannot weaken platform policy, so nothing here is editable.
 */

const MFA_LABELS: Record<string, string> = {
  OPTIONAL: 'Optional',
  REQUIRED_FOR_ADMINS: 'Required for admins',
  REQUIRED_FOR_ALL: 'Required for all staff',
};

export default function SecurityAccessPage() {
  const { canManage } = useSettingsAccess(['SCHOOL_ADMIN', 'ADMIN']);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [policy, setPolicy] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/security/policy');
      setPolicy(data ?? null);
    } catch (err: any) {
      setError(err?.message || 'Unable to load security settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SettingsLoading label="Loading security settings…" />;

  if (error) {
    return <SettingsError title="Unable to load security settings" message={error} onRetry={load} />;
  }

  const passwordRules = [
    policy?.passwordRequireUpper && 'uppercase',
    policy?.passwordRequireNumber && 'numbers',
    policy?.passwordRequireSymbol && 'symbols',
  ].filter(Boolean) as string[];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <SettingsPageHeader
        title="Security & Access"
        description="Manage staff roles, permission assignments, and school-level audit history."
        actions={
          canManage && (
            <Link href="/dashboard/users">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Manage Users</Button>
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles & Permissions */}
        <SettingsSection
          title="Roles & Permissions"
          icon={ShieldCheck}
          actions={<Badge variant="default" className="text-[10px]">School-level</Badge>}
        >
          <p className="text-sm text-warm-600">
            Define staff roles and assign permissions for school functions. Teachers and staff only
            access modules assigned to them.
          </p>
          <SettingRow
            label="Staff Roles"
            description="Create and manage staff roles (Teacher, Accountant, Librarian, etc.)."
            icon={Users}
            href="/dashboard/users"
            canManage={canManage}
          />
          <SettingRow
            label="Permission Assignments"
            description="Assign specific permissions to each role for granular access control."
            icon={ShieldCheck}
            href="/dashboard/users"
            canManage={canManage}
          />
          <SettingRow
            label="Account Activation"
            description="Activate or suspend staff and teacher accounts."
            icon={Lock}
            href="/dashboard/users"
            canManage={canManage}
          />
        </SettingsSection>

        {/* Activity History */}
        <SettingsSection
          title="School Activity History"
          icon={FileText}
          actions={<Badge variant="default" className="text-[10px]">Audit Log</Badge>}
        >
          <p className="text-sm text-warm-600">
            Review school-level audit events including staff actions, student changes, and
            configuration updates.
          </p>
          <SettingRow
            label="View Activity Log"
            description="Review recent actions performed within your school workspace."
            icon={FileText}
            href="/dashboard/activity"
            canManage={canManage}
          />
          <SettingRow
            label="Staff Supervision"
            description="Monitor teacher task completion and activity summaries."
            icon={Users}
            href="/dashboard/tasks"
            canManage={canManage}
          />
        </SettingsSection>

        {/* Effective Security Policy */}
        <SettingsSection
          title="Effective Security Policy"
          description="Platform defaults, strengthened by your school's policy where set."
          icon={Lock}
        >
          {policy ? (
            <>
              <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
                <p className="text-[10px] font-bold uppercase text-warm-500">Password Policy</p>
                <p className="text-xs text-warm-600 mt-1">
                  Minimum {policy.passwordMinLength ?? '—'} characters
                  {passwordRules.length > 0 ? `; require ${passwordRules.join(', ')}` : '; no complexity rules'}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
                <p className="text-[10px] font-bold uppercase text-warm-500">Sessions</p>
                <p className="text-xs text-warm-600 mt-1">
                  {policy.idleTimeoutMinutes ?? '—'} min idle timeout ·{' '}
                  {policy.sessionTimeoutMinutes ?? '—'} min session timeout · max{' '}
                  {policy.maxConcurrentSessions ?? '—'} concurrent
                </p>
              </div>
              <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
                <p className="text-[10px] font-bold uppercase text-warm-500">Lockout</p>
                <p className="text-xs text-warm-600 mt-1">
                  {policy.lockoutThreshold ?? '—'} failed attempts locks the account for{' '}
                  {policy.lockoutDurationMinutes ?? '—'} minutes
                </p>
              </div>
              <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
                <p className="text-[10px] font-bold uppercase text-warm-500">MFA Enforcement</p>
                <p className="text-xs text-warm-600 mt-1">
                  {MFA_LABELS[String(policy.mfaEnforcement)] || policy.mfaEnforcement || 'Not set'}
                  {' — '}enforced by the platform administrator.
                </p>
              </div>
            </>
          ) : (
            <div className="flex items-start gap-3 rounded-lg border border-warm-200 bg-ivory-50 p-3">
              <AlertCircle size={16} className="text-warm-400 shrink-0 mt-0.5" />
              <p className="text-xs text-warm-600">
                No security policy could be read from the server. Retry to load the effective policy.
              </p>
              <Button variant="outline" size="xs" onClick={load}>Retry</Button>
            </div>
          )}
        </SettingsSection>

        {/* Platform Controls */}
        <Card className="border-terracotta-200 bg-terracotta-50/50 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-terracotta-700" /> Platform Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-terracotta-700 mb-3">
              Platform-wide security configuration, global audit monitoring, and cross-school user
              administration are managed exclusively by the Platform Super Admin.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-terracotta-100/50 border border-terracotta-200/50 text-xs text-terracotta-700">
                <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                <span>Security policy is read-only here: school settings can only strengthen platform defaults.</span>
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
