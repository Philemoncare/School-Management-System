'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { InventoryNav } from '@/components/inventory/inventory-nav';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  ArrowLeft,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  Tags,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  parentCategoryId?: string | null;
  parentCategory?: { id: string; name: string } | null;
  _count?: { items: number };
}

export default function InventoryCategoriesPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'INVENTORY_OFFICER'].includes(role));

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/inventory/categories');
      setCategories(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setCategories([]);
      setError(err?.message || 'Could not load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(needle) ||
        category.code.toLowerCase().includes(needle) ||
        (category.description ?? '').toLowerCase().includes(needle),
    );
  }, [categories, search]);

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
            <Tags className="text-forest-700" size={26} /> Item Categories
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Group stock items so reports and stock counts stay meaningful.
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
            <Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              New category
            </Button>
          )}
        </div>
      </div>

      <InventoryNav />

      <div className="w-full max-w-md">
        <Input
          type="search"
          aria-label="Search categories"
          placeholder="Search by name or code…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16} />}
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

      {loading && categories.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading categories…
        </div>
      ) : categories.length === 0 && !error ? (
        <EmptyState
          icon={<Tags className="h-8 w-8" />}
          title="No categories yet"
          description="Create categories such as Stationery, ICT Equipment or Cleaning Supplies before adding items."
          actionButton={
            canManage ? (
              <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
                Create category
              </Button>
            ) : undefined
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No matching categories"
          description="Try a different name or code."
          actionButton={
            <Button variant="outline" onClick={() => setSearch('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <caption className="sr-only">Inventory categories</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Category', 'Parent', 'Items', 'Description', 'Action'].map((heading) => (
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
                {visible.map((category) => (
                  <tr key={category.id} className="transition-colors hover:bg-sage-50/30">
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="text-sm font-semibold text-charcoal-900">{category.name}</p>
                      <p className="mt-0.5 font-mono text-[11px] font-semibold uppercase text-forest-700">
                        {category.code}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-warm-600 sm:px-6">
                      {category.parentCategory?.name ?? '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-charcoal-900 sm:px-6">
                      {category._count?.items ?? 0}
                    </td>
                    <td className="max-w-xs px-4 py-3.5 text-xs text-warm-500 sm:px-6">
                      <span className="line-clamp-2">{category.description || 'No description'}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                      {canManage ? (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setEditCategory(category)}
                          leftIcon={<PencilLine size={12} />}
                        >
                          Edit
                        </Button>
                      ) : (
                        <span className="text-xs text-warm-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
            {visible.length} of {categories.length} categor{categories.length === 1 ? 'y' : 'ies'}.
          </div>
        </section>
      )}

      {createOpen && (
        <CategoryFormModal
          categories={categories}
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {editCategory && (
        <CategoryFormModal
          category={editCategory}
          categories={categories}
          onClose={() => setEditCategory(null)}
          onSaved={() => {
            setEditCategory(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function CategoryFormModal({
  category,
  categories,
  onClose,
  onSaved,
}: {
  category?: Category;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: category?.name ?? '',
    code: category?.code ?? '',
    description: category?.description ?? '',
    parentCategoryId: category?.parentCategoryId ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.code.trim()) {
      setError('Name and code are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(
        category ? `/inventory/categories/${category.id}` : '/inventory/categories',
        {
          method: category ? 'PATCH' : 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim() || undefined,
            parentCategoryId: form.parentCategoryId || undefined,
          }),
        },
      );
      showFeedback('SUCCESS', category ? 'Category updated.' : 'Category created.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the category.');
    } finally {
      setSaving(false);
    }
  }

  const parentOptions = [
    { value: '', label: 'No parent category' },
    ...categories
      .filter((entry) => entry.id !== category?.id)
      .map((entry) => ({ value: entry.id, label: entry.name })),
  ];

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={category ? 'Edit category' : 'New category'}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" isLoading={saving}>
            {category ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={submit} className="space-y-4">
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
        />
        <Input
          label="Code *"
          required
          placeholder="STA"
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })}
        />
        <Select
          label="Parent category"
          value={form.parentCategoryId}
          options={parentOptions}
          onChange={(event) => setForm({ ...form, parentCategoryId: event.target.value })}
        />
        <div className="space-y-1.5">
          <label
            htmlFor="category-description"
            className="block text-xs font-semibold text-charcoal-800"
          >
            Description
          </label>
          <textarea
            id="category-description"
            rows={3}
            placeholder="Optional notes about what belongs in this category."
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
