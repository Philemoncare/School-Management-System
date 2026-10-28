'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Monitor,
  ShieldCheck,
  MapPin,
  Calendar,
  Wrench,
  UserCheck,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { SkeletonTable } from '@/components/ui/loading-state';

const STATUS_STYLES: Record<string, string> = {
  IN_STORAGE: 'bg-warm-100 text-warm-700',
  ASSIGNED: 'bg-sage-100 text-forest-800',
  UNDER_MAINTENANCE: 'bg-warning-100 text-warning-800',
  DISPOSED: 'bg-danger-100 text-danger-800',
  LOST: 'bg-danger-100 text-danger-800',
};

function formatCurrency(value: unknown) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  if (!Number.isFinite(amount)) return '—';
  return `GH₵ ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export default function AssetDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [asset, setAsset] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch(`/inventory/assets/${id}`);
      setAsset(data);
    } catch (err) {
      setAsset(null);
      setError(err instanceof Error ? err.message : 'Could not load this asset.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4">
        <SkeletonTable />
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="mx-auto max-w-2xl space-y-5 py-8">
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error || 'This asset could not be found in your school.'}</span>
        </div>
        <EmptyState
          title="Asset unavailable"
          description="The asset may have been removed, or it belongs to another school. Go back to the asset register to continue."
          icon={<Monitor className="h-8 w-8" />}
          actionButton={
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/assets">
                <Button variant="primary" size="sm">Back to Assets</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={load} leftIcon={<RefreshCw size={15} />}>
                Retry
              </Button>
            </div>
          }
        />
      </div>
    );
  }

  const custodian = asset.staff
    ? `${asset.staff.firstName || ''} ${asset.staff.lastName || ''}`.trim()
    : asset.department?.name || 'Unassigned';
  const currentAssignment = (asset.assignments || []).find((entry: any) => !entry.actualReturnDate);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/assets"
          aria-label="Back to assets"
          className="rounded-xl border border-warm-200 bg-card p-2.5 text-warm-600 transition-colors hover:text-charcoal-900"
        >
          <ArrowLeft size={18} />
        </Link>
        <div className="min-w-0">
          <h1 className="flex items-center gap-2.5 truncate text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Monitor className="h-6 w-6 shrink-0 text-forest-700" /> {asset.name}
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-warm-500 sm:text-sm">Asset Tag: {asset.assetTag}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-warm-200 bg-card p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">Current Status</p>
          <span className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase ${STATUS_STYLES[asset.status] || 'bg-warm-100 text-warm-700'}`}>
            {String(asset.status || '').replace(/_/g, ' ') || 'Unknown'}
          </span>
          <p className="mt-1 text-[11px] font-medium text-warm-500">Condition: {String(asset.condition || '').replace(/_/g, ' ')}</p>
        </div>
        <div className="rounded-xl border border-warm-200 bg-card p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">Location</p>
          <p className="mt-1 truncate text-sm font-bold text-charcoal-900">{asset.location?.name || 'Not recorded'}</p>
          <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-warm-500">
            <MapPin size={12} /> {asset.department?.name || 'No department'}
          </p>
        </div>
        <div className="rounded-xl border border-warm-200 bg-card p-4 shadow-xs">
          <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">Acquisition Cost</p>
          <p className="mt-1 text-sm font-bold text-charcoal-900">{formatCurrency(asset.acquisitionCost)}</p>
          <p className="mt-1 text-[11px] font-medium text-warm-500">
            Residual {formatCurrency(asset.residualValue)}
          </p>
        </div>
      </div>

      <div className="space-y-4 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <h2 className="border-b border-warm-100 pb-3 text-base font-bold text-charcoal-900">Asset Specifications</h2>
        <dl className="grid grid-cols-1 gap-4 text-xs sm:grid-cols-2 sm:text-sm">
          <div>
            <dt className="font-semibold text-warm-500">Custodian</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-bold text-charcoal-900">
              <UserCheck size={14} className="text-forest-700" /> {custodian}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-warm-500">Serial Number</dt>
            <dd className="mt-0.5 font-mono font-bold text-charcoal-900">{asset.serialNumber || '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-warm-500">Purchase Date</dt>
            <dd className="mt-0.5 flex items-center gap-1.5 font-bold text-charcoal-900">
              <Calendar size={14} className="text-forest-700" /> {formatDate(asset.purchaseDate)}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-warm-500">Supplier</dt>
            <dd className="mt-0.5 font-bold text-charcoal-900">{asset.supplier?.name || '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-warm-500">Linked Inventory Item</dt>
            <dd className="mt-0.5 font-bold text-charcoal-900">{asset.item?.name || '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-warm-500">Useful Life</dt>
            <dd className="mt-0.5 font-bold text-charcoal-900">
              {asset.usefulLife ? `${asset.usefulLife} months` : '—'}
            </dd>
          </div>
        </dl>

        {asset.warranty && (
          <div className="flex items-start gap-3 rounded-xl border border-warm-200 bg-ivory-50 p-3 text-xs">
            <ShieldCheck size={16} className="mt-0.5 shrink-0 text-forest-700" />
            <div>
              <p className="font-bold text-charcoal-900">Warranty</p>
              <p className="text-warm-600">
                {asset.warranty.provider || 'Provider not recorded'} · expires {formatDate(asset.warranty.endDate)}
              </p>
            </div>
          </div>
        )}

        {asset.disposal && (
          <div className="rounded-xl border border-danger-200 bg-danger-50 p-3 text-xs">
            <p className="font-bold text-danger-800">Disposed</p>
            <p className="text-danger-700">
              {formatDate(asset.disposal.disposalDate)} · {asset.disposal.reason || 'No reason recorded'}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <h2 className="border-b border-warm-100 pb-3 text-base font-bold text-charcoal-900">Assignment History</h2>
        {currentAssignment && (
          <p className="rounded-lg bg-sage-50 px-3 py-2 text-xs font-semibold text-forest-800">
            Currently held by{' '}
            {currentAssignment.staff
              ? `${currentAssignment.staff.firstName} ${currentAssignment.staff.lastName}`
              : currentAssignment.department?.name || 'unknown custodian'}{' '}
            since {formatDate(currentAssignment.assignmentDate)}.
          </p>
        )}
        {!asset.assignments?.length ? (
          <p className="py-4 text-center text-xs font-medium text-warm-500">This asset has never been assigned.</p>
        ) : (
          <ul className="divide-y divide-warm-100">
            {asset.assignments.map((assignment: any) => (
              <li key={assignment.id} className="flex flex-col gap-1 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-bold text-charcoal-900">
                    {assignment.staff
                      ? `${assignment.staff.firstName} ${assignment.staff.lastName}`
                      : assignment.department?.name || 'Department'}
                  </p>
                  <p className="text-warm-500">
                    {formatDate(assignment.assignmentDate)} → {assignment.actualReturnDate ? formatDate(assignment.actualReturnDate) : 'present'}
                    {assignment.location?.name ? ` · ${assignment.location.name}` : ''}
                  </p>
                </div>
                <span className="font-semibold text-warm-600">{String(assignment.conditionAtAssignment || '').replace(/_/g, ' ')}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="space-y-3 rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <h2 className="border-b border-warm-100 pb-3 text-base font-bold text-charcoal-900">Maintenance</h2>
        {!asset.maintenance?.length ? (
          <p className="py-4 text-center text-xs font-medium text-warm-500">No maintenance has been logged for this asset.</p>
        ) : (
          <ul className="divide-y divide-warm-100">
            {asset.maintenance.map((entry: any) => (
              <li key={entry.id} className="flex items-start gap-3 py-3 text-xs">
                <Wrench size={14} className="mt-0.5 shrink-0 text-terracotta-600" />
                <div>
                  <p className="font-bold text-charcoal-900">{entry.title}</p>
                  <p className="text-warm-500">
                    {entry.maintenanceType || 'Maintenance'} · {entry.status || 'REPORTED'} ·{' '}
                    {formatDate(entry.startDate || entry.createdAt)}
                    {entry.cost !== undefined && entry.cost !== null ? ` · ${formatCurrency(entry.cost)}` : ''}
                  </p>
                  {entry.description && <p className="mt-1 text-warm-600">{entry.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
