'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { BookOpen, User, ArrowRight, Book } from 'lucide-react';
import Link from 'next/link';

export default function StudentSubjects() {
  const { activeSchoolId } = useAuth();
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSubjects() {
      if (!activeSchoolId) return;
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/student/subjects`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-school-id': activeSchoolId,
          },
        });
        const data = await response.json();
        setSubjects(data);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchSubjects();
  }, [activeSchoolId]);

  if (loading) return <div className="p-8 text-center text-warm-500 font-bold text-xs uppercase tracking-wider">Loading your curriculum...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-charcoal-900 tracking-tight">My Subjects</h1>
        <p className="text-warm-500 text-sm font-medium">Overview of your enrolled courses and assigned teachers.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((cs: any) => (
          <div key={cs.id} className="bg-card rounded-3xl border border-warm-200 shadow-xs overflow-hidden hover:shadow-md transition-all group">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-2xl bg-sage-50 text-forest-700 group-hover:bg-forest-700 group-hover:text-white transition-colors shadow-xs">
                  <BookOpen size={24} />
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide leading-none mb-1">Subject Code</p>
                  <p className="text-sm font-semibold text-charcoal-900 leading-none">{cs.subject.code}</p>
                </div>
              </div>

              <h3 className="text-xl font-bold text-charcoal-900 mb-2 group-hover:text-forest-700 transition-colors">{cs.subject.name}</h3>
              <p className="text-sm text-warm-500 line-clamp-2 mb-6 font-medium">{cs.subject.description || 'No description available for this subject.'}</p>

              <div className="space-y-3">
                <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Assigned Teachers</p>
                {cs.subject.teacherAssignments?.length > 0 ? (
                  cs.subject.teacherAssignments.map((ta: any) => (
                    <div key={ta.id} className="flex items-center gap-3 bg-ivory-50 p-2 rounded-xl border border-warm-100">
                      <div className="w-8 h-8 rounded-lg bg-card flex items-center justify-center text-warm-400 border border-warm-200">
                        <User size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-charcoal-900 truncate">{ta.teacher.firstName} {ta.teacher.lastName}</p>
                        <p className="text-[11px] font-bold text-forest-700 uppercase tracking-wider">{ta.designation}</p>
                      </div>
                    </div>
                  ))
                ) : <p className="text-xs text-warm-400 font-medium italic">No teachers assigned yet.</p>}
              </div>
            </div>

            <div className="p-4 bg-ivory-50/50 border-t border-warm-100 grid grid-cols-2 gap-2">
              <Link href={`/student/subjects/${cs.subject.id}/resources`} className="flex items-center justify-center gap-2 py-2 bg-card rounded-xl border border-warm-200 text-[11px] font-bold text-warm-600 hover:bg-sage-50 hover:border-sage-200 hover:text-forest-700 transition-all">
                <Book size={14} />
                Resources
              </Link>
              <Link href={`/student/subjects/${cs.subject.id}`} className="flex items-center justify-center gap-2 py-2 bg-card rounded-xl border border-warm-200 text-[11px] font-bold text-warm-600 hover:bg-sage-50 hover:border-sage-200 hover:text-forest-700 transition-all">
                Detail
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
