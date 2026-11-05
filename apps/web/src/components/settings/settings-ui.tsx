'use client';

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Shared building blocks that define the SchooMA Settings standard.
 *
 * Every settings page must use:
 *  - useSettingsAccess() for role gating (never inline collectUserRoles copies)
 *  - <SettingsPageHeader> for the page title/description/actions row
 *  - <SettingsSection> for each grouped card (never hand-rolled section markup)
 *  - <SettingRow> for "opens another page" links (single owner of that row)
 *  - <SettingsLoading> / <SettingsError> for initial states
 *  - <SettingsNotice> for save success/error banners
 */

/** Roles that may modify school settings unless a page narrows/widens them. */
export const DEFAULT_SETTINGS_ROLES = ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'];

/**
 * Standard access check for Settings pages, resolved against the active
 * school so memberships from other schools never grant access here.
 */
export function useSettingsAccess(allowedRoles: string[] = DEFAULT_SETTINGS_ROLES) {
  const { user } = useAuth();
  const activeSchoolId =
    typeof window !== 'undefined' ? localStorage.getItem('schoolId') : null;
  const roles = user ? collectUserRoles(user, activeSchoolId || undefined) : [];
  const canManage = roles.some((r) => allowedRoles.includes(r));
  return { roles, canManage };
}

export function SettingsPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
          {title}
        </h1>
        {description && (
          <p className="text-warm-500 font-medium mt-1">{description}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SettingsSection({
  title,
  description,
  icon: Icon,
  actions,
  children,
}: {
  title: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
        <div className="flex items-start gap-2">
          {Icon && <Icon className="w-5 h-5 mt-0.5 text-forest-700" />}
          <div>
            <CardTitle>{title}</CardTitle>
            {description && (
              <p className="text-xs text-warm-500 mt-1">{description}</p>
            )}
          </div>
        </div>
        {actions}
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  );
}

/**
 * One navigable sub-setting inside a settings section. The single canonical
 * implementation (previously duplicated across four settings pages).
 */
export function SettingRow({
  label,
  description,
  icon: Icon,
  href,
  canManage,
}: {
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  canManage: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg border border-warm-200 hover:bg-forest-50/50 transition-all"
    >
      <Icon className="w-4 h-4 text-warm-500 shrink-0" />
      <span className="flex-1">
        <span className="block text-sm font-medium text-charcoal-900">{label}</span>
        <span className="block text-[10px] text-warm-500">{description}</span>
      </span>
      {!canManage && (
        <span className="text-[10px] font-bold uppercase text-warm-400">View only</span>
      )}
      <span className="text-[10px] font-bold text-warm-400">→</span>
    </Link>
  );
}

export function SettingsLoading({ label = 'Loading settings…' }: { label?: string }) {
  return (
    <div
      className="flex h-screen items-center justify-center bg-ivory-50"
      role="status"
      aria-label={label}
    >
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700" />
    </div>
  );
}

export function SettingsError({
  title = 'Unable to load settings',
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
        <h2 className="text-lg font-bold text-danger-800 mb-2">{title}</h2>
        <p className="text-danger-700 mb-4">{message}</p>
        {onRetry && <Button onClick={onRetry}>Retry</Button>}
      </div>
    </div>
  );
}

export function SettingsNotice({
  kind,
  message,
}: {
  kind: 'error' | 'success';
  message: string;
}) {
  const styles =
    kind === 'error'
      ? 'border-danger-200 bg-danger-50 text-danger-700'
      : 'border-success-200 bg-success-50 text-success-700';
  return (
    <div
      className={`rounded-xl border p-4 text-sm font-semibold ${styles}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      {message}
    </div>
  );
}
