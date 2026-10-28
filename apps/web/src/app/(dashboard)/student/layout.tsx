'use client';

import React from 'react';
import Link from 'next/link';
import { Lock, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default function StudentPortalLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, activeSchoolId } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
        <RefreshCw size={16} className="animate-spin" /> Checking portal access…
      </div>
    );
  }

  const roles = collectUserRoles(user, activeSchoolId);
  if (!roles.includes('STUDENT')) {
    return (
      <EmptyState
        title="Student portal access only"
        description="These pages belong to the student portal and are available to learners with a student profile. Staff should use the main workspace instead."
        icon={<Lock className="h-8 w-8" />}
        actionButton={
          <Link href="/dashboard">
            <Button variant="primary" size="sm">Back to Dashboard</Button>
          </Link>
        }
      />
    );
  }

  return <>{children}</>;
}
