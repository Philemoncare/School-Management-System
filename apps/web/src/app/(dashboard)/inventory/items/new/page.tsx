'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowLeft,
  Box,
  Loader2,
  Plus,
  Save,
  Tag,
  Tags,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  code: string;
}

const UNITS = [
  { value: 'piece', label: 'Piece' },
  { value: 'box', label: 'Box' },
  { value: 'ream', label: 'Ream' },
  { value: 'pack', label: 'Pack' },
  { value: 'litre', label: 'Litre' },
  { value: 'kilogram', label: 'Kilogram' },
  { value: 'metre', label: 'Metre' },
  { value: 'set', label: 'Set' },
];

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    code: '',
    categoryId: '',
    itemType: 'CONSUMABLE',
    unitOfMeasure: 'piece',
    reorderLevel: '10',
    description: '',
  });

  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    setCategoryError('');
    try {
      const data = await apiFetch('/inventory/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setCategories([]);
      setCategoryError(err?.message || 'Could not load categories.');
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;

    if (!form.name.trim() || !form.code.trim()) {
      setError('Item name and code are required.');
      return;
    }
    if (!form.categoryId) {
      setError('Select a category for this item.');
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
      await apiFetch('/inventory/items', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          categoryId: form.categoryId,
          itemType: form.itemType,
          unitOfMeasure: form.unitOfMeasure,
          reorderLevel,
          description: form.description.trim() || undefined,
        }),
      });
      showFeedback('SUCCESS', 'Inventory item created.');
      router.push('/inventory/items');
    } catch (err: any) {
      setError(err?.message || 'Could not create the item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/inventory/items"
          className="rounded-lg border border-warm-200 bg-card p-2 text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to items"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-charcoal-900">
            <Box className="text-forest-700" size={24} /> New catalogue item
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Define a stock item, consumable or service that the school tracks.
          </p>
        </div>
      </div>

      <form
        onSubmit={submit}
        className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs"
      >
        <div className="space-y-5 p-5 sm:p-6">
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700"
            >
              {error}
            </p>
          )}

          {categoryError && (
            <div
              role="alert"
              className="flex flex-col gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <span>{categoryError}</span>
              <Button variant="outline" size="xs" onClick={loadCategories}>
                Retry
              </Button>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Item name *"
              required
              placeholder="e.g. A4 Printing Paper"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
            <Input
              label="Item code *"
              required
              placeholder="STA-0001"
              value={form.code}
              onChange={(event) => setForm({ ...form, code: event.target.value })}
            />

            <div className="space-y-1.5">
              <Select
                label="Category *"
                required
                value={form.categoryId}
                options={[
                  { value: '', label: loadingCategories ? 'Loading categories…' : 'Select a category' },
                  ...categories.map((category) => ({
                    value: category.id,
                    label: category.name,
                  })),
                ]}
                onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                disabled={loadingCategories}
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-warm-500">
                  {categories.length === 0 && !loadingCategories
                    ? 'No categories yet — create one to continue.'
                    : `${categories.length} categor${categories.length === 1 ? 'y' : 'ies'} available.`}
                </p>
                <Button
                  type="button"
                  variant="link"
                  size="xs"
                  onClick={() => setCategoryModalOpen(true)}
                  leftIcon={<Plus size={12} />}
                >
                  New category
                </Button>
              </div>
            </div>

            <Select
              label="Item type *"
              required
              value={form.itemType}
              options={[
                { value: 'CONSUMABLE', label: 'Consumable (stocked)' },
                { value: 'ASSET', label: 'Fixed asset (tracked individually)' },
                { value: 'SERVICE', label: 'Service' },
              ]}
              onChange={(event) => setForm({ ...form, itemType: event.target.value })}
            />

            <Select
              label="Unit of measure *"
              required
              value={form.unitOfMeasure}
              options={UNITS}
              onChange={(event) => setForm({ ...form, unitOfMeasure: event.target.value })}
            />

            <Input
              label="Reorder level"
              type="number"
              min={0}
              step={1}
              helperText="Low-stock warnings trigger at or below this quantity."
              value={form.reorderLevel}
              onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="item-description"
              className="block text-xs font-semibold text-charcoal-800"
            >
              Description
            </label>
            <textarea
              id="item-description"
              rows={3}
              placeholder="Optional notes about specification or usage."
              className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
            />
          </div>

          <p className="rounded-lg bg-ivory-50 p-3 text-[11px] font-medium text-warm-500">
            Stock quantities are not entered here. After saving, use{' '}
            <Link href="/inventory/adjust" className="font-bold text-forest-700 hover:underline">
              Adjust Stock
            </Link>{' '}
            to record the initial receipt against a location.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-warm-100 bg-ivory-50/50 p-4 sm:p-5">
          <Link href="/inventory/items">
            <Button variant="outline" disabled={saving}>
              Cancel
            </Button>
          </Link>
          <Button type="submit" isLoading={saving} leftIcon={<Save size={16} />}>
            Save item
          </Button>
        </div>
      </form>

      {categoryModalOpen && (
        <CategoryModal
          onClose={() => setCategoryModalOpen(false)}
          onCreated={async (category) => {
            setCategoryModalOpen(false);
            await loadCategories();
            setForm((previous) => ({ ...previous, categoryId: category.id }));
          }}
        />
      )}

      {loadingCategories && categories.length === 0 && (
        <p className="flex items-center gap-2 text-xs font-medium text-warm-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading categories…
        </p>
      )}
    </div>
  );
}

function CategoryModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (category: Category) => void | Promise<void>;
}) {
  const [form, setForm] = useState({ name: '', code: '', description: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.code.trim()) {
      setError('Category name and code are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await apiFetch('/inventory/categories', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          code: form.code.trim().toUpperCase(),
          description: form.description.trim() || undefined,
        }),
      });
      showFeedback('SUCCESS', 'Category created.');
      await onCreated(created);
    } catch (err: any) {
      setError(err?.message || 'Could not create the category.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New category"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="new-category-form" isLoading={saving}>
            Create category
          </Button>
        </>
      }
    >
      <form id="new-category-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <Input
          label="Name *"
          required
          placeholder="Stationery"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
          leftIcon={<Tags size={16} />}
        />
        <Input
          label="Code *"
          required
          placeholder="STA"
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })}
          leftIcon={<Tag size={16} />}
        />
        <Input
          label="Description"
          placeholder="Optional description"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </form>
    </Modal>
  );
}
