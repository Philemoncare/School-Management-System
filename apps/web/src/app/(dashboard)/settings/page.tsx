'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import {
  Settings,
  Building2,
  Mail,
  Phone,
  MapPin,
  Globe,
  ShieldCheck,
  Clock,
  Layers,
  Book,
  Users,
  GraduationCap,
  PiggyBank,
  CreditCard,
  Wallet,
  FileText,
  AlertCircle,
  Bell,
  Smartphone,
  Activity,
  Lock,
  File,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const SETTINGS_GROUPS = [
  {
    id: 'school-info',
    label: 'School Information',
    icon: Building2,
    description: 'School name, logo, branding, address and contact details.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'],
  },
  {
    id: 'academic-config',
    label: 'Academic Configuration',
    icon: Clock,
    description: 'Academic years, terms, classes, sections, subjects and grading.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'],
  },
  {
    id: 'staff-management',
    label: 'Staff & User Management',
    icon: Users,
    description: 'Staff accounts, teacher accounts, roles, permissions and invitations.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'HR_OFFICER'],
  },
  {
    id: 'student-config',
    label: 'Student Management',
    icon: GraduationCap,
    description: 'Admission settings, student numbering, enrollment and status options.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL', 'RECEPTIONIST'],
  },
  {
    id: 'finance-settings',
    label: 'Finance Settings',
    icon: PiggyBank,
    description: 'Fee structures, payment categories, invoice and receipt configuration.',
    roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'],
  },
  {
    id: 'communication-settings',
    label: 'Communication Settings',
    icon: Mail,
    description: 'SMS and email preferences, notification settings, message templates.',
    roles: ['SCHOOL_ADMIN', 'ADMIN'],
  },
  {
    id: 'security-access',
    label: 'Security & Access',
    icon: Lock,
    description: 'Role management, permission assignments, login and session settings.',
    roles: ['SCHOOL_ADMIN', 'ADMIN'],
  },
];

const GROUP_PAGES: Record<string, { href: string; label: string; icon: any }> = {
  'school-info': { href: '/dashboard/settings/profile', label: 'School Profile', icon: Building2 },
  'academic-config': { href: '/dashboard/settings/academic', label: 'Academic Configuration', icon: Clock },
  'staff-management': { href: '/dashboard/settings/staff', label: 'Staff & Users', icon: Users },
  'student-config': { href: '/dashboard/settings/students', label: 'Student Configuration', icon: GraduationCap },
  'finance-settings': { href: '/dashboard/settings/finance', label: 'Finance Configuration', icon: PiggyBank },
  'communication-settings': { href: '/dashboard/settings/communication', label: 'Communication', icon: Mail },
  'security-access': { href: '/dashboard/settings/security', label: 'Security & Access', icon: Lock },
};

export default function SettingsCenter() {
  const { user } = useAuth();
  const activeSchoolId = localStorage.getItem('schoolId');
  const roles = user ? collectUserRoles(user, activeSchoolId || undefined) : [];
  const canManageSettings = roles.some(
    (r) => ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'].includes(r),
  );

  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/schools/me`)
      .then(setSchool)
      .catch((err) => setError(err.message || 'Unable to load school profile'))
      .finally(() => setLoading(false));
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
      <div className="flex h-screen items-center justify-center bg-ivory-50">
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-6 py-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      </div>
    );
  }

  const visibleGroups = SETTINGS_GROUPS.filter((g) =>
    g.roles.some((r) => roles.includes(r)),
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            School Settings Center
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Manage your school's operational configuration. Changes are saved to your school
            workspace and take effect immediately.
          </p>
        </div>
        {canManageSettings && (
          <Button
            asChild
            href="/dashboard/settings/profile"
            leftIcon={<Settings className="w-4 h-4" />}
          >
            Go to Profile
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      {school && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-charcoal-900">
                  {school.name}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-warm-400 uppercase tracking-wider">
                {school.code}
              </p>
              <p className="mt-1 text-sm text-warm-500">
                {school.email || 'No email on file'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-charcoal-900">
                  {school.status || 'ACTIVE'}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-warm-400 uppercase tracking-wider">
                School Status
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl sm:text-4xl font-bold text-charcoal-900">
                  {school.currency || 'USD'}
                </span>
              </div>
              <p className="mt-2 text-xs font-semibold text-warm-400 uppercase tracking-wider">
                Default Currency
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {visibleGroups.map((group) => {
          const page = GROUP_PAGES[group.id];
          return (
            <Card
              key={group.id}
              className="cursor-pointer hover:border-forest-200 hover:shadow-md transition-all group"
              onClick={() => {
                if (page) window.location.href = page.href;
              }}
            >
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
                  <ArrowRight className="w-4 h-4 text-warm-300 group-hover:text-forest-700 transition-all" />
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Button
                  asChild
                  href={page ? page.href : '#'}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-xs"
                >
                  Open {group.label}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="bg-sage-50 border border-sage-100 rounded-xl p-6">
        <h3 className="text-xs font-bold uppercase tracking-wide text-forest-700 mb-4">
          About This Settings Center
        </h3>
        <p className="text-sm text-warm-600 mb-4">
          All settings in this center are stored against your school's workspace record
          ({school?.name}). Changes here affect the relevant modules across your school
          — academics, staff, students, finance, communication, and security.
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