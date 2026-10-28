'use client';

import React from 'react';
import { useChild } from '@/context/child-context';
import {
  GraduationCap,
  ChevronRight,
  MapPin,
  Calendar,
  BookOpen,
  UserCheck,
  CreditCard
} from 'lucide-react';
import Link from 'next/link';

export default function ChildrenOverview() {
  const { children, loading } = useChild();

  if (loading) return <div>Loading family overview...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">My Children</h1>
          <p className="text-warm-500">Manage and view information for all your linked children.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {children.map((child) => (
          <ChildCard key={child.id} child={child} />
        ))}
      </div>
    </div>
  );
}

function ChildCard({ child }: { child: any }) {
  const enrollment = child.enrollments?.[0];

  return (
    <div className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex gap-4">
            <div className="w-16 h-16 rounded-2xl bg-forest-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-sage-200 overflow-hidden">
              {child.photo ? (
                <img src={child.photo} alt={child.firstName} className="w-full h-full object-cover" />
              ) : (
                child.firstName[0]
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-charcoal-900">{child.firstName} {child.lastName}</h3>
              <p className="text-xs font-semibold text-forest-700 uppercase tracking-wider">{child.relation}</p>
              <div className="mt-2 flex items-center gap-2 px-2 py-0.5 rounded-lg bg-success-50 border border-success-100 w-fit">
                <div className="w-1.5 h-1.5 rounded-full bg-success-500 animate-pulse" />
                <span className="text-[11px] font-bold text-success-700 uppercase">{child.status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-warm-500">
            <GraduationCap size={16} />
            <span className="text-sm font-medium">{enrollment?.class?.name || 'Not Enrolled'} • Section {enrollment?.section?.name || 'TBA'}</span>
          </div>
          <div className="flex items-center gap-3 text-warm-500">
            <Calendar size={16} />
            <span className="text-sm font-medium">Academic Year: {enrollment?.academicYear?.name || 'N/A'}</span>
          </div>
          <div className="flex items-center gap-3 text-warm-500">
            <UserCheck size={16} />
            <span className="text-sm font-medium">Attendance: 98.5% (Overall)</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <QuickAction href={`/parent/dashboard?studentId=${child.id}`} icon={<BookOpen size={14} />} label="Academic" />
          <QuickAction href={`/parent/attendance?studentId=${child.id}`} icon={<Calendar size={14} />} label="Attendance" />
          <QuickAction href={`/parent/fees?studentId=${child.id}`} icon={<CreditCard size={14} />} label="Finance" />
          <QuickAction href={`/parent/transport?studentId=${child.id}`} icon={<MapPin size={14} />} label="Transport" />
        </div>
      </div>

      <Link
        href={`/parent/children/${child.id}/profile`}
        className="w-full py-4 bg-ivory-50 border-t border-warm-100 flex items-center justify-center gap-2 text-sm font-bold text-warm-600 hover:bg-forest-700 hover:text-white transition-all group-hover:bg-warm-100"
      >
        View Full Profile
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

function QuickAction({ href, icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2 p-2 rounded-xl border border-warm-100 bg-ivory-50/50 hover:bg-sage-50 hover:border-sage-100 hover:text-forest-800 transition-all text-[11px] font-bold text-warm-600"
    >
      <span className="text-forest-700">{icon}</span>
      {label}
    </Link>
  );
}
