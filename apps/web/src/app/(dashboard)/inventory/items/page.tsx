'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { InventoryNav } from '@/components/inventory/inventory-nav';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Box,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Tags,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  unitOfMeasure: string;
  itemType: string;
  reorderLevel: number;
  status: string;
  categoryId: string;
  category?: { id: string; name: string } | null;
  balances: Array<{ onHand: number; available: number }>;
}

interface Category {
  id: string;
  name: string;
  code: string;
}

type StockFilter = 'ALL' | 'LOW' | 'OUT' | 'OK';

export default function InventoryItemsPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'INVENTORY_OFFICER'].includes(role));

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('ALL');
  const [stock, setStock] = useState<StockFilter>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [itemsData, categoriesData] = await Promise.all([
        apiFetch('/inventory/items'),
        apiFetch('/inventory/categories'),
      ]);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err: any) {
      setItems([]);
      setError(err?.message || 'Could not load inventory items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // The dashboard links here with ?status=LOW / ?status=OUT.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('status')?.toUpperCase();
    if (requested && ['LOW', 'OUT', 'OK'].includes(requested)) {
      setStock(requested as StockFilter);
    }
  }, []);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (categoryId !== 'ALL' && item.categoryId !== categoryId) return false;
      const onHand = item.balances.reduce((sum, balance) => sum + balance.onHand, 0);
      const out = item.balances.length > 0 && onHand <= 0;
      const low = !out && onHand > 0 && onHand <= item.reorderLevel;
      if (stock === 'OUT' && !out) return false;
      if (stock === 'LOW' && !low) return false;
      if (stock === 'OK' && (out || low)) return false;
      if (!needle) return true;
      return (
        item.name.toLowerCase().includes(needle) ||
        item.code.toLowerCase().includes(needle) ||
        (item.category?.name ?? '').toLowerCase().includes(needle)
      );
    });
  }, [items, search, categoryId, stock]);

  const filtersActive = Boolean(search) || categoryId !== 'ALL' || stock !== 'ALL';

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
            <Box className="text-forest-700" size={26} /> Inventory Items
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Catalogue of stock, consumables and materials used by the school.
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
          <Link href="/inventory/categories">
            <Button variant="outline" size="sm" leftIcon={<Tags size={14} />}>
              Categories
            </Button>
          </Link>
          {canManage && (
            <Link href="/inventory/items/new">
              <Button size="sm" leftIcon={<Plus size={16} />}>
                New item
              </Button>
            </Link>
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Input
          type="search"
          aria-label="Search items"
          placeholder="Search by name, code or category…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16} />}
        />
        <Select
          aria-label="Filter by category"
          value={categoryId}
          options={[
            { value: 'ALL', label: 'All categories' },
            ...categories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
          onChange={(event) => setCategoryId(event.target.value)}
        />
        <Select
          aria-label="Filter by stock level"
          value={stock}
          options={[
            { value: 'ALL', label: 'All stock levels' },
            { value: 'LOW', label: 'Low stock only' },
            { value: 'OUT', label: 'Out of stock only' },
            { value: 'OK', label: 'Healthy stock only' },
          ]}
          onChange={(event) => setStock(event.target.value as StockFilter)}
        />
      </div>

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading items…
        </div>
      ) : items.length === 0 && !error ? (
        <EmptyState
          icon={<Box className="h-8 w-8" />}
          title="No inventory items yet"
          description="Create a category first, then add the items the school stocks."
          actionButton={
            canManage ? (
              <Link href="/inventory/items/new">
                <Button leftIcon={<Plus size={16} />}>Add first item</Button>
              </Link>
            ) : undefined
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No items match these filters"
          description="Change the search text, category or stock level to see other items."
          actionButton={
            filtersActive ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setCategoryId('ALL');
                  setStock('ALL');
                }}
              >
                Clear filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Inventory items</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Item', 'Category', 'On hand', 'Unit', 'Status', 'Action'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6 ${
                        heading === 'Action' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {visible.map((item) => {
                  const onHand = item.balances.reduce((sum, balance) => sum + balance.onHand, 0);
                  const out = item.balances.length > 0 && onHand <= 0;
                  const low = !out && onHand > 0 && onHand <= item.reorderLevel;
                  return (
                    <tr key={item.id} className="transition-colors hover:bg-sage-50/30">
                      <td className="px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warm-100 text-warm-500">
                            <Box size={16} />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-charcoal-900">
                              {item.name}
                            </p>
                            <p className="mt-0.5 font-mono text-[11px] font-semibold uppercase text-warm-400">
                              {item.code}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <span className="rounded-lg bg-warm-100 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-warm-600">
                          {item.category?.name ?? 'Uncategorised'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-sm font-bold ${
                              out ? 'text-danger-600' : low ? 'text-warning-700' : 'text-forest-700'
                            }`}
                          >
                            {onHand}
                          </span>
                          {(low || out) && (
                            <AlertTriangle
                              size={13}
                              className={out ? 'text-danger-500' : 'text-warning-500'}
                              aria-label={out ? 'Out of stock' : 'Below reorder level'}
                            />
                          )}
                        </div>
                        <p className="text-[11px] font-medium text-warm-400">
                          Reorder at {item.reorderLevel}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-[11px] font-bold uppercase text-warm-500 sm:px-6">
                        {item.unitOfMeasure}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                            item.status === 'ACTIVE'
                              ? 'bg-success-100 text-success-800'
                              : 'bg-warm-100 text-warm-600'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                        <Link
                          href={`/inventory/items/${item.id}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-forest-700 hover:underline"
                        >
                          View <ArrowRight size={12} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
            Showing {visible.length} of {items.length} item{items.length === 1 ? '' : 's'}.
          </div>
        </section>
      )}
    </div>
  );
}
