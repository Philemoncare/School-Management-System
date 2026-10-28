'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import { VisitorForm } from '@/components/front-office/forms';
import {
  ArrowLeft,
  BadgeCheck,
  Loader2,
  LogIn,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Users,
} from 'lucide-react';

interface VisitorVisit {
  id: string;
  visitorId: string;
  status: string;
  purpose?: string | null;
  badgeNumber?: string | null;
  checkInAt: string;
  checkOutAt?: string | null;
  visitor?: { id: string; fullName: string };
}

interface Visitor {
  id: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
  organization?: string | null;
  visitorType: string;
  identificationNumber?: string | null;
  createdAt: string;
  visits?: VisitorVisit[];
  _count?: { visits: number };
}

function statusTone(status: string) {
  if (status === 'CHECKED_IN') return 'bg-success-100 text-success-800';
  if (status === 'CHECKED_OUT') return 'bg-warm-100 text-warm-600';
  return 'bg-warm-100 text-warm-600';
}

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [onCampus, setOnCampus] = useState<VisitorVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [registerOpen, setRegisterOpen] = useState(false);
  const [checkInTarget, setCheckInTarget] = useState<Visitor | null>(null);
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [visitorData, campusData] = await Promise.all([
        apiFetch('/front-office/visitors'),
        apiFetch('/front-office/visitors/current'),
      ]);
      setVisitors(Array.isArray(visitorData) ? visitorData : []);
      setOnCampus(Array.isArray(campusData) ? campusData : []);
    } catch (err: any) {
      setVisitors([]);
      setOnCampus([]);
      setError(err?.message || 'Could not load visitors.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const activeByVisitor = useMemo(() => {
    const map = new Map<string, VisitorVisit>();
    for (const visit of onCampus) {
      map.set(visit.visitorId, visit);
    }
    return map;
  }, [onCampus]);

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return visitors;
    return visitors.filter(
      (visitor) =>
        visitor.fullName.toLowerCase().includes(needle) ||
        (visitor.phone ?? '').toLowerCase().includes(needle) ||
        (visitor.organization ?? '').toLowerCase().includes(needle) ||
        (visitor.identificationNumber ?? '').toLowerCase().includes(needle),
    );
  }, [visitors, search]);

  async function checkOut(visitId: string, name: string) {
    if (!window.confirm(`Check out ${name}? This closes the current visit.`)) return;
    setCheckingOutId(visitId);
    try {
      await apiFetch(`/front-office/visitors/check-out/${visitId}`, { method: 'PATCH' });
      showFeedback('SUCCESS', `${name} checked out.`);
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not check the visitor out.');
    } finally {
      setCheckingOutId(null);
    }
  }

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
            <Users className="text-forest-700" size={26} /> Visitors desk
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            {onCampus.length} visitor{onCampus.length === 1 ? '' : 's'} currently on campus.
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
          <Link href="/receptionist/visitors/new">
            <Button size="sm" leftIcon={<Plus size={16} />}>
              Register visitor
            </Button>
          </Link>
        </div>
      </div>

      <div className="w-full max-w-md">
        <Input
          type="search"
          aria-label="Search visitors"
          placeholder="Search by name, phone, ID or organisation…"
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

      {loading && visitors.length === 0 ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading visitors…
        </div>
      ) : visitors.length === 0 && !error ? (
        <EmptyState
          icon={<Users className="h-8 w-8" />}
          title="No visitors recorded"
          description="Register a visitor when they arrive so every entry is traceable."
          actionButton={
            <Link href="/receptionist/visitors/new">
              <Button leftIcon={<Plus size={16} />}>Register visitor</Button>
            </Link>
          }
        />
      ) : visible.length === 0 && !error ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="No visitors match this search"
          description="Try a different name, phone number or organisation."
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
              <caption className="sr-only">Registered visitors</caption>
              <thead className="bg-ivory-50">
                <tr>
                  {['Visitor', 'Type', 'Contact', 'Visits', 'Status', 'Actions'].map((heading) => (
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
                {visible.map((visitor) => {
                  const active = activeByVisitor.get(visitor.id);
                  const lastVisit = visitor.visits?.[0];
                  return (
                    <tr key={visitor.id} className="transition-colors hover:bg-sage-50/30">
                      <td className="px-4 py-3.5 sm:px-6">
                        <p className="text-sm font-semibold text-charcoal-900">
                          {visitor.fullName}
                        </p>
                        <p className="mt-0.5 text-[11px] font-medium text-warm-500">
                          {visitor.organization || visitor.identificationNumber || 'No organisation'}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <span className="rounded-full bg-warm-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-warm-600">
                          {visitor.visitorType}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-warm-600 sm:px-6">
                        <span className="block">{visitor.phone || '—'}</span>
                        <span className="block text-[11px] text-warm-400">{visitor.email || ''}</span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-sm font-bold text-charcoal-900 sm:px-6">
                        {visitor._count?.visits ?? visitor.visits?.length ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 sm:px-6">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${statusTone(
                            active ? 'CHECKED_IN' : lastVisit?.status ?? '',
                          )}`}
                        >
                          {active ? 'On campus' : lastVisit ? 'Checked out' : 'Not visited'}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right sm:px-6">
                        {active ? (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => checkOut(active.id, visitor.fullName)}
                            disabled={checkingOutId === active.id}
                            leftIcon={
                              checkingOutId === active.id ? (
                                <Loader2 size={12} className="animate-spin" />
                              ) : (
                                <LogOut size={12} />
                              )
                            }
                          >
                            Check out
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="xs"
                            onClick={() => setCheckInTarget(visitor)}
                            leftIcon={<LogIn size={12} />}
                          >
                            Check in
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-warm-100 bg-ivory-50/40 px-5 py-3 text-[11px] font-medium text-warm-500 sm:px-6">
            Showing {visible.length} of {visitors.length} visitor
            {visitors.length === 1 ? '' : 's'}.
          </div>
        </section>
      )}

      {registerOpen && (
        <Modal isOpen onClose={() => setRegisterOpen(false)} title="Register visitor" size="lg">
          <VisitorForm
            onCancel={() => setRegisterOpen(false)}
            onSaved={(visitor) => {
              setRegisterOpen(false);
              showFeedback('SUCCESS', `${visitor.fullName} registered.`);
              setCheckInTarget(visitor);
              load();
            }}
          />
        </Modal>
      )}

      {checkInTarget && (
        <CheckInModal
          visitor={checkInTarget}
          onClose={() => setCheckInTarget(null)}
          onSaved={(visit) => {
            setCheckInTarget(null);
            showFeedback('SUCCESS', `${visit.visitor?.fullName ?? 'Visitor'} checked in.`);
            load();
          }}
        />
      )}
    </div>
  );
}

function CheckInModal({
  visitor,
  onClose,
  onSaved,
}: {
  visitor: Visitor;
  onClose: () => void;
  onSaved: (visit: any) => void;
}) {
  const [form, setForm] = useState({
    purpose: '',
    hostName: '',
    badgeNumber: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError('');
    try {
      const visit = await apiFetch('/front-office/visitors/check-in', {
        method: 'POST',
        body: JSON.stringify({
          visitorId: visitor.id,
          purpose: form.purpose.trim() || undefined,
          hostName: form.hostName.trim() || undefined,
          badgeNumber: form.badgeNumber.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      onSaved(visit);
    } catch (err: any) {
      setError(err?.message || 'Could not check the visitor in.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal isOpen onClose={onClose} title="Check visitor in">
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-center gap-3 rounded-lg bg-sage-50 p-3">
          <BadgeCheck size={20} className="text-forest-700" />
          <div>
            <p className="text-sm font-bold text-charcoal-900">{visitor.fullName}</p>
            <p className="text-[11px] font-medium text-warm-600">
              {visitor.phone || visitor.email || visitor.visitorType}
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}

        <Input
          label="Purpose of visit"
          placeholder="e.g. Meeting the head teacher"
          value={form.purpose}
          onChange={(event) => setForm({ ...form, purpose: event.target.value })}
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Host"
            placeholder="Who are they seeing?"
            value={form.hostName}
            onChange={(event) => setForm({ ...form, hostName: event.target.value })}
          />
          <Input
            label="Badge number"
            placeholder="Leave blank to auto-generate"
            value={form.badgeNumber}
            onChange={(event) => setForm({ ...form, badgeNumber: event.target.value })}
          />
        </div>
        <Input
          label="Notes"
          placeholder="Optional"
          value={form.notes}
          onChange={(event) => setForm({ ...form, notes: event.target.value })}
        />

        <div className="flex items-center justify-end gap-2 border-t border-warm-100 pt-4">
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" isLoading={saving} leftIcon={<LogIn size={15} />}>
            Check in
          </Button>
        </div>
      </form>
    </Modal>
  );
}
