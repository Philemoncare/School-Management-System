'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  Activity,
  Building2,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  Hash,
  Lock,
  Mail,
  PiggyBank,
  Settings,
  Smartphone,
  Users,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  SettingsError,
  SettingsLoading,
  SettingsPageHeader,
  useSettingsAccess,
} from '@/components/settings/settings-ui';

/**
 * Settings hub: one entry per settings area, filtered by the user's roles in
 * the active school. Each area is edited on its own page (see settings layout).
 */

type SettingsGroup = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  description: string;
  roles: string[];
};

const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'school-info',
    label: 'School Profile',
    href: '/settings/profile',
    icon: Building2,
    description: 'School name, logo, branding, address and contact details.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'],
  },
  {
    id: 'academic-config',
    label: 'Academic Configuration',
    href: '/settings/academic',
    icon: Clock,
    description: 'Academic years, terms, classes, sections and subjects.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'],
  },
  {
    id: 'staff-management',
    label: 'Staff & User Management',
    href: '/settings/staff',
    icon: Users,
    description: 'Staff and teacher accounts, roles, permissions and invitations.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'],
  },
  {
    id: 'student-config',
    label: 'Student Management',
    href: '/settings/students',
    icon: GraduationCap,
    description: 'Admissions, student numbering, enrollment and student records.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'],
  },
  {
    id: 'finance-settings',
    label: 'Finance Settings',
    href: '/settings/finance',
    icon: PiggyBank,
    description: 'Fee structures, invoices, payments and receipts.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  },
  {
    id: 'communication-settings',
    label: 'Communication Settings',
    href: '/settings/communication',
    icon: Mail,
    description: 'SMS credits, messaging channels and announcements.',
    roles: ['SCHOOL_ADMIN', 'ADMIN'],
  },
  {
    id: 'security-access',
    label: 'Security & Access',
    href: '/settings/security',
    icon: Lock,
    description: 'Roles, permissions, activity history and the effective security policy.',
    roles: ['SCHOOL_ADMIN', 'ADMIN'],
  },
  {
    id: 'localization',
    label: 'Localization & Region',
    href: '/settings/localization',
    icon: Globe,
    description: 'Date, time and week formatting preferences for your school.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'],
  },
  {
    id: 'numbering',
    label: 'Numbering & Sequences',
    href: '/settings/numbering',
    icon: Hash,
    description: 'Prefixes, padding and year inclusion for generated identifiers.',
    roles: ['SCHOOL_ADMIN', 'ADMIN'],
  },
  {
    id: 'feature-access',
    label: 'Feature Access',
    href: '/settings/features',
    icon: Zap,
    description: 'Modules enabled for your school by the platform administrator.',
    roles: ['SCHOOL_ADMIN', 'ADMIN'],
  },
];

export default function SettingsCenter() {
  const { roles, canManage: canManageSettings } = useSettingsAccess();

  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFetch('/schools/me')
      .then(setSchool)
      .catch((err) => setError(err.message || 'Unable to load school profile'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SettingsLoading label="Loading settings center" />;
  if (error)
    return <SettingsError title="Unable to load settings" message={error} onRetry={load} />;

  const visibleGroups = SETTINGS_GROUPS.filter((g) =>
    g.roles.some((r) => roles.includes(r)),
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <SettingsPageHeader
        title="School Settings Center"
        description="Manage your school's operational configuration. Changes are saved to your school workspace and take effect immediately."
        actions={
          canManageSettings && (
            <Link href="/settings/profile">
              <Button leftIcon={<Settings className="w-4 h-4" />}>Edit School Profile</Button>
            </Link>
          )
        }
      />

      {school && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-lg font-bold text-charcoal-900 truncate">{school.name}</p>
              <p className="mt-2 text-xs font-semibold text-warm-400 uppercase tracking-wider">
                {school.code}
              </p>
              <p className="mt-1 text-sm text-warm-500">{school.email || 'No email on file'}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-lg font-bold text-charcoal-900">{school.status || 'ACTIVE'}</p>
              <p className="mt-2 text-xs font-semibold text-warm-400 uppercase tracking-wider">
                School Status
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-lg font-bold text-charcoal-900">{school.currency || 'USD'}</p>
              <p className="mt-2 text-xs font-semibold text-warm-400 uppercase tracking-wider">
                Default Currency
              </p>
              <p className="mt-1 text-sm text-warm-500">{school.timezone || 'UTC'}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleGroups.map((group) => (
          <Link key={group.id} href={group.href} className="group block">
            <Card className="h-full transition-all group-hover:border-forest-200 group-hover:shadow-md">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sage-50 flex items-center justify-center text-forest-700 group-hover:bg-forest-100 group-hover:text-forest-900 transition-all">
                    <group.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-sm font-semibold text-charcoal-900">
                      {group.label}
                    </CardTitle>
                    <CardDescription className="text-[11px] text-warm-500 mt-1">
                      {group.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-[11px] font-bold uppercase tracking-wide text-forest-700">
                  Open settings →
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="bg-sage-50 border border-sage-100 rounded-xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-forest-700 mb-4">
          About This Settings Center
        </h3>
        <p className="text-sm text-warm-600 mb-4">
          All settings in this center are stored against your school's workspace record
          ({school?.name}). Changes affect the relevant modules across your school — academics,
          staff, students, finance, communication, and security.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-warm-500">
          <div className="flex items-center gap-2">
            <Activity className="w-3 h-3" />
            <span>Changes are audited and recorded in school activity history.</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-3 h-3" />
            <span>Role-based access controls who can modify each setting group.</span>
          </div>
          <div className="flex items-center gap-2">
            <Smartphone className="w-3 h-3" />
            <span>Global SMS provider credentials remain with the Platform Super Admin.</span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-3 h-3" />
            <span>Settings persist across refreshes and sign-ins.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
