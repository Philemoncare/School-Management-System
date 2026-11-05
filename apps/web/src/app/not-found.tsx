'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { AlertTriangle, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  const pathname = usePathname();
  const { user } = useAuth();
  const roles = user ? collectUserRoles(user, null) : [];

  const isSuperAdmin = roles.some(
    (r) =>
      r === 'PLATFORM_SUPER_ADMIN' ||
      r === 'PLATFORM_OPERATIONS_ADMIN' ||
      r === 'PLATFORM_SUPPORT_ADMIN' ||
      r === 'SUPER_ADMIN',
  );

  const homeHref = isSuperAdmin
    ? '/super-admin'
    : roles.includes('TEACHER')
      ? '/teacher/dashboard'
      : roles.includes('ACCOUNTANT')
        ? '/accountant/dashboard'
        : roles.includes('LIBRARIAN')
          ? '/librarian/dashboard'
          : roles.includes('RECEPTIONIST')
            ? '/receptionist/dashboard'
            : '/dashboard';

  return (
    <div className="min-h-screen flex items-center justify-center bg-ivory-50">
      <div className="max-w-lg w-full px-6 sm:px-8 lg:px-12">
        <div className="rounded-3xl border border-warm-200 bg-card p-8 sm:p-12 shadow-xs text-center">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-danger-50 mx-auto mb-6">
            <AlertTriangle size={32} className="text-danger-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-charcoal-900 sm:text-4xl">
            Page not found
          </h1>
          <p className="mt-2 text-warm-600">
            The page <span className="font-mono text-sm">{pathname}</span> could not be found.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={homeHref}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-800 px-5 py-3 text-sm font-semibold text-ivory-50 shadow-xs transition-colors hover:bg-forest-900"
            >
              <Home size={16} />
              Go to {isSuperAdmin ? 'Platform' : 'School'} Dashboard
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-warm-200 px-5 py-3 text-xs font-semibold text-warm-600 transition-colors hover:bg-warm-50"
            >
              <ArrowLeft size={14} />
              Sign in
            </Link>
          </div>

          {!isSuperAdmin && (
            <p className="mt-6 text-[11px] font-bold uppercase tracking-wide text-warm-400">
              If you believe this page should exist, please contact your school administrator.
            </p>
          )}
          {isSuperAdmin && (
            <p className="mt-6 text-[11px] font-bold uppercase tracking-wide text-warm-400">
              If you believe this page should exist, please verify the URL and try again.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
