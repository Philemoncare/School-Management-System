'use client';

import React from 'react';
import Link from 'next/link';
import { GraduationCap, ChevronRight, Calendar, BookOpen, UserCheck, CreditCard, MapPin, Inbox, RefreshCw } from 'lucide-react';
import { useChild } from '@/context/child-context';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';

export default function ChildrenOverview() {
  const { children, loading, setActiveChild } = useChild();

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
        <RefreshCw size={16} className="animate-spin" /> Loading family overview…
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <EmptyState
        title="No children linked yet"
        description="Your school has not linked any student records to this guardian account. Contact the school office to complete the link."
        icon={<Inbox className="h-8 w-8" />}
        actionButton={<Link href="/dashboard/messages"><Button variant="outline" size="sm">Message the School</Button></Link>}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">My Children</h1>
        <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
          {children.length} linked {children.length === 1 ? 'child' : 'children'} in this school.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {children.map((child) => (
          <ChildCard key={child.id} child={child} onSelect={() => setActiveChild(child)} />
        ))}
      </div>
    </div>
  );
}

function ChildCard({ child, onSelect }: { child: any; onSelect: () => void }) {
  const enrollment = child.enrollments?.[0];
  const initials = `${child.firstName?.[0] || ''}${child.lastName?.[0] || ''}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs transition-shadow hover:shadow-md">
      <div className="p-5 sm:p-6">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-forest-700 text-lg font-bold text-white shadow-md shadow-sage-200">
            {child.photo ? (
              <img src={child.photo} alt={`${child.firstName} ${child.lastName}`} className="h-full w-full object-cover" />
            ) : (
              initials || '?'
            )}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-bold text-charcoal-900 sm:text-lg">
              {child.firstName} {child.lastName}
            </h3>
            <p className="text-[11px] font-bold uppercase tracking-wider text-forest-700">
              {child.relation || 'Guardian'} {child.isPrimary ? '• Primary contact' : ''}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-0.5 text-[11px] font-bold uppercase ${
                child.status === 'ACTIVE'
                  ? 'border-success-100 bg-success-50 text-success-700'
                  : 'border-warm-200 bg-ivory-50 text-warm-500'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${child.status === 'ACTIVE' ? 'bg-success-500' : 'bg-warm-400'}`} />
                {child.status || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-5 space-y-3">
          <div className="flex items-center gap-3 text-warm-500">
            <GraduationCap size={16} className="shrink-0" />
            <span className="truncate text-sm font-medium">
              {enrollment?.class?.name || 'Not enrolled'}
              {enrollment?.section?.name ? ` • Section ${enrollment.section.name}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-3 text-warm-500">
            <Calendar size={16} className="shrink-0" />
            <span className="truncate text-sm font-medium">
              {enrollment?.academicYear?.name || 'No active academic year'}
              {enrollment?.term?.name ? ` • ${enrollment.term.name}` : ''}
            </span>
          </div>
          <div className="flex items-center gap-3 text-warm-500">
            <UserCheck size={16} className="shrink-0" />
            <span className="truncate text-sm font-medium">Student No: {child.studentNumber || '—'}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <QuickAction href="/parent/results" icon={<BookOpen size={14} />} label="Academic" onSelect={onSelect} />
          <QuickAction href="/parent/attendance" icon={<Calendar size={14} />} label="Attendance" onSelect={onSelect} />
          <QuickAction href="/parent/fees" icon={<CreditCard size={14} />} label="Finance" onSelect={onSelect} />
          <QuickAction href="/parent/transport" icon={<MapPin size={14} />} label="Transport" onSelect={onSelect} />
        </div>
      </div>

      <Link
        href={`/parent/children/${child.id}`}
        onClick={onSelect}
        className="flex w-full items-center justify-center gap-2 border-t border-warm-100 bg-ivory-50 py-3.5 text-sm font-bold text-warm-600 transition-colors hover:bg-warm-100 hover:text-forest-800"
      >
        View Full Profile
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

function QuickAction({ href, icon, label, onSelect }: { href: string; icon: React.ReactNode; label: string; onSelect: () => void }) {
  return (
    <Link
      href={href}
      onClick={onSelect}
      className="flex min-h-[40px] items-center gap-2 rounded-xl border border-warm-200 bg-ivory-50 p-2 text-[11px] font-bold text-warm-600 transition-colors hover:border-sage-200 hover:bg-sage-50 hover:text-forest-800"
    >
      <span className="text-forest-700">{icon}</span>
      {label}
    </Link>
  );
}
