'use client';

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { ChildProvider } from '@/context/child-context';
import { FeatureErrorBoundary } from '@/components/common/feature-error-boundary';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-ivory-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-forest-700 border-t-terracotta-500"></div>
          <p className="text-warm-500 font-bold text-xs uppercase tracking-wider">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const roles = collectUserRoles(user);
  const isParent = roles.includes('GUARDIAN') || roles.includes('PARENT');

  const layout = (
    <AuthenticatedLayout>
      <FeatureErrorBoundary fallbackTitle="Dashboard component failed to load">
        {children}
      </FeatureErrorBoundary>
    </AuthenticatedLayout>
  );

  return isParent ? (
    <ChildProvider>
      {layout}
    </ChildProvider>
  ) : layout;
}
