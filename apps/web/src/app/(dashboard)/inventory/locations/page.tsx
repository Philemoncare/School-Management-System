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
  Boxes,
  Building2,
  Loader2,
  MapPin,
  PencilLine,
  Plus,
  RefreshCw,
  Search,
  User,
} from 'lucide-react';

interface Location {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  type?: string | null;
  status: string;
  staff?: { firstName: string; lastName: string } | null;
  _count?: { balances: number; assets: number };
}

const LOCATION_TYPES = [
  { value: 'Main Store', label: 'Main store' },
  { value: 'Department Store', label: 'Department store' },
  { value: 'Laboratory', label: 'Laboratory' },
  { value: 'Library', label: 'Library' },
  { value: 'Classroom', label: 'Classroom' },
  { value: 'Office', label: 'Office' },
  { value: 'Other', label: 'Other' },
];

export default function InventoryLocationsPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canManage = roles.some((role) => ['SCHOOL_ADMIN', 'INVENTORY_OFFICER'].includes(role));

  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editLocation, setEditLocation] = useState<Location | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/inventory/locations');
      setLocations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setLocations([]);
      setError(err?.message || 'Could not load stock locations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return locations;
    return locations.filter(
      (location) =>
        location.name.toLowerCase().includes(needle) ||
        location.code.toLowerCase().includes(needle) ||
        (location.type ?? '').toLowerCase().includes(needle),
    );
  }, [locations, search]);

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
            <MapPin className="text-forest-700" size={26} /> Stock Locations
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Stores, laboratories and distribution points that hold stock.
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
              New location
            </Button>
          )}
        </div>
      </div>

      <InventoryNav />

      <div className="w-full max-w-md">
        <Input
          type="search"
          aria-label="Search locations"
          placeholder="Search by name, code or type…"
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

      {loading && locations.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading locations…
        </div>
      ) : locations.length === 0 && !error ? (
        <EmptyState
          icon={<MapPin className="h-8 w-8" />}
          title="No stock locations yet"
          description="Create a location such as Main Store before recording stock movements."
          actionButton={
            canManage ? (
              <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={16} />}>
                Create location
              </Button>
            ) : undefined
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No matching locations"
          description="Try a different name, code or type."
          actionButton={
            <Button variant="outline" onClick={() => setSearch('')}>
              Clear search
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((location) => (
            <section
              key={location.id}
              className="flex flex-col rounded-xl border border-warm-200 bg-card p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sage-50 text-forest-700">
                  <MapPin size={20} />
                </span>
                <span className="rounded-lg bg-warm-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-warm-600">
                  {location.type || 'Storage'}
                </span>
              </div>

              <h2 className="mt-4 text-base font-bold text-charcoal-900">{location.name}</h2>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                {location.code}
              </p>

              {location.description && (
                <p className="mt-2 line-clamp-2 text-xs text-warm-500">{location.description}</p>
              )}

              <dl className="mt-4 space-y-2 border-t border-ivory-100 pt-4 text-xs">
                <div className="flex items-center gap-2 text-warm-600">
                  <Boxes size={14} className="text-warm-400" />
                  <dt className="sr-only">Stocked items</dt>
                  <dd>{location._count?.balances ?? 0} stocked items</dd>
                </div>
                <div className="flex items-center gap-2 text-warm-600">
                  <Building2 size={14} className="text-warm-400" />
                  <dt className="sr-only">Assets</dt>
                  <dd>{location._count?.assets ?? 0} assets</dd>
                </div>
                {location.staff && (
                  <div className="flex items-center gap-2 text-warm-600">
                    <User size={14} className="text-warm-400" />
                    <dt className="sr-only">Responsible staff</dt>
                    <dd>
                      {location.staff.firstName} {location.staff.lastName}
                    </dd>
                  </div>
                )}
              </dl>

              {canManage && (
                <div className="mt-4 flex flex-wrap gap-2 border-t border-ivory-100 pt-4">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => setEditLocation(location)}
                    leftIcon={<PencilLine size={12} />}
                  >
                    Edit
                  </Button>
                  <Link href={`/inventory/movements`}>
                    <Button variant="ghost" size="xs">
                      View movements
                    </Button>
                  </Link>
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      {createOpen && (
        <LocationFormModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false);
            load();
          }}
        />
      )}

      {editLocation && (
        <LocationFormModal
          location={editLocation}
          onClose={() => setEditLocation(null)}
          onSaved={() => {
            setEditLocation(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function LocationFormModal({
  location,
  onClose,
  onSaved,
}: {
  location?: Location;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: location?.name ?? '',
    code: location?.code ?? '',
    type: location?.type ?? 'Main Store',
    description: location?.description ?? '',
    status: location?.status ?? 'ACTIVE',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.name.trim() || !form.code.trim()) {
      setError('Location name and code are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch(
        location ? `/inventory/locations/${location.id}` : '/inventory/locations',
        {
          method: location ? 'PATCH' : 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            type: form.type || undefined,
            description: form.description.trim() || undefined,
            ...(location ? { status: form.status } : {}),
          }),
        },
      );
      showFeedback('SUCCESS', location ? 'Location updated.' : 'Location created.');
      onSaved();
    } catch (err: any) {
      setError(err?.message || 'Could not save the location.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={location ? 'Edit stock location' : 'New stock location'}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="location-form" isLoading={saving}>
            {location ? 'Save changes' : 'Create location'}
          </Button>
        </>
      }
    >
      <form id="location-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <Input
          label="Location name *"
          required
          placeholder="Main Store"
          value={form.name}
          onChange={(event) => setForm({ ...form, name: event.target.value })}
        />
        <Input
          label="Code *"
          required
          placeholder="MAIN"
          value={form.code}
          onChange={(event) => setForm({ ...form, code: event.target.value })}
        />
        <Select
          label="Type"
          value={form.type}
          options={LOCATION_TYPES}
          onChange={(event) => setForm({ ...form, type: event.target.value })}
        />
        {location && (
          <Select
            label="Status"
            value={form.status}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
            ]}
            onChange={(event) => setForm({ ...form, status: event.target.value })}
          />
        )}
        <div className="space-y-1.5">
          <label
            htmlFor="location-description"
            className="block text-xs font-semibold text-charcoal-800"
          >
            Description
          </label>
          <textarea
            id="location-description"
            rows={3}
            placeholder="Optional notes about what is stored here."
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            value={form.description}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
          />
        </div>
      </form>
    </Modal>
  );
}
