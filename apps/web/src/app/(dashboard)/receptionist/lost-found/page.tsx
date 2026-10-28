'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import { LostFoundForm } from '@/components/front-office/forms';
import {
  AlertCircle,
  ArrowLeft,
  Loader2,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  Undo2,
} from 'lucide-react';

interface LostFoundItem {
  id: string;
  itemName: string;
  category: string;
  foundLocation?: string | null;
  description?: string | null;
  status: 'STORED' | 'CLAIMED';
  foundAt: string;
  claimantName?: string | null;
  claimedAt?: string | null;
}

export default function LostFoundPage() {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [claiming, setClaiming] = useState<LostFoundItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/front-office/lost-found');
      setItems(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setItems([]);
      setError(err?.message || 'Could not load lost and found items.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        item.itemName.toLowerCase().includes(needle) ||
        item.category.toLowerCase().includes(needle) ||
        (item.foundLocation ?? '').toLowerCase().includes(needle) ||
        (item.claimantName ?? '').toLowerCase().includes(needle)
      );
    });
  }, [items, search, statusFilter]);

  const stored = items.filter((item) => item.status === 'STORED').length;
  const filtersActive = Boolean(search) || statusFilter !== 'ALL';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            href="/receptionist/dashboard"
            className="mb-2 inline-flex items-center gap-1.5 text-xs font-semibold text-warm-600 hover:text-charcoal-900"
          >
            <ArrowLeft size={14} /> Front desk
          </Link>
          <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <PackageSearch className="text-forest-700" size={26} /> Lost &amp; found
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            {stored} item{stored === 1 ? '' : 's'} in storage awaiting a claim.
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
          <Button size="sm" onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
            Log found item
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          type="search"
          aria-label="Search lost and found items"
          placeholder="Search item, category or location…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16} />}
        />
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          options={[
            { value: 'ALL', label: 'All statuses' },
            { value: 'STORED', label: 'In storage' },
            { value: 'CLAIMED', label: 'Claimed' },
          ]}
          onChange={(event) => setStatusFilter(event.target.value)}
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

      {loading && items.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading lost and found items…
        </div>
      ) : items.length === 0 && !error ? (
        <EmptyState
          icon={<AlertCircle className="h-8 w-8" />}
          title="No lost and found items"
          description="Log items handed in at reception so owners can be reunited with them."
          actionButton={
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              Log found item
            </Button>
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No items match this view"
          description="Change the status filter or search text."
          actionButton={
            filtersActive ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
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
              <caption className="sr-only">Lost and found items</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Item', 'Found at', 'Found', 'Status', 'Actions'].map((heading) => (
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
                {visible.map((item) => (
                  <tr key={item.id} className="transition-colors hover:bg-sage-50/30">
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="text-sm font-semibold text-charcoal-900">{item.itemName}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-warm-500">
                        {item.category}
                        {item.description ? ` · ${item.description}` : ''}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-warm-600 sm:px-6">
                      {item.foundLocation || '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-warm-600 sm:px-6">
                      {new Date(item.foundAt).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          item.status === 'CLAIMED'
                            ? 'bg-success-100 text-success-800'
                            : 'bg-warning-100 text-warning-800'
                        }`}
                      >
                        {item.status === 'CLAIMED' ? 'Claimed' : 'In storage'}
                      </span>
                      {item.status === 'CLAIMED' && (
                        <p className="mt-1 text-[10px] font-medium text-warm-400">
                          by {item.claimantName || 'unknown'}
                          {item.claimedAt
                            ? ` · ${new Date(item.claimedAt).toLocaleDateString()}`
                            : ''}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                      {item.status === 'CLAIMED' ? (
                        <span className="text-xs text-warm-400">—</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setClaiming(item)}
                          leftIcon={<Undo2 size={12} />}
                        >
                          Process claim
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
            Showing {visible.length} of {items.length} item{items.length === 1 ? '' : 's'}.
          </div>
        </section>
      )}

      {createOpen && (
        <Modal isOpen onClose={() => setCreateOpen(false)} title="Log found item" size="lg">
          <LostFoundForm
            onCancel={() => setCreateOpen(false)}
            onSaved={() => {
              setCreateOpen(false);
              showFeedback('SUCCESS', 'Found item logged.');
              load();
            }}
          />
        </Modal>
      )}

      {claiming && (
        <ClaimItemModal
          item={claiming}
          onClose={() => setClaiming(null)}
          onSaved={() => {
            setClaiming(null);
            showFeedback('SUCCESS', 'Item marked as claimed.');
            load();
          }}
        />
      )}
    </div>
  );
}

function ClaimItemModal({
  item,
  onClose,
  onSaved,
}: {
  item: LostFoundItem;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [claimantName, setClaimantName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!claimantName.trim()) {
      setError('Record who is collecting the item.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/front-office/lost-found/${item.id}/claim`, {
        method: 'PATCH',
        body: JSON.stringify({ claimantName: claimantName.trim() }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not process the claim.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Process claim"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="claim-item-form" isLoading={saving}>
            Mark claimed
          </Button>
        </>
      }
    >
      <form id="claim-item-form" onSubmit={submit} className="space-y-4">
        <div className="rounded-lg bg-ivory-50 p-3">
          <p className="text-sm font-bold text-charcoal-900">{item.itemName}</p>
          <p className="mt-0.5 text-xs font-medium text-warm-600">
            {item.category}
            {item.foundLocation ? ` · found at ${item.foundLocation}` : ''}
          </p>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <Input
          label="Claimed by *"
          required
          placeholder="Full name of the person collecting"
          value={claimantName}
          onChange={(event) => setClaimantName(event.target.value)}
        />
      </form>
    </Modal>
  );
}
