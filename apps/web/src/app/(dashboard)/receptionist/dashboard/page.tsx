'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  AlertCircle,
  CalendarCheck,
  ClipboardList,
  Clock,
  GraduationCap,
  LayoutDashboard,
  Loader2,
  LogOut,
  RefreshCw,
  Truck,
  Users,
} from 'lucide-react';

interface Metrics {
  visitorsOnCampus: number;
  todayVisitorCount: number;
  pendingAppointments: number;
  pendingEnquiries: number;
  studentPickupRequests: number;
  lateArrivalsCount: number;
  expectedDeliveries: number;
}

interface OnCampusVisit {
  id: string;
  purpose?: string | null;
  badgeNumber?: string | null;
  checkInAt: string;
  visitor: { id: string; fullName: string; organization?: string | null };
}

const QUICK_LINKS = [
  {
    href: '/receptionist/visitors',
    label: 'Visitors desk',
    description: 'Register, check in and check out visitors.',
    icon: Users,
  },
  {
    href: '/receptionist/appointments',
    label: 'Appointments',
    description: 'Book visits and update their status.',
    icon: CalendarCheck,
  },
  {
    href: '/receptionist/enquiries',
    label: 'Enquiries log',
    description: 'Capture and resolve front-desk enquiries.',
    icon: ClipboardList,
  },
  {
    href: '/receptionist/student-checkout',
    label: 'Student checkout',
    description: 'Release a student to a verified adult.',
    icon: GraduationCap,
  },
  {
    href: '/receptionist/late-arrivals',
    label: 'Late arrivals',
    description: 'Record students arriving after the bell.',
    icon: Clock,
  },
  {
    href: '/receptionist/deliveries',
    label: 'Deliveries log',
    description: 'Receive parcels and mark them collected.',
    icon: Truck,
  },
  {
    href: '/receptionist/lost-found',
    label: 'Lost & found',
    description: 'Log found items and process claims.',
    icon: AlertCircle,
  },
];

export default function ReceptionistDashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [onCampus, setOnCampus] = useState<OnCampusVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [checkingOutId, setCheckingOutId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [metricsData, campusData] = await Promise.all([
        apiFetch('/front-office/dashboard'),
        apiFetch('/front-office/visitors/current'),
      ]);
      setMetrics(metricsData);
      setOnCampus(Array.isArray(campusData) ? campusData : []);
    } catch (err: any) {
      setMetrics(null);
      setOnCampus([]);
      setError(err?.message || 'Could not load the front-office dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function checkOut(visit: OnCampusVisit) {
    if (
      !window.confirm(`Check out ${visit.visitor.fullName}? This closes the current visit.`)
    ) {
      return;
    }
    setCheckingOutId(visit.id);
    try {
      await apiFetch(`/front-office/visitors/check-out/${visit.id}`, { method: 'PATCH' });
      showFeedback('SUCCESS', `${visit.visitor.fullName} checked out.`);
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not check the visitor out.');
    } finally {
      setCheckingOutId(null);
    }
  }

  const cards = metrics
    ? [
        { label: 'On campus now', value: metrics.visitorsOnCampus, icon: Users, href: '/receptionist/visitors' },
        { label: 'Visitors today', value: metrics.todayVisitorCount, icon: LayoutDashboard, href: '/receptionist/visitors' },
        { label: 'Pending appointments', value: metrics.pendingAppointments, icon: CalendarCheck, href: '/receptionist/appointments' },
        { label: 'Open enquiries', value: metrics.pendingEnquiries, icon: ClipboardList, href: '/receptionist/enquiries' },
        { label: 'Pickup requests', value: metrics.studentPickupRequests, icon: GraduationCap, href: '/receptionist/student-checkout' },
        { label: 'Late arrivals today', value: metrics.lateArrivalsCount, icon: Clock, href: '/receptionist/late-arrivals' },
        { label: 'Deliveries awaiting collection', value: metrics.expectedDeliveries, icon: Truck, href: '/receptionist/deliveries' },
      ]
    : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            Front desk
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Live visitor, appointment and student movement for today.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />}
        >
          Refresh
        </Button>
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

      {loading && !metrics ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading front-desk metrics…
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {cards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group rounded-xl border border-warm-200 bg-card p-4 shadow-xs transition-shadow hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30 sm:p-5"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-sage-50 text-forest-700">
                <card.icon size={18} />
              </span>
              <p className="mt-3 text-2xl font-bold text-charcoal-900">{card.value ?? 0}</p>
              <p className="text-[11px] font-semibold text-warm-500">{card.label}</p>
            </Link>
          ))}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <section className="rounded-xl border border-warm-200 bg-card shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between gap-3 border-b border-warm-100 px-5 py-4">
            <h2 className="text-sm font-bold text-charcoal-900">Visitors on campus</h2>
            <Link
              href="/receptionist/visitors"
              className="text-xs font-semibold text-forest-700 hover:underline"
            >
              Open visitors desk
            </Link>
          </div>
          {onCampus.length === 0 ? (
            <p className="px-5 py-10 text-center text-xs font-medium text-warm-500">
              No visitors are checked in right now.
            </p>
          ) : (
            <ul className="divide-y divide-warm-100">
              {onCampus.map((visit) => (
                <li
                  key={visit.id}
                  className="flex flex-col gap-2 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-semibold text-charcoal-900">
                      {visit.visitor.fullName}
                      {visit.visitor.organization ? (
                        <span className="ml-1.5 text-xs font-medium text-warm-500">
                          · {visit.visitor.organization}
                        </span>
                      ) : null}
                    </p>
                    <p className="text-[11px] font-medium text-warm-500">
                      {visit.badgeNumber ? `Badge ${visit.badgeNumber} · ` : ''}
                      {visit.purpose || 'General visit'} · in at{' '}
                      {new Date(visit.checkInAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => checkOut(visit)}
                    disabled={checkingOutId === visit.id}
                    leftIcon={
                      checkingOutId === visit.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <LogOut size={12} />
                      )
                    }
                  >
                    Check out
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-warm-200 bg-card p-4 shadow-xs sm:p-5">
          <h2 className="text-sm font-bold text-charcoal-900">Quick actions</h2>
          <ul className="mt-3 space-y-1.5">
            {QUICK_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="flex items-start gap-2.5 rounded-lg p-2 transition-colors hover:bg-sage-50 focus-visible:bg-sage-50 focus-visible:outline-none"
                >
                  <link.icon size={16} className="mt-0.5 shrink-0 text-forest-700" />
                  <span>
                    <span className="block text-xs font-bold text-charcoal-900">
                      {link.label}
                    </span>
                    <span className="block text-[11px] font-medium text-warm-500">
                      {link.description}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {!loading && !metrics && !error && (
        <EmptyState
          title="Front desk is not configured"
          description="Metrics could not be loaded for this school. Try refreshing."
          actionButton={
            <Button variant="outline" onClick={load}>
              Refresh
            </Button>
          }
        />
      )}
    </div>
  );
}
