'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  School,
  Globe,
  BookOpen,
  Users,
  GraduationCap,
  DollarSign,
  Mail,
  Shield,
  Zap,
  Hash,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import { useSettingsAccess } from '@/components/settings/settings-ui';

/**
 * Settings module shell.
 *
 * Responsibility split (the Settings standard):
 *  - this layout owns navigation between settings areas only;
 *  - each settings page owns its own title, description and content
 *    (via <SettingsPageHeader>), so titles are never duplicated here.
 */

type SettingsNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  roles?: string[];
};

const NAV_GROUPS: { group: string; items: SettingsNavItem[] }[] = [
  {
    group: 'School',
    items: [
      { label: 'Settings Overview', href: '/settings', icon: Settings },
      { label: 'School Profile', href: '/settings/profile', icon: School, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Academic', href: '/settings/academic', icon: BookOpen, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Staff & Users', href: '/settings/staff', icon: Users, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Students', href: '/settings/students', icon: GraduationCap, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Finance', href: '/settings/finance', icon: DollarSign, roles: ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'] },
      { label: 'Communication', href: '/settings/communication', icon: Mail, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'Security & Access', href: '/settings/security', icon: Shield, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
    ],
  },
  {
    group: 'Platform & Region',
    items: [
      { label: 'Localization', href: '/settings/localization', icon: Globe, roles: ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'] },
      { label: 'Numbering', href: '/settings/numbering', icon: Hash, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'Feature Access', href: '/settings/features', icon: Zap, roles: ['SCHOOL_ADMIN', 'ADMIN'] },
      { label: 'My Account', href: '/profile', icon: Settings },
    ],
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Each nav item declares the roles that may open it; filtering happens below
  // so a user never sees a settings area whose page cannot load their data.
  const { roles } = useSettingsAccess();

  const visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.roles || item.roles.some((r) => roles.includes(r))),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-6 lg:sticky lg:top-8 self-start">
          <div className="flex items-center gap-2 px-1 text-charcoal-900">
            <Settings size={18} className="text-warm-400" />
            <span className="text-sm font-bold uppercase tracking-wide">Settings</span>
          </div>
          {visibleGroups.map((group) => (
            <div key={group.group}>
              <h3 className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-2 px-4">
                {group.group}
              </h3>
              <nav className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    (item.href !== '/settings' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                        active
                          ? 'bg-forest-700 text-white shadow-lg shadow-sage-100'
                          : 'text-warm-600 hover:bg-warm-100'
                      }`}
                    >
                      <item.icon size={16} />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </aside>

        {/* The dashboard shell already renders the <main> landmark. */}
        <div className="lg:col-span-3 min-w-0">{children}</div>
      </div>
    </div>
  );
}
