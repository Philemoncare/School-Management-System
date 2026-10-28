'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { InventoryNav } from '@/components/inventory/inventory-nav';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowLeft,
  Box,
  ClipboardList,
  Loader2,
  MapPin,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface Item {
  id: string;
  name: string;
  code: string;
  unitOfMeasure: string;
  status: string;
  balances: Array<{ onHand: number; available: number; location?: { id: string } | null }>;
}

interface Location {
  id: string;
  name: string;
  code: string;
}

const TYPE_OPTIONS = [
  { value: 'RECEIPT', label: 'Stock in — receipt' },
  { value: 'ISSUE', label: 'Stock out — issue' },
  { value: 'RETURN', label: 'Stock in — returned' },
  { value: 'ADJUSTMENT_IN', label: 'Adjustment in' },
  { value: 'ADJUSTMENT_OUT', label: 'Adjustment out' },
  { value: 'DAMAGE', label: 'Stock out — damaged' },
  { value: 'LOSS', label: 'Stock out — lost' },
  { value: 'FOUND', label: 'Stock in — found' },
  { value: 'COUNT_CORRECTION', label: 'Count correction (in)' },
];

const OUTBOUND_TYPES = new Set([
  'ISSUE',
  'ADJUSTMENT_OUT',
  'DAMAGE',
  'LOSS',
]);

export default function StockAdjustmentPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [form, setForm] = useState({
    itemId: '',
    locationId: '',
    quantity: '1',
    type: 'RECEIPT',
    reason: '',
  });

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [itemsData, locationsData] = await Promise.all([
        apiFetch('/inventory/items'),
        apiFetch('/inventory/locations'),
      ]);
      setItems(Array.isArray(itemsData) ? itemsData : []);
      setLocations(Array.isArray(locationsData) ? locationsData : []);
    } catch (err: any) {
      setItems([]);
      setLocations([]);
      setLoadError(err?.message || 'Could not load items and locations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Allow deep links from an item page to pre-select the item.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('itemId');
    if (requested) {
      setForm((previous) => ({ ...previous, itemId: requested }));
    }
  }, []);

  const selectedItem = items.find((item) => item.id === form.itemId) ?? null;
  const selectedLocation = locations.find((location) => location.id === form.locationId) ?? null;

  const stockAtLocation = useMemo(() => {
    if (!selectedItem || !selectedLocation) return null;
    const balance = selectedItem.balances.find(
      (entry) => entry.location?.id === selectedLocation.id,
    );
    return balance?.onHand ?? 0;
  }, [selectedItem, selectedLocation]);

  const outbound = OUTBOUND_TYPES.has(form.type);
  const quantity = Number(form.quantity);
  const projected =
    stockAtLocation === null || !Number.isFinite(quantity)
      ? null
      : outbound
        ? stockAtLocation - Math.abs(quantity)
        : stockAtLocation + Math.abs(quantity);

  const noItems = !loading && items.length === 0;
  const noLocations = !loading && locations.length === 0;
  const blocked = noItems || noLocations;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving || blocked) return;

    if (!form.itemId || !form.locationId) {
      setFormError('Select both an item and a location.');
      return;
    }
    if (!Number.isFinite(quantity) || quantity === 0) {
      setFormError('Enter a quantity greater than zero.');
      return;
    }
    if (outbound && stockAtLocation !== null && Math.abs(quantity) > stockAtLocation) {
      setFormError(
        `Only ${stockAtLocation} ${selectedItem?.unitOfMeasure ?? 'units'} available at this location.`,
      );
      return;
    }
    if (!form.reason.trim()) {
      setFormError('Add a reason so the audit trail explains this movement.');
      return;
    }

    setSaving(true);
    setFormError('');
    try {
      await apiFetch('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify({
          itemId: form.itemId,
          locationId: form.locationId,
          quantity: Math.abs(quantity),
          type: form.type,
          reason: form.reason.trim(),
        }),
      });
      showFeedback('SUCCESS', 'Stock movement recorded.');
      setForm((previous) => ({ ...previous, quantity: '1', reason: '' }));
      await load();
    } catch (err: any) {
      setFormError(err?.message || 'Could not record the stock movement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/inventory"
          className="rounded-lg border border-warm-200 bg-card p-2 text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to inventory"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-charcoal-900">
            <ClipboardList className="text-forest-700" size={24} /> Adjust Stock
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Receive, issue or correct stock against a location. Every entry is audited.
          </p>
        </div>
      </div>

      <InventoryNav />

      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{loadError}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading items and locations…
        </div>
      ) : blocked ? (
        <EmptyState
          icon={<Box className="h-8 w-8" />}
          title={noItems ? 'No items to move' : 'No stock locations yet'}
          description={
            noItems
              ? 'Create at least one inventory item before recording stock movements.'
              : 'Create a stock location before recording stock movements.'
          }
          actionButton={
            <Link href={noItems ? '/inventory/items/new' : '/inventory/locations'}>
              <Button>{noItems ? 'Create item' : 'Create location'}</Button>
            </Link>
          }
        />
      ) : (
        <form
          onSubmit={submit}
          className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs"
        >
          <div className="space-y-5 p-5 sm:p-6">
            {formError && (
              <p
                role="alert"
                className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700"
              >
                {formError}
              </p>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Select
                label="Item *"
                required
                value={form.itemId}
                options={[
                  { value: '', label: 'Select an item' },
                  ...items
                    .filter((item) => item.status === 'ACTIVE')
                    .map((item) => ({ value: item.id, label: `${item.name} (${item.code})` })),
                ]}
                onChange={(event) => setForm({ ...form, itemId: event.target.value })}
              />
              <Select
                label="Location *"
                required
                value={form.locationId}
                options={[
                  { value: '', label: 'Select a location' },
                  ...locations.map((location) => ({
                    value: location.id,
                    label: `${location.name} (${location.code})`,
                  })),
                ]}
                onChange={(event) => setForm({ ...form, locationId: event.target.value })}
              />
              <Select
                label="Movement type *"
                required
                value={form.type}
                options={TYPE_OPTIONS}
                onChange={(event) => setForm({ ...form, type: event.target.value })}
              />
              <Input
                label="Quantity *"
                required
                type="number"
                min={1}
                step={1}
                value={form.quantity}
                onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                helperText={
                  selectedItem ? `Measured in ${selectedItem.unitOfMeasure}.` : 'Whole units only.'
                }
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="movement-reason"
                className="block text-xs font-semibold text-charcoal-800"
              >
                Reason / reference *
              </label>
              <textarea
                id="movement-reason"
                required
                rows={2}
                placeholder="e.g. Term 1 stationery delivery, requisition #214"
                className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
                value={form.reason}
                onChange={(event) => setForm({ ...form, reason: event.target.value })}
              />
            </div>

            {selectedItem && selectedLocation && (
              <dl className="grid grid-cols-1 gap-3 rounded-xl border border-warm-200 bg-ivory-50 p-4 sm:grid-cols-3">
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-warm-500">
                    Current at {selectedLocation.name}
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-charcoal-900">
                    <MapPin size={14} className="text-warm-400" />
                    {stockAtLocation} {selectedItem.unitOfMeasure}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-warm-500">
                    Direction
                  </dt>
                  <dd
                    className={`mt-0.5 flex items-center gap-1.5 text-sm font-bold ${
                      outbound ? 'text-danger-600' : 'text-forest-700'
                    }`}
                  >
                    {outbound ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    {outbound ? 'Stock out' : 'Stock in'}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-bold uppercase tracking-wide text-warm-500">
                    After this entry
                  </dt>
                  <dd
                    className={`mt-0.5 text-sm font-bold ${
                      projected !== null && projected < 0
                        ? 'text-danger-600'
                        : 'text-charcoal-900'
                    }`}
                  >
                    {projected ?? '—'} {selectedItem.unitOfMeasure}
                  </dd>
                </div>
              </dl>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-warm-100 bg-ivory-50/50 p-4 sm:p-5">
            <Link
              href="/inventory/movements"
              className="text-[11px] font-bold uppercase tracking-wide text-forest-700 hover:underline"
            >
              View movement history
            </Link>
            <Button type="submit" isLoading={saving} leftIcon={<ClipboardList size={16} />}>
              Record movement
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
