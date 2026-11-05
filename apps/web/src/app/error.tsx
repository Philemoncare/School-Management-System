'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory-50 px-6">
      <div className="rounded-3xl border border-warm-200 bg-card p-8 sm:p-12 shadow-xs max-w-lg w-full text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-danger-50 mx-auto mb-6">
          <AlertTriangle size={32} className="text-danger-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-2 text-warm-600">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-forest-800 px-5 py-3 text-sm font-semibold text-ivory-50 shadow-xs transition-colors hover:bg-forest-900"
          >
            <RefreshCw size={16} />
            Try again
          </button>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-warm-200 px-5 py-3 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
          >
            <Home size={14} />
            Sign in
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left">
            <summary className="text-[10px] font-bold uppercase tracking-wide text-warm-400 cursor-pointer">
              Technical details
            </summary>
            <pre className="mt-3 text-[9px] text-danger-500 bg-danger-50 rounded-lg p-3 overflow-x-auto break-all">
              {error.stack || error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
