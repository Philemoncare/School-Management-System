'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  ClipboardList,
  History,
  LayoutDashboard,
  MapPin,
  Tags,
} from 'lucide-react';

const TABS = [
  { label: 'Overview', href: '/inventory', icon: LayoutDashboard },
  { label: 'Items', href: '/inventory/items', icon: Box },
  { label: 'Categories', href: '/inventory/categories', icon: Tags },
  { label: 'Locations', href: '/inventory/locations', icon: MapPin },
  { label: 'Movements', href: '/inventory/movements', icon: History },
  { label: 'Adjust Stock', href: '/inventory/adjust', icon: ClipboardList },
];

export function InventoryNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Inventory sections"
      className="flex gap-1 overflow-x-auto rounded-xl border border-warm-200 bg-card p-1 shadow-xs"
    >
      {TABS.map((tab) => {
        const active =
          tab.href === '/inventory'
            ? pathname === '/inventory'
            : pathname === tab.href || pathname.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30 ${
              active
                ? 'bg-forest-800 text-ivory-50'
                : 'text-warm-600 hover:bg-warm-100 hover:text-charcoal-900'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
