'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  History,
  Loader2,
  MapPin,
  Package,
  PencilLine,
  RefreshCw,
} from 'lucide-react';

interface Balance {
  id: string;
  onHand: number;
  available: number;
  reserved: number;
  damaged: number;
  location?: { id: string; name: string; code: string } | null;
}

interface Item {
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
  balances: Balance[];
}

interface Movement {
  id: string;
  quantity: number;
  type: string;
  reason?: string | null;
  timestamp: string;
  location?: { name: string } | null;
  user?: { firstName: string; lastName: string } | null;
}

interface Category {
  id: string;
  name: string;
}

const OUTBOUND_TYPES = new Set([
  'ISSUE',
  'TRANSFER_OUT',
  'ADJUSTMENT_OUT',
  'DAMAGE',
  'LOSS',
]);

export default function InventoryItemPage() {
  const params = useParams<{ id: string }>();
  const itemId = params?.id;
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'INVENTORY_OFFICER'].includes(role));

  const [item, setItem] = useState<Item | null>(null);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    if (!itemId) return;
    setLoading(true);
    setError('');
    try {
      const [itemData, movementData, categoryData] = await Promise.all([
        apiFetch(`/inventory/items/${itemId}`),
        apiFetch(`/inventory/movements?itemId=${itemId}`),
        apiFetch('/inventory/categories'),
      ]);
      setItem(itemData);
      setMovements(Array.isArray(movementData) ? movementData : []);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
    } catch (err: any) {
      setItem(null);
      setError(err?.message || 'Could not load this item.');
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !item) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading item…
      </div>
    );
  }

  if (!item) {
    return (
      <div className="space-y-6">
        <Link
          href="/inventory/items"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
        >
          <ArrowLeft size={14} /> Back to items
        </Link>
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
        <EmptyState
          icon={<Package className="h-8 w-8" />}
          title="Item not found"
          description="This item may have been removed, or it belongs to another school."
          actionButton={
            <Link href="/inventory/items">
              <Button variant="outline">Back to items</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const onHand = item.balances.reduce((sum, balance) => sum + balance.onHand, 0);
  const out = item.balances.length > 0 && onHand <= 0;
  const low = !out && onHand > 0 && onHand <= item.reorderLevel;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/inventory/items"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
          >
            <ArrowLeft size={14} /> Back to items
          </Link>
          <h1 className="flex flex-wrap items-center gap-2 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            {item.name}
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                item.status === 'ACTIVE'
                  ? 'bg-success-100 text-success-800'
                  : 'bg-warm-100 text-warm-600'
              }`}
            >
              {item.status}
            </span>
          </h1>
          <p className="mt-0.5 font-mono text-xs font-semibold uppercase text-warm-500">
            {item.code} · {item.category?.name ?? 'Uncategorised'}
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
          <Link href={`/inventory/adjust?itemId=${item.id}`}>
            <Button variant="outline" size="sm" leftIcon={<ClipboardList size={14} />}>
              Record movement
            </Button>
          </Link>
          {canManage && (
            <Button size="sm" onClick={() => setEditing(true)} leftIcon={<PencilLine size={14} />}>
              Edit item
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700"
        >
          {error}
        </div>
      )}

      {(low || out) && (
        <div
          className={`flex items-start gap-2 rounded-xl border p-3 text-xs font-semibold ${
            out
              ? 'border-danger-200 bg-danger-50 text-danger-700'
              : 'border-warning-200 bg-warning-50 text-warning-800'
          }`}
        >
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            {out
              ? 'This item is out of stock. Record a receipt to replenish it.'
              : `Stock is at or below the reorder level of ${item.reorderLevel}. Consider restocking.`}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Detail label="On hand" value={`${onHand} ${item.unitOfMeasure}`} />
        <Detail label="Item type" value={item.itemType.replaceAll('_', ' ')} />
        <Detail label="Reorder level" value={String(item.reorderLevel)} />
        <Detail label="Locations" value={String(item.balances.length)} />
      </div>

      {item.description && (
        <p className="rounded-xl border border-warm-200 bg-card p-4 text-xs leading-relaxed text-warm-600 shadow-xs">
          {item.description}
        </p>
      )}

      <section className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
        <div className="border-b border-warm-100 bg-ivory-50/50 px-5 py-4 sm:px-6">
          <h2 className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
            <MapPin size={16} className="text-forest-700" /> Stock by location
          </h2>
          <p className="text-[11px] font-medium text-warm-500">
            Quantities currently held at each storage location.
          </p>
        </div>
        {item.balances.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState
              icon={<MapPin className="h-8 w-8" />}
              title="No stock recorded"
              description="Record a receipt against a location to start tracking this item."
              actionButton={
                <Link href={`/inventory/adjust?itemId=${item.id}`}>
                  <Button variant="outline" size="sm">
                    Record receipt
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Stock by location for {item.name}</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Location', 'On hand', 'Reserved', 'Available', 'Damaged'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {item.balances.map((balance) => (
                  <tr key={balance.id} className="transition-colors hover:bg-sage-50/30">
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="text-sm font-semibold text-charcoal-900">
                        {balance.location?.name ?? 'Unknown location'}
                      </p>
                      <p className="font-mono text-[11px] font-semibold uppercase text-warm-400">
                        {balance.location?.code ?? '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-sm font-bold text-charcoal-900 sm:px-6">
                      {balance.onHand}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-warm-600 sm:px-6">{balance.reserved}</td>
                    <td className="px-4 py-3.5 text-sm text-warm-600 sm:px-6">
                      {balance.available}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-warm-600 sm:px-6">{balance.damaged}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warm-100 bg-ivory-50/50 px-5 py-4 sm:px-6">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-bold text-charcoal-900">
              <History size={16} className="text-forest-700" /> Movement history
            </h2>
            <p className="text-[11px] font-medium text-warm-500">
              Every receipt, issue and correction for this item.
            </p>
          </div>
          <Link
            href="/inventory/movements"
            className="text-[11px] font-bold uppercase tracking-wide text-forest-700 hover:underline"
          >
            All movements
          </Link>
        </div>
        {movements.length === 0 ? (
          <p className="p-5 text-sm text-warm-500 sm:p-6">
            No movements have been recorded for this item yet.
          </p>
        ) : (
          <ul className="divide-y divide-warm-100">
            {movements.map((movement) => {
              const outbound = OUTBOUND_TYPES.has(movement.type);
              return (
                <li
                  key={movement.id}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal-900">
                      {movement.type.replaceAll('_', ' ')}
                    </p>
                    <p className="truncate text-[11px] font-medium text-warm-500">
                      {movement.location?.name ?? 'Unknown location'}
                      {movement.reason ? ` · ${movement.reason}` : ''}
                    </p>
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
                      {new Date(movement.timestamp).toLocaleString()}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {editing && (
        <EditItemModal
          item={item}
          categories={categories}
          onClose={() => setEditing(false)}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-warm-200 bg-card px-4 py-3 shadow-xs">
      <p className="text-[10px] font-bold uppercase tracking-wide text-warm-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold capitalize text-charcoal-900">{value}</p>
    </div>
  );
}

function EditItemModal({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: Item;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: item.name,
    code: item.code,
    categoryId: item.categoryId,
    itemType: item.itemType,
    unitOfMeasure: item.unitOfMeasure,
    reorderLevel: String(item.reorderLevel),
    status: item.status,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.code.trim() || !form.categoryId) {
      setError('Name, code and category are required.');
      return;
    }
    const reorderLevel = Number(form.reorderLevel);
    if (!Number.isFinite(reorderLevel) || reorderLevel < 0) {
      setError('Reorder level must be zero or more.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/inventory/items/${item.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          categoryId: form.categoryId,
          itemType: form.itemType,
          unitOfMeasure: form.unitOfMeasure,
          reorderLevel,
          status: form.status,
        }),
      });
      showFeedback('SUCCESS', 'Item updated.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not update the item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Edit inventory item"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-item-form" isLoading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-item-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <Input
          label="Item name *"
          required
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Input
          label="Item code *"
          required
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })}
        />
        <Select
          label="Category *"
          required
          value={form.categoryId}
          options={categories.map((category) => ({ value: category.id, label: category.name }))}
          onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            label="Item type"
            value={form.itemType}
            options={[
              { value: 'CONSUMABLE', label: 'Consumable' },
              { value: 'ASSET', label: 'Fixed asset' },
              { value: 'SERVICE', label: 'Service' },
            ]}
            onChange={(event) => setForm({ ...form, itemType: event.target.value })}
          />
          <Input
            label="Unit of measure"
            value={form.unitOfMeasure}
            onChange={(event) => setForm({ ...form, unitOfMeasure: event.target.value })}
          />
          <Input
            label="Reorder level"
            type="number"
            min={0}
            value={form.reorderLevel}
            onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })}
          />
          <Select
            label="Status"
            value={form.status}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          />
        </div>
        <p className="text-[11px] font-medium text-warm-500">
          Archiving hides the item from new stock movements but keeps its history intact.
        </p>
      </form>
    </Modal>
  );
}
