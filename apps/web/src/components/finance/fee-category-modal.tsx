'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { showFeedback } from '@/components/layout/global-feedback';
import type { FeeCategory } from './fee-structure-form';

interface Props {
  category?: FeeCategory;
  onClose: () => void;
  onSaved: (category: FeeCategory) => void;
}

export function FeeCategoryModal({ category, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: category?.name ?? '',
    code: category?.code ?? '',
    description: (category as FeeCategory & { description?: string | null })?.description ?? '',
    isActive: category?.isActive ?? true,
  });
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
      const saved = await apiFetch(
        category ? `/finance/fee-categories/${category.id}` : '/finance/fee-categories',
        {
          method: category ? 'PATCH' : 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim() || undefined,
            isActive: form.isActive,
          }),
        },
      );
      showFeedback('SUCCESS', category ? 'Fee category updated.' : 'Fee category created.');
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message || 'Could not save the fee category.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={category ? 'Edit fee category' : 'New fee category'}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="fee-category-form" isLoading={saving}>
            {category ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <form id="fee-category-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <Input
          label="Category name *"
          required
          placeholder="Tuition"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Input
          label="Code *"
          required
          placeholder="TUIT"
          helperText="Codes are unique within this school and are used on invoices."
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })}
        />
        <div className="space-y-1.5">
          <label htmlFor="fee-category-description" className="block text-xs font-semibold text-charcoal-800">
            Description
          </label>
          <textarea
            id="fee-category-description"
            rows={3}
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            placeholder="Optional description shown to accountants."
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>
        <label className="flex items-center gap-2.5 rounded-lg bg-ivory-50 p-3">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-warm-300 text-forest-700 focus:ring-forest-600"
            checked={form.isActive}
            onChange={(event) => setForm({ ...form, isActive: event.target.checked })}
          />
          <span className="text-xs font-medium text-warm-600">
            Active — available when creating fee items and invoices.
          </span>
        </label>
      </form>
    </Modal>
  );
}
