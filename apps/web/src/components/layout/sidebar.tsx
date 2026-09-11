'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  GraduationCap,
  CalendarCheck,
  BookOpenCheck,
  FileSpreadsheet,
  CreditCard,
  Library,
  Bus,
  Bell,
  Settings,
  ChevronRight,
  BookMarked,
  ShieldCheck,
  Building2,
  PieChart,
  GitPullRequest,
  Rocket
} from 'lucide-react';

export function Sidebar({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const pathname = usePathname();

  const role = user?.userRoles?.[0]?.role.name;

  const navItems = getNavItems(role);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Brand */}
      <div className="h-16 flex items-center px-8 border-b border-gray-100 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-200">
            <GraduationCap className="text-white" size={22} />
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">EduFlow ERP</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 custom-scrollbar">
        {navItems.map((group: any) => (
          <div key={group.title}>
            <p className="px-4 text-[11px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-4">
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item: any) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl transition-all group ${
                      isActive
                        ? 'bg-blue-50 text-blue-700 shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon size={18} className={isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'} />
                      <span className="text-sm font-semibold">{item.name}</span>
                    </div>
                    {isActive && <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* School Info / Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/50">
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Current School</p>
          <p className="text-sm font-bold text-gray-900 truncate">
            {user?.memberships?.[0]?.school.name || 'Platform Admin'}
          </p>
        </div>
      </div>
    </div>
  );
}

function getNavItems(role: string) {
  if (role === 'SUPER_ADMIN') {
    return [
      {
        title: 'Platform',
        items: [
          { name: 'Dashboard', href: '/super-admin', icon: LayoutDashboard },
          { name: 'Schools', href: '/super-admin/schools', icon: Building2 },
          { name: 'Users', href: '/super-admin/users', icon: Users },
          { name: 'Launch Readiness', href: '/super-admin/launch-readiness', icon: Rocket },
        ]
      },
      {
        title: 'Management',
        items: [
          { name: 'Subscription Plans', href: '/super-admin/plans', icon: ShieldCheck },
          { name: 'Platform Revenue', href: '/super-admin/payments', icon: CreditCard },
          { name: 'Orchestration', href: '/dashboard/operations', icon: GitPullRequest },
          { name: 'System Health', href: '/super-admin/monitoring', icon: PieChart },
        ]
      }
    ];
  }

  if (role === 'TEACHER') {
    return [
      {
        title: 'Workspace',
        items: [
          { name: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
          { name: 'My Classes', href: '/teacher/classes', icon: BookMarked },
          { name: 'My Students', href: '/teacher/students', icon: GraduationCap },
          { name: 'Timetable', href: '/teacher/timetable', icon: Clock },
        ]
      },
      {
        title: 'Academic',
        items: [
          { name: 'Attendance', href: '/teacher/attendance', icon: CalendarCheck },
          { name: 'Assessments', href: '/teacher/assessments', icon: BookOpenCheck },
        ]
      },
      {
        title: 'Communication',
        items: [
          { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
          { name: 'Messages', href: '/dashboard/messages', icon: Users },
        ]
      }
    ];
  }

  if (role === 'ACCOUNTANT') {
    return [
      {
        title: 'Financials',
        items: [
          { name: 'Dashboard', href: '/accountant/dashboard', icon: LayoutDashboard },
          { name: 'Billing Hub', href: '/accountant/billing', icon: FileText },
          { name: 'Invoices', href: '/accountant/invoices', icon: FileSpreadsheet },
          { name: 'Collections', href: '/accountant/payments', icon: CreditCard },
          { name: 'Ledger Audit', href: '/accountant/ledger', icon: History },
        ]
      },
      {
        title: 'Institutional',
        items: [
          { name: 'Fee Structures', href: '/accountant/fees', icon: Layers },
          { name: 'Outstanding', href: '/accountant/outstanding', icon: AlertCircle },
          { name: 'Reports', href: '/accountant/reports', icon: TrendingUp },
        ]
      },
      {
        title: 'Communication',
        items: [
          { name: 'Messages', href: '/dashboard/messages', icon: Users },
        ]
      }
    ];
  }

  // School Level Roles (Admin, Principal, Teacher, etc.)
  const schoolBase = [
    {
      title: 'General',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ]
    },
    {
      title: 'Academic',
      items: [
        { name: 'Students', href: '/dashboard/students', icon: GraduationCap },
        { name: 'Academics', href: '/dashboard/academics', icon: BookMarked },
        { name: 'Attendance', href: '/dashboard/attendance', icon: CalendarCheck },
        { name: 'Assessments', href: '/dashboard/assessments', icon: BookOpenCheck },
        { name: 'Results', href: '/dashboard/results', icon: FileSpreadsheet },
      ]
    },
    {
      title: 'Operations',
      items: [
        { name: 'Finance', href: '/dashboard/finance', icon: CreditCard },
        { name: 'Library', href: '/dashboard/library', icon: Library },
        { name: 'Transport', href: '/dashboard/transport', icon: Bus },
        { name: 'System Ops', href: '/dashboard/operations', icon: ShieldCheck },
      ]
    },
    {
      title: 'Communication',
      items: [
        { name: 'Announcements', href: '/dashboard/announcements', icon: Bell },
        { name: 'Messages', href: '/dashboard/messages', icon: Users },
      ]
    },
    {
      title: 'Management',
      items: [
        { name: 'Users & Staff', href: '/dashboard/users', icon: Users },
        { name: 'Activity Log', href: '/dashboard/activity', icon: History },
        { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
      ]
    }
  ];

  return schoolBase;
}

import { History } from 'lucide-react';
