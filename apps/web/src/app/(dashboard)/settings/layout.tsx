'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Settings,
  School,
  Palette,
  Globe,
  BookOpen,
  CheckSquare,
  Award,
  DollarSign,
  Book,
  Truck,
  Briefcase,
  FileText,
  Bell,
  Shield,
  Zap,
  Hash,
  GitBranch
} from 'lucide-react';

const MENU_ITEMS = [
  { group: 'General', items: [
    { label: 'Basic Info', href: '/settings', icon: <School size={16}/> },
    { label: 'Branding', href: '/settings/branding', icon: <Palette size={16}/> },
    { label: 'Localization', href: '/settings/localization', icon: <Globe size={16}/> },
  ]},
  { group: 'Modules', items: [
    { label: 'Academics', href: '/settings/academic', icon: <BookOpen size={16}/> },
    { label: 'Attendance', href: '/settings/attendance', icon: <CheckSquare size={16}/> },
    { label: 'Examinations', href: '/settings/examinations', icon: <Award size={16}/> },
    { label: 'Finance', href: '/settings/finance', icon: <DollarSign size={16}/> },
    { label: 'Library', href: '/settings/library', icon: <Book size={16}/> },
    { label: 'Transport', href: '/settings/transport', icon: <Truck size={16}/> },
    { label: 'HR & Staff', href: '/settings/hr', icon: <Briefcase size={16}/> },
  ]},
  { group: 'System', items: [
    { label: 'Documents', href: '/settings/documents', icon: <FileText size={16}/> },
    { label: 'Notifications', href: '/settings/notifications', icon: <Bell size={16}/> },
    { label: 'Security', href: '/settings/security', icon: <Shield size={16}/> },
    { label: 'Features', href: '/settings/features', icon: <Zap size={16}/> },
    { label: 'Numbering', href: '/settings/numbering', icon: <Hash size={16}/> },
    { label: 'Workflows', href: '/settings/workflows', icon: <GitBranch size={16}/> },
  ]}
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
          <Settings size={32} className="text-gray-400" />
          Settings Center
        </h1>
        <p className="text-gray-500 font-medium mt-1">Configure your school platform and operational policies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-8">
          {MENU_ITEMS.map((group) => (
            <div key={group.group}>
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-4">{group.group}</h3>
              <nav className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href))
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-100'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          ))}
        </aside>

        <main className="lg:col-span-3">
           <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 min-h-[600px]">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}
