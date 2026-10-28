'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InventoryNav } from '@/components/inventory/inventory-nav';
import {
  AlertTriangle,
  ArrowRight,
  Box,
  ClipboardList,
  History,
  Loader2,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Tags,
  TrendingDown,
  TrendingUp,
  Wrench,
  type LucideIcon,
} from 'lucide-react';

interface Movement {
  id: string;
  quantity: number;
  type: string;
  timestamp: string;
  item?: { name: string; code: string } | null;
  location?: { name: string } | null;
  user?: { firstName: string; lastName: string } | null;
}

interface Dashboard {
  itemCount: number;
  lowStockItems: number;
  outOfStockItems: number;
  recentMovements: Movement[];
  assetCount: number;
  assetsAssigned: number;
  assetsInMaintenance: number;
  locationCount: number;
  categoryCount: number;
}

const OUTBOUND_TYPES = new Set([
  'ISSUE',
  'TRANSFER_OUT',
  'ADJUSTMENT_OUT',
  'DAMAGE',
  'LOSS',
]);

export default function InventoryDashboard() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'INVENTORY_OFFICER'].includes(role));

  const [stats, setStats] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/inventory/dashboard');
      setStats(data);
    } catch (err: any) {
      setStats(null);
      setError(err?.message || 'Could not load the inventory dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const modules = [
    {
      label: 'Items',
      description: 'Catalogue of stock, consumables and materials.',
      href: '/inventory/items',
      icon: Box,
      meta: stats ? `${stats.itemCount} active` : undefined,
    },
    {
      label: 'Categories',
      description: 'Group items so stock reports stay meaningful.',
      href: '/inventory/categories',
      icon: Tags,
      meta: stats ? `${stats.categoryCount} defined` : undefined,
    },
    {
      label: 'Locations',
      description: 'Stores, labs and distribution points.',
      href: '/inventory/locations',
      icon: MapPin,
      meta: stats ? `${stats.locationCount} active` : undefined,
    },
    {
      label: 'Movements',
      description: 'Audit trail of receipts, issuances and corrections.',
      href: '/inventory/movements',
      icon: History,
      meta: stats ? `${stats.recentMovements.length} recent` : undefined,
    },
    {
      label: 'Adjust Stock',
      description: 'Receive, issue or correct stock at a location.',
      href: '/inventory/adjust',
      icon: ClipboardList,
      meta: canManage ? 'Record movement' : 'View only',
    },
    {
      label: 'Asset Register',
      description: 'Fixed assets, assignments and maintenance.',
      href: '/assets',
      icon: Package,
      meta: stats ? `${stats.assetCount} registered` : undefined,
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            Inventory Control
          </h1>
          <p className="mt-1 text-xs font-medium text-warm-500 sm:text-sm">
            Stock levels, storage locations and movement history for this school.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />}
          >
            Refresh
          </Button>
          {canManage && (
            <>
              <Link href="/inventory/adjust">
                <Button variant="outline" size="sm" leftIcon={<ClipboardList size={14} />}>
                  Adjust stock
                </Button>
              </Link>
              <Link href="/inventory/items/new">
                <Button size="sm" leftIcon={<Plus size={16} />}>
                  New item
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <InventoryNav />

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      {loading && !stats ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading inventory…
        </div>
      ) : !stats ? (
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Inventory unavailable"
          description="The inventory summary could not be loaded. Try again in a moment."
          actionButton={
            <Button onClick={load} leftIcon={<RefreshCw size={14} />}>
              Retry
            </Button>
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Active items" value={stats.itemCount} icon={Box} tone="forest" />
            <StatCard
              label="Low stock"
              value={stats.lowStockItems}
              icon={AlertTriangle}
              tone="warning"
              href="/inventory/items?status=LOW"
            />
            <StatCard
              label="Out of stock"
              value={stats.outOfStockItems}
              icon={TrendingDown}
              tone="danger"
              href="/inventory/items?status=OUT"
            />
            <StatCard
              label="In maintenance"
              value={stats.assetsInMaintenance}
              icon={Wrench}
              tone="terracotta"
              href="/assets"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <section className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warm-100 bg-ivory-50/50 px-5 py-4 sm:px-6">
                  <div>
                    <h2 className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
                      <History size={16} className="text-forest-700" /> Recent movements
                    </h2>
                    <p className="text-[11px] font-medium text-warm-500">
                      Latest stock receipts, issuances and corrections.
                    </p>
                  </div>
                  <Link
                    href="/inventory/movements"
                    className="text-[11px] font-bold uppercase tracking-wide text-forest-700 hover:underline"
                  >
                    View all
                  </Link>
                </div>

                {stats.recentMovements.length === 0 ? (
                  <div className="p-5 sm:p-6">
                    <EmptyState
                      icon={<History className="h-8 w-8" />}
                      title="No stock movements yet"
                      description="Record a receipt or issue from the Adjust Stock screen and it will appear here."
                      actionButton={
                        <Link href="/inventory/adjust">
                          <Button variant="outline" size="sm" leftIcon={<ClipboardList size={14} />}>
                            Record movement
                          </Button>
                        </Link>
                      }
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-warm-100">
                    {stats.recentMovements.map((movement) => {
                      const outbound = OUTBOUND_TYPES.has(movement.type);
                      return (
                        <li
                          key={movement.id}
                          className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-sage-50/30 sm:px-6"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                outbound
                                  ? 'bg-danger-50 text-danger-600'
                                  : 'bg-sage-50 text-forest-700'
                              }`}
                            >
                              {outbound ? (
                                <TrendingDown size={16} />
                              ) : (
                                <TrendingUp size={16} />
                              )}
                            </span>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-charcoal-900">
                                {movement.item?.name ?? 'Item'}
                              </p>
                              <p className="truncate text-[11px] font-medium text-warm-500">
                                {movement.type.replaceAll('_', ' ')} ·{' '}
                                {movement.location?.name ?? 'Unknown location'}
                              </p>
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <p
                              className={`text-sm font-bold ${
                                outbound ? 'text-danger-600' : 'text-forest-700'
                              }`}
                            >
                              {outbound ? '−' : '+'}
                              {Math.abs(movement.quantity)}
                            </p>
                            <p className="text-[11px] font-medium text-warm-400">
                              {new Date(movement.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {modules.map((module) => (
                  <Link
                    key={module.href}
                    href={module.href}
                    className="group flex items-center justify-between gap-3 rounded-xl border border-warm-200 bg-card p-4 shadow-xs transition-all hover:border-sage-300 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-50 text-forest-700 transition-colors group-hover:bg-forest-700 group-hover:text-ivory-50">
                        <module.icon size={18} />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-charcoal-900">{module.label}</p>
                        <p className="truncate text-[11px] font-medium text-warm-500">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight
                      size={16}
                      className="shrink-0 text-warm-300 transition-colors group-hover:text-forest-700"
                    />
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-xs">
                <h2 className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
                  <Package size={16} className="text-forest-700" /> Asset management
                </h2>
                <dl className="mt-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-ivory-100 pb-3">
                    <dt className="text-xs font-medium text-warm-500">Registered assets</dt>
                    <dd className="text-sm font-bold text-charcoal-900">{stats.assetCount}</dd>
                  </div>
                  <div className="flex items-center justify-between border-b border-ivory-100 pb-3">
                    <dt className="text-xs font-medium text-warm-500">Assigned</dt>
                    <dd className="text-sm font-bold text-charcoal-900">{stats.assetsAssigned}</dd>
                  </div>
                  <div className="flex items-center justify-between border-b border-ivory-100 pb-3">
                    <dt className="text-xs font-medium text-warm-500">In maintenance</dt>
                    <dd className="text-sm font-bold text-warning-700">
                      {stats.assetsInMaintenance}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-xs font-medium text-warm-500">Active locations</dt>
                    <dd className="text-sm font-bold text-charcoal-900">{stats.locationCount}</dd>
                  </div>
                </dl>
                <Link href="/assets" className="mt-4 block">
                  <Button variant="outline" size="sm" className="w-full">
                    Open asset register
                  </Button>
                </Link>
              </section>

              <section className="rounded-xl bg-charcoal-900 p-5 text-ivory-50 shadow-xs">
                <h2 className="text-sm font-bold">Keeping stock accurate</h2>
                <p className="mt-1 text-xs leading-relaxed text-warm-300">
                  Every receipt, issue and correction is recorded against a location so the stock
                  audit trail stays complete.
                </p>
                <Link
                  href="/inventory/movements"
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-sage-300 hover:text-sage-200"
                >
                  Review audit trail <ArrowRight size={12} />
                </Link>
              </section>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const TONES = {
  forest: 'border-sage-100 bg-sage-50 text-forest-700',
  warning: 'border-warning-100 bg-warning-50 text-warning-700',
  danger: 'border-danger-100 bg-danger-50 text-danger-700',
  terracotta: 'border-terracotta-100 bg-terracotta-50 text-terracotta-700',
} as const;

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  href,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone: keyof typeof TONES;
  href?: string;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-wide text-warm-500">{label}</p>
        <span className={`rounded-lg border p-1.5 ${TONES[tone]}`}>
          <Icon size={14} />
        </span>
      </div>
      <p className="mt-1 text-xl font-bold text-charcoal-900 sm:text-2xl">{value}</p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-xl border border-warm-200 bg-card px-4 py-3 shadow-xs transition-colors hover:border-sage-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30"
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="rounded-xl border border-warm-200 bg-card px-4 py-3 shadow-xs">{content}</div>
  );
}
