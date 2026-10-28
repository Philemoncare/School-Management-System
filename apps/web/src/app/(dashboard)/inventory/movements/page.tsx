'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { InventoryNav } from '@/components/inventory/inventory-nav';
import {
  ArrowLeft,
  History,
  Loader2,
  RefreshCw,
  Search,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface Movement {
  id: string;
  quantity: number;
  type: string;
  reason?: string | null;
  reference?: string | null;
  timestamp: string;
  item?: { id: string; name: string; code: string } | null;
  location?: { name: string } | null;
  user?: { firstName: string; lastName: string } | null;
}

const OUTBOUND_TYPES = new Set([
  'ISSUE',
  'TRANSFER_OUT',
  'ADJUSTMENT_OUT',
  'DAMAGE',
  'LOSS',
]);

const TYPE_OPTIONS = [
  { value: 'ALL', label: 'All movement types' },
  { value: 'RECEIPT', label: 'Receipt' },
  { value: 'ISSUE', label: 'Issue' },
  { value: 'RETURN', label: 'Return' },
  { value: 'ADJUSTMENT_IN', label: 'Adjustment in' },
  { value: 'ADJUSTMENT_OUT', label: 'Adjustment out' },
  { value: 'TRANSFER_IN', label: 'Transfer in' },
  { value: 'TRANSFER_OUT', label: 'Transfer out' },
  { value: 'DAMAGE', label: 'Damage' },
  { value: 'LOSS', label: 'Loss' },
  { value: 'FOUND', label: 'Found' },
  { value: 'COUNT_CORRECTION', label: 'Count correction' },
];

export default function InventoryMovementsPage() {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [type, setType] = useState('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/inventory/movements');
      setMovements(Array.isArray(data) ? data : data?.items ?? []);
    } catch (err: any) {
      setMovements([]);
      setError(err?.message || 'Could not load stock movements.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return movements.filter((movement) => {
      if (type !== 'ALL' && movement.type !== type) return false;
      if (!needle) return true;
      return (
        (movement.item?.name ?? '').toLowerCase().includes(needle) ||
        (movement.item?.code ?? '').toLowerCase().includes(needle) ||
        (movement.reason ?? '').toLowerCase().includes(needle) ||
        (movement.location?.name ?? '').toLowerCase().includes(needle)
      );
    });
  }, [movements, search, type]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/inventory"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
          >
            <ArrowLeft size={14} /> Inventory overview
          </Link>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <History className="text-forest-700" size={26} /> Stock Movements
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Audit trail of every receipt, issue and correction recorded for this school.
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
          <Link href="/inventory/adjust">
            <Button size="sm" leftIcon={<TrendingUp size={14} />}>
              Record movement
            </Button>
          </Link>
        </div>
      </div>

      <InventoryNav />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          type="search"
          aria-label="Search movements"
          placeholder="Search by item, location or reason…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16} />}
        />
        <Select
          aria-label="Filter by movement type"
          value={type}
          options={TYPE_OPTIONS}
          onChange={(event) => setType(event.target.value)}
        />
      </div>

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

      {loading && movements.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading movements…
        </div>
      ) : movements.length === 0 && !error ? (
        <EmptyState
          icon={<History className="h-8 w-8" />}
          title="No stock movements yet"
          description="Receipts, issues and corrections will appear here once recorded."
          actionButton={
            <Link href="/inventory/adjust">
              <Button leftIcon={<TrendingUp size={14} />}>Record first movement</Button>
            </Link>
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No movements match these filters"
          description="Change the search text or movement type to see other records."
          actionButton={
            <Button
              variant="outline"
              onClick={() => {
                setSearch('');
                setType('ALL');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Stock movements</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Item', 'Type', 'Quantity', 'Location', 'Reason', 'Recorded', 'By'].map(
                    (heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className="whitespace-nowrap px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6"
                      >
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {visible.map((movement) => {
                  const outbound = OUTBOUND_TYPES.has(movement.type);
                  return (
                    <tr key={movement.id} className="transition-colors hover:bg-sage-50/30">
                      <td className="px-4 py-3.5 sm:px-6">
                        {movement.item?.id ? (
                          <Link
                            href={`/inventory/items/${movement.item.id}`}
                            className="text-sm font-semibold text-charcoal-900 hover:text-forest-700 hover:underline"
                          >
                            {movement.item.name}
                          </Link>
                        ) : (
                          <span className="text-sm font-semibold text-charcoal-900">Item</span>
                        )}
                        <p className="font-mono text-[11px] font-semibold uppercase text-warm-400">
                          {movement.item?.code ?? '—'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            outbound
                              ? 'bg-danger-100 text-danger-700'
                              : 'bg-success-100 text-success-800'
                          }`}
                        >
                          {outbound ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                          {movement.type.replaceAll('_', ' ')}
                        </span>
                      </td>
                      <td
                        className={`whitespace-nowrap px-4 py-3.5 text-sm font-bold sm:px-6 ${
                          outbound ? 'text-danger-600' : 'text-forest-700'
                        }`}
                      >
                        {outbound ? '−' : '+'}
                        {Math.abs(movement.quantity)}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-warm-600 sm:px-6">
                        {movement.location?.name ?? '—'}
                      </td>
                      <td className="max-w-xs px-4 py-3.5 text-xs text-warm-500 sm:px-6">
                        <span className="line-clamp-2">{movement.reason || '—'}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-warm-500 sm:px-6">
                        {new Date(movement.timestamp).toLocaleString()}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-warm-500 sm:px-6">
                        {movement.user
                          ? `${movement.user.firstName} ${movement.user.lastName}`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
            Showing {visible.length} of {movements.length} movement
            {movements.length === 1 ? '' : 's'}.
          </div>
        </section>
      )}
    </div>
  );
}
