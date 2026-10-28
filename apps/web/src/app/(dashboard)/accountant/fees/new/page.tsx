'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Layers } from 'lucide-react';
import { FeeStructureForm } from '@/components/finance/fee-structure-form';

export default function NewFeeStructurePage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <Link
          href="/accountant/fees"
          className="rounded-lg border border-warm-200 bg-card p-2 text-warm-600 transition-colors hover:text-charcoal-900"
          aria-label="Back to fee configuration"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-charcoal-900">
            <Layers className="text-forest-700" size={24} /> New fee item
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Configure the amount, scope and payment deadline for student billing.
          </p>
        </div>
      </div>

      <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
        <FeeStructureForm
          onCancel={() => router.push('/accountant/fees')}
          onSaved={() => router.push('/accountant/fees')}
        />
      </section>
    </div>
  );
}
