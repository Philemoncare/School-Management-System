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
import { showFeedback } from '@/components/layout/global-feedback';
import {
  FeeCategoryModal,
} from '@/components/finance/fee-category-modal';
import {
  FeeStructureForm,
  type FeeCategory,
  type FeeStructure,
} from '@/components/finance/fee-structure-form';
import {
  Archive,
  ArrowLeft,
  CalendarDays,
  Layers,
  Loader2,
  PencilLine,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Settings,
  Tags,
} from 'lucide-react';

interface Year {
  id: string;
  name: string;
  isCurrent?: boolean;
}

interface CategoryRow extends FeeCategory {
  description?: string | null;
  _count?: { feeStructures: number };
}

type Tab = 'structures' | 'categories';

function money(value: string | number | undefined, currency?: string) {
  const amount = Number(value ?? 0);
  const code = (currency || 'GHS').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  }
}

export default function FeeManagementPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['ACCOUNTANT', 'SCHOOL_ADMIN'].includes(role));

  const [tab, setTab] = useState<Tab>('structures');
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [yearFilter, setYearFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [editStructure, setEditStructure] = useState<FeeStructure | null>(null);
  const [categoryModal, setCategoryModal] = useState<{ category?: FeeCategory } | null>(null);
  const [archivingId, setArchivingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [categoryData, structureData, yearData] = await Promise.all([
        apiFetch('/finance/fee-categories'),
        apiFetch('/finance/fee-structures'),
        apiFetch('/academic-years'),
      ]);
      setCategories(Array.isArray(categoryData) ? categoryData : []);
      setStructures(Array.isArray(structureData) ? structureData : []);
      setYears(Array.isArray(yearData) ? yearData : []);
    } catch (err: any) {
      setCategories([]);
      setStructures([]);
      setYears([]);
      setError(err?.message || 'Could not load fee configuration.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Open the categories tab directly when linked with ?tab=categories.
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    if (requested === 'categories' || requested === 'structures') {
      setTab(requested as Tab);
    }
  }, []);

  const visibleStructures = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return structures.filter((structure) => {
      if (categoryFilter !== 'ALL' && structure.feeCategoryId !== categoryFilter) return false;
      if (yearFilter !== 'ALL' && structure.academicYearId !== yearFilter) return false;
      if (statusFilter !== 'ALL' && structure.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        structure.name.toLowerCase().includes(needle) ||
        (structure.feeCategory?.name ?? '').toLowerCase().includes(needle) ||
        (structure.class?.name ?? 'all classes').toLowerCase().includes(needle) ||
        (structure.academicYear?.name ?? '').toLowerCase().includes(needle)
      );
    });
  }, [structures, search, categoryFilter, yearFilter, statusFilter]);

  const visibleCategories = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter(
      (category) =>
        category.name.toLowerCase().includes(needle) ||
        category.code.toLowerCase().includes(needle) ||
        (category.description ?? '').toLowerCase().includes(needle),
    );
  }, [categories, search]);

  const filtersActive =
    Boolean(search) ||
    categoryFilter !== 'ALL' ||
    yearFilter !== 'ALL' ||
    statusFilter !== 'ALL';

  function resetFilters() {
    setSearch('');
    setCategoryFilter('ALL');
    setYearFilter('ALL');
    setStatusFilter('ALL');
  }

  async function setStructureStatus(structure: FeeStructure, status: FeeStructure['status']) {
    if (archivingId) return;
    if (
      status === 'ARCHIVED' &&
      !window.confirm(
        `Archive “${structure.name}”? It stays on record but cannot be used for new invoices.`,
      )
    ) {
      return;
    }
    setArchivingId(structure.id);
    try {
      await apiFetch(`/finance/fee-structures/${structure.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showFeedback('SUCCESS', status === 'ARCHIVED' ? 'Fee item archived.' : 'Fee item restored.');
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not update the fee item.');
    } finally {
      setArchivingId(null);
    }
  }

  async function toggleCategory(category: CategoryRow) {
    try {
      await apiFetch(`/finance/fee-categories/${category.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !category.isActive }),
      });
      showFeedback(
        'SUCCESS',
        category.isActive ? 'Fee category deactivated.' : 'Fee category activated.',
      );
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not update the fee category.');
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/accountant/dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
          >
            <ArrowLeft size={14} /> Finance dashboard
          </Link>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Layers className="text-forest-700" size={26} /> Fee Configuration
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Define fee categories and the amounts billed to each class or term.
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCategoryModal({})}
                leftIcon={<Tags size={14} />}
              >
                New category
              </Button>
              <Link href="/accountant/fees/new">
                <Button size="sm" leftIcon={<Plus size={16} />}>
                  New fee item
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <nav
        aria-label="Fee configuration sections"
        className="flex gap-1 rounded-xl border border-warm-200 bg-card p-1 shadow-xs"
        role="tablist"
      >
        {(
          [
            { id: 'structures' as Tab, label: 'Fee items', icon: Layers, count: structures.length },
            { id: 'categories' as Tab, label: 'Categories', icon: Tags, count: categories.length },
          ]
        ).map((entry) => {
          const active = tab === entry.id;
          return (
            <button
              key={entry.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(entry.id);
                setSearch('');
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30 ${
                active
                  ? 'bg-forest-800 text-ivory-50'
                  : 'text-warm-600 hover:bg-warm-100 hover:text-charcoal-900'
              }`}
            >
              <entry.icon size={14} />
              {entry.label}
              <span
                className={`rounded-full px-1.5 text-[10px] ${
                  active ? 'bg-forest-700 text-ivory-50' : 'bg-warm-100 text-warm-600'
                }`}
              >
                {entry.count}
              </span>
            </button>
          );
        })}
      </nav>

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

      {tab === 'structures' ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Input
              type="search"
              aria-label="Search fee items"
              placeholder="Search fee items…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              leftIcon={<Search size={16} />}
            />
            <Select
              aria-label="Filter by fee category"
              value={categoryFilter}
              options={[
                { value: 'ALL', label: 'All categories' },
                ...categories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
              onChange={(event) => setCategoryFilter(event.target.value)}
            />
            <Select
              aria-label="Filter by academic year"
              value={yearFilter}
              options={[
                { value: 'ALL', label: 'All academic years' },
                ...years.map((year) => ({ value: year.id, label: year.name })),
              ]}
              onChange={(event) => setYearFilter(event.target.value)}
            />
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              options={[
                { value: 'ALL', label: 'All statuses' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
              onChange={(event) => setStatusFilter(event.target.value)}
            />
          </div>

          {loading && structures.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading fee items…
            </div>
          ) : structures.length === 0 && !error ? (
            <EmptyState
              icon={<Settings className="h-8 w-8" />}
              title="No fee items defined"
              description="Create fee items such as tuition, transport or examination fees before issuing invoices."
              actionButton={
                canManage ? (
                  <Link href="/accountant/fees/new">
                    <Button leftIcon={<Plus size={16} />}>Create first fee item</Button>
                  </Link>
                ) : undefined
              }
            />
          ) : visibleStructures.length === 0 && !error ? (
            <EmptyState
              icon={<Search className="h-8 w-8" />}
              title="No fee items match these filters"
              description="Change the search text, category, year or status to see other fee items."
              actionButton={
                <Button variant="outline" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <section className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-xs">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-warm-200">
                  <caption className="sr-only">Fee items</caption>
                  <thead className="bg-ivory-50">
                    <tr>
                      {['Fee item', 'Category', 'Applies to', 'Amount', 'Due', 'Status', 'Actions'].map(
                        (heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className={`whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6 ${
                              heading === 'Actions' ? 'text-right' : 'text-left'
                            }`}
                          >
                            {heading}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {visibleStructures.map((structure) => {
                      const archived = structure.status === 'ARCHIVED';
                      return (
                        <tr
                          key={structure.id}
                          className={`transition-colors hover:bg-sage-50/30 ${
                            archived ? 'opacity-60' : ''
                          }`}
                        >
                          <td className="px-4 py-3.5 sm:px-6">
                            <p className="text-sm font-semibold text-charcoal-900">{structure.name}</p>
                            <p className="mt-0.5 text-[11px] font-medium text-warm-500">
                              {structure.academicYear?.name ?? 'Year'} ·{' '}
                              {structure.term?.name ?? 'Full year'}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                            <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-warm-600">
                              {structure.feeCategory?.name ?? 'Uncategorised'}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                            <p className="text-xs font-semibold text-charcoal-800">
                              {structure.class?.name ?? 'All classes'}
                            </p>
                            <p className="text-[11px] font-medium text-warm-400">
                              {structure.isMandatory ? 'Mandatory' : 'Optional'}
                            </p>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-charcoal-900 sm:px-6">
                            {money(structure.amount, structure.currency)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-warm-600">
                              <CalendarDays size={13} className="text-warm-400" />
                              {new Date(structure.dueDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                                structure.status === 'ACTIVE'
                                  ? 'bg-success-100 text-success-800'
                                  : structure.status === 'DRAFT'
                                    ? 'bg-warning-100 text-warning-800'
                                    : 'bg-warm-100 text-warm-600'
                              }`}
                            >
                              {structure.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                            {canManage ? (
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={`Edit ${structure.name}`}
                                  onClick={() => setEditStructure(structure)}
                                >
                                  <PencilLine size={15} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  aria-label={
                                    archived
                                      ? `Restore ${structure.name}`
                                      : `Archive ${structure.name}`
                                  }
                                  disabled={archivingId === structure.id}
                                  onClick={() =>
                                    setStructureStatus(structure, archived ? 'ACTIVE' : 'ARCHIVED')
                                  }
                                >
                                  {archivingId === structure.id ? (
                                    <Loader2 size={15} className="animate-spin" />
                                  ) : archived ? (
                                    <RotateCcw size={15} />
                                  ) : (
                                    <Archive size={15} />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-warm-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
                <span>
                  Showing {visibleStructures.length} of {structures.length} fee item
                  {structures.length === 1 ? '' : 's'}.
                </span>
                {filtersActive && (
                  <Button variant="ghost" size="xs" onClick={resetFilters}>
                    Clear filters
                  </Button>
                )}
              </div>
            </section>
          )}
        </>
      ) : (
        <>
          <div className="w-full max-w-md">
            <Input
              type="search"
              aria-label="Search fee categories"
              placeholder="Search by name, code or description…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              leftIcon={<Search size={16} />}
            />
          </div>

          {loading && categories.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading fee categories…
            </div>
          ) : categories.length === 0 && !error ? (
            <EmptyState
              icon={<Tags className="h-8 w-8" />}
              title="No fee categories yet"
              description="Categories such as Tuition, Transport or Examination group the items you bill."
              actionButton={
                canManage ? (
                  <Button onClick={() => setCategoryModal({})} leftIcon={<Plus size={16} />}>
                    Create category
                  </Button>
                ) : undefined
              }
            />
          ) : visibleCategories.length === 0 && !error ? (
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
                  <caption className="sr-only">Fee categories</caption>
                  <thead className="bg-ivory-50">
                    <tr>
                      {['Category', 'Fee items', 'Description', 'Status', 'Actions'].map((heading) => (
                        <th
                          key={heading}
                          scope="col"
                          className={`whitespace-nowrap px-4 py-3 text-[11px] font-bold uppercase tracking-wide text-warm-500 sm:px-6 ${
                            heading === 'Actions' ? 'text-right' : 'text-left'
                          }`}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100">
                    {visibleCategories.map((category) => (
                      <tr key={category.id} className="transition-colors hover:bg-sage-50/30">
                        <td className="px-4 py-3.5 sm:px-6">
                          <p className="text-sm font-semibold text-charcoal-900">{category.name}</p>
                          <p className="mt-0.5 font-mono text-[11px] font-semibold uppercase text-forest-700">
                            {category.code}
                          </p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-charcoal-900 sm:px-6">
                          {category._count?.feeStructures ?? 0}
                        </td>
                        <td className="max-w-xs px-4 py-3.5 text-xs text-warm-500 sm:px-6">
                          <span className="line-clamp-2">
                            {category.description || 'No description'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                              category.isActive
                                ? 'bg-success-100 text-success-800'
                                : 'bg-warm-100 text-warm-600'
                            }`}
                          >
                            {category.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                          {canManage ? (
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Edit ${category.name}`}
                                onClick={() => setCategoryModal({ category })}
                              >
                                <PencilLine size={15} />
                              </Button>
                              <Button
                                variant="ghost"
                                size="xs"
                                onClick={() => toggleCategory(category)}
                              >
                                {category.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                            </div>
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
                {visibleCategories.length} of {categories.length} categor
                {categories.length === 1 ? 'y' : 'ies'}.
              </div>
            </section>
          )}
        </>
      )}

      {editStructure && (
        <Modal
          isOpen
          onClose={() => setEditStructure(null)}
          title="Edit fee item"
          size="lg"
        >
          <FeeStructureForm
            structure={editStructure}
            onCancel={() => setEditStructure(null)}
            onSaved={() => {
              setEditStructure(null);
              load();
            }}
          />
        </Modal>
      )}

      {categoryModal && (
        <FeeCategoryModal
          category={categoryModal.category}
          onClose={() => setCategoryModal(null)}
          onSaved={() => {
            setCategoryModal(null);
            load();
          }}
        />
      )}
    </div>
  );
}
