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
    { label: 'Localization', href: '/settings/localization', icon: <Globe size={16}/> },
  ]},
  { group: 'System', items: [
    { label: 'Features', href: '/settings/features', icon: <Zap size={16}/> },
    { label: 'Numbering', href: '/settings/numbering', icon: <Hash size={16}/> },
    { label: 'Account Profile', href: '/profile', icon: <Shield size={16}/> },
  ]}
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
          <Settings size={32} className="text-warm-400" />
          Settings Center
        </h1>
        <p className="text-warm-500 font-medium mt-1">Configure your school platform and operational policies.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1 space-y-8">
          {MENU_ITEMS.map((group) => (
            <div key={group.group}>
              <h3 className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-4 px-4">{group.group}</h3>
              <nav className="space-y-1">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      pathname === item.href || (item.href !== '/settings' && pathname.startsWith(item.href))
                        ? 'bg-forest-700 text-white shadow-lg shadow-sage-100'
                        : 'text-warm-600 hover:bg-warm-100'
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
           <div className="bg-card rounded-3xl p-8 shadow-sm border border-warm-100 min-h-[600px]">
              {children}
           </div>
        </main>
      </div>
    </div>
  );
}


