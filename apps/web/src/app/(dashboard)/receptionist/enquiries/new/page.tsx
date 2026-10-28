'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ClipboardCheck } from 'lucide-react';
import { EnquiryForm } from '@/components/front-office/forms';
import { showFeedback } from '@/components/layout/global-feedback';

export default function NewEnquiryPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/receptionist/enquiries"
          className="rounded-lg border border-warm-200 bg-card p-2 text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to enquiries"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-charcoal-900">
            <ClipboardCheck className="text-forest-700" size={24} /> Log enquiry
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Capture a walk-in or phone enquiry for follow-up.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <EnquiryForm
          onCancel={() => router.push('/receptionist/enquiries')}
          onSaved={(enquiry) => {
            showFeedback('SUCCESS', `${enquiry.referenceNumber} logged.`);
            router.push('/receptionist/enquiries');
          }}
        />
      </section>
    </div>
  );
}
