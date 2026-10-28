'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { UserCheck, Loader2, Mail } from 'lucide-react';

export default function StudentTeachers() {
  const { activeSchoolId } = useAuth();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/teachers')
      .then(setAssignments)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm">
        <h1 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <UserCheck className="text-forest-700" />
          My Instructors & Teachers
        </h1>
        <p className="text-warm-500 text-sm">Connect with the certified faculty members assigned to your active academic course units.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment: any) => (
          <div key={assignment.id} className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm flex flex-col justify-between group hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-sage-50 rounded-xl flex items-center justify-center text-forest-700 font-bold text-lg shrink-0">
                {assignment.teacher?.firstName?.[0]}
              </div>
              <div>
                <h3 className="font-bold text-charcoal-900 text-base group-hover:text-forest-700 transition-colors">
                  {assignment.teacher?.firstName} {assignment.teacher?.lastName}
                </h3>
                <p className="text-xs text-forest-700 font-semibold uppercase tracking-wider mt-0.5">
                  {assignment.designation || 'Subject Teacher'}
                </p>
                <p className="text-xs text-warm-500 font-medium mt-2 bg-ivory-50 px-2 py-1 rounded-md border border-warm-100 inline-block">
                  Module: {assignment.subject?.name}
                </p>
              </div>
            </div>

            {assignment.teacher?.specialization && (
              <div className="mt-4 pt-3 border-t border-ivory-50 text-xs text-warm-500 font-medium">
                <span className="font-bold text-warm-400 block uppercase text-[11px] tracking-wider mb-0.5">Specialization</span>
                {assignment.teacher.specialization}
              </div>
            )}
          </div>
        ))}

        {assignments.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 bg-card rounded-2xl p-12 text-center border border-warm-100 shadow-sm text-warm-400 italic">
            No teacher assignments mapped to your current enrollment context.
          </div>
        )}
      </div>
    </div>
  );
}
