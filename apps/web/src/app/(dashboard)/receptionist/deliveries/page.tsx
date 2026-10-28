'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import { DeliveryForm } from '@/components/front-office/forms';
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Truck,
} from 'lucide-react';

interface Delivery {
  id: string;
  courierCompany?: string | null;
  recipientName: string;
  referenceNumber?: string | null;
  description?: string | null;
  status: 'RECEIVED' | 'EXPECTED' | 'COLLECTED';
  receivedAt: string;
  collectedAt?: string | null;
  collectedBy?: string | null;
  notes?: string | null;
}

export default function DeliveriesPage() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [collecting, setCollecting] = useState<Delivery | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/front-office/deliveries');
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setDeliveries([]);
      setError(err?.message || 'Could not load deliveries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return deliveries.filter((delivery) => {
      if (statusFilter !== 'ALL' && delivery.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        delivery.recipientName.toLowerCase().includes(needle) ||
        (delivery.courierCompany ?? '').toLowerCase().includes(needle) ||
        (delivery.referenceNumber ?? '').toLowerCase().includes(needle) ||
        (delivery.description ?? '').toLowerCase().includes(needle)
      );
    });
  }, [deliveries, search, statusFilter]);

  const awaiting = deliveries.filter((delivery) => delivery.status !== 'COLLECTED').length;
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
            <Truck className="text-forest-700" size={26} /> Deliveries log
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            {awaiting} deliver{awaiting === 1 ? 'y' : 'ies'} awaiting collection.
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
            Log delivery
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          type="search"
          aria-label="Search deliveries"
          placeholder="Search recipient, courier or reference…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          leftIcon={<Search size={16} />}
        />
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          options={[
            { value: 'ALL', label: 'All statuses' },
            { value: 'RECEIVED', label: 'Awaiting collection' },
            { value: 'COLLECTED', label: 'Collected' },
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

      {loading && deliveries.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading deliveries…
        </div>
      ) : deliveries.length === 0 && !error ? (
        <EmptyState
          icon={<Truck className="h-8 w-8" />}
          title="No deliveries logged"
          description="Log parcels as they arrive so recipients can be notified and collection tracked."
          actionButton={
            <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
              Log delivery
            </Button>
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No deliveries match this view"
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
              <caption className="sr-only">Deliveries</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Recipient', 'Courier / reference', 'Received', 'Status', 'Actions'].map(
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
                {visible.map((delivery) => (
                  <tr key={delivery.id} className="transition-colors hover:bg-sage-50/30">
                    <td className="px-4 py-3.5 sm:px-6">
                      <p className="text-sm font-semibold text-charcoal-900">
                        {delivery.recipientName}
                      </p>
                      <p className="mt-0.5 line-clamp-1 text-[11px] font-medium text-warm-500">
                        {delivery.description || 'No description'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-warm-600 sm:px-6">
                      <span className="block">{delivery.courierCompany || '—'}</span>
                      <span className="block font-mono text-[11px] text-warm-400">
                        {delivery.referenceNumber || ''}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-xs font-medium text-warm-600 sm:px-6">
                      {new Date(delivery.receivedAt).toLocaleString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                          delivery.status === 'COLLECTED'
                            ? 'bg-success-100 text-success-800'
                            : 'bg-warning-100 text-warning-800'
                        }`}
                      >
                        {delivery.status === 'COLLECTED' ? 'Collected' : 'Awaiting collection'}
                      </span>
                      {delivery.status === 'COLLECTED' && (
                        <p className="mt-1 text-[10px] font-medium text-warm-400">
                          by {delivery.collectedBy || 'recipient'} ·{' '}
                          {delivery.collectedAt
                            ? new Date(delivery.collectedAt).toLocaleDateString()
                            : ''}
                        </p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                      {delivery.status === 'COLLECTED' ? (
                        <span className="text-xs text-warm-400">—</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setCollecting(delivery)}
                          leftIcon={<PackageCheck size={12} />}
                        >
                          Mark collected
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
            Showing {visible.length} of {deliveries.length} deliver
            {deliveries.length === 1 ? 'y' : 'ies'}.
          </div>
        </section>
      )}

      {createOpen && (
        <Modal isOpen onClose={() => setCreateOpen(false)} title="Log delivery" size="lg">
          <DeliveryForm
            onCancel={() => setCreateOpen(false)}
            onSaved={() => {
              setCreateOpen(false);
              showFeedback('SUCCESS', 'Delivery logged.');
              load();
            }}
          />
        </Modal>
      )}

      {collecting && (
        <CollectDeliveryModal
          delivery={collecting}
          onClose={() => setCollecting(null)}
          onSaved={() => {
            setCollecting(null);
            showFeedback('SUCCESS', 'Delivery marked collected.');
            load();
          }}
        />
      )}
    </div>
  );
}

function CollectDeliveryModal({
  delivery,
  onClose,
  onSaved,
}: {
  delivery: Delivery;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [collectedBy, setCollectedBy] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/front-office/deliveries/${delivery.id}/collect`, {
        method: 'PATCH',
        body: JSON.stringify({ collectedBy: collectedBy.trim() || undefined }),
      });
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not mark the delivery collected.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Mark delivery collected"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="collect-delivery-form" isLoading={saving}>
            Confirm collection
          </Button>
        </>
      }
    >
      <form id="collect-delivery-form" onSubmit={submit} className="space-y-4">
        <div className="flex items-start gap-2.5 rounded-lg bg-ivory-50 p-3">
          <CheckCircle2 size={18} className="mt-0.5 text-forest-700" />
          <div>
            <p className="text-sm font-bold text-charcoal-900">{delivery.recipientName}</p>
            <p className="mt-0.5 text-xs font-medium text-warm-600">
              {delivery.courierCompany || 'Courier not recorded'}
              {delivery.referenceNumber ? ` · ${delivery.referenceNumber}` : ''}
            </p>
          </div>
        </div>
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <Input
          label="Collected by"
          placeholder="Name of the person collecting"
          helperText="Leave blank to record your own account as the collector."
          value={collectedBy}
          onChange={(event) => setCollectedBy(event.target.value)}
        />
      </form>
    </Modal>
  );
}
