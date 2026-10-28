'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserMinus } from 'lucide-react';
import { StudentCheckoutForm } from '@/components/front-office/forms';
import { showFeedback } from '@/components/layout/global-feedback';

export default function NewStudentCheckoutPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/receptionist/student-checkout"
          className="rounded-lg border border-warm-200 bg-card p-2 text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to student checkout"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-charcoal-900">
            <UserMinus className="text-forest-700" size={24} /> Check out student
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Verify who is collecting the student and why before releasing them.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <StudentCheckoutForm
          onCancel={() => router.push('/receptionist/student-checkout')}
          onSaved={() => {
            showFeedback('SUCCESS', 'Student checked out.');
            router.push('/receptionist/student-checkout');
          }}
        />
      </section>
    </div>
  );
}
