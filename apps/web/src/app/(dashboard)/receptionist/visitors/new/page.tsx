'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { VisitorForm } from '@/components/front-office/forms';
import { showFeedback } from '@/components/layout/global-feedback';

export default function NewVisitorPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/receptionist/visitors"
          className="rounded-lg border border-warm-200 bg-card p-2 text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to visitors desk"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-charcoal-900">
            <UserPlus className="text-forest-700" size={24} /> Register visitor
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Capture the visitor’s details, then check them in from the visitors desk.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <VisitorForm
          onCancel={() => router.push('/receptionist/visitors')}
          onSaved={(visitor) => {
            showFeedback('SUCCESS', `${visitor.fullName} registered.`);
            router.push('/receptionist/visitors');
          }}
        />
      </section>
    </div>
  );
}
