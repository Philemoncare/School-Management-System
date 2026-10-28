'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, CalendarPlus } from 'lucide-react';
import { AppointmentForm } from '@/components/front-office/forms';
import { showFeedback } from '@/components/layout/global-feedback';

export default function NewAppointmentPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/receptionist/appointments"
          className="rounded-lg border border-warm-200 bg-card p-2 text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to appointments"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-charcoal-900">
            <CalendarPlus className="text-forest-700" size={24} /> New appointment
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Book a visit so the host and reception desk are prepared.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <AppointmentForm
          onCancel={() => router.push('/receptionist/appointments')}
          onSaved={() => {
            showFeedback('SUCCESS', 'Appointment booked.');
            router.push('/receptionist/appointments');
          }}
        />
      </section>
    </div>
  );
}
