'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  BookMarked,
  Users,
  Search,
  ChevronRight,
  MoreVertical,
  Calendar,
  Layers,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function MyClassesPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch('/teacher-portal/assignments')
      .then(setAssignments)
      .finally(() => setLoading(false));
  }, []);

  const filtered = assignments.filter(a =>
    a.subject.name.toLowerCase().includes(search.toLowerCase()) ||
    a.section.class.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
             <BookMarked className="text-forest-700" /> Teaching Assignments
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Academic Year 2026/2027 • Authorized Classes Only</p>
        </div>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input
                type="text"
                placeholder="Search classes or subjects..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold placeholder:text-warm-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75 py-20">
               <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Class & Section</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Subject</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Academic Period</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Role</th>
                <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {filtered.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-sage-50/30 transition-colors group">
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-sage-100 flex items-center justify-center font-semibold text-forest-700 text-lg border border-sage-50 group-hover:bg-card transition-colors">
                          {assignment.section.class.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-charcoal-900 leading-tight">{assignment.section.class.name}</p>
                          <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5 tracking-tighter">Section {assignment.section.name}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-warm-100 text-warm-600 rounded-lg text-xs font-semibold uppercase tracking-tight">{assignment.subject.code}</span>
                       <p className="text-sm font-semibold text-charcoal-800">{assignment.subject.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="text-xs font-semibold text-warm-700">{assignment.academicYear.name}</span>
                       <span className="text-[11px] font-bold text-warm-400 uppercase">{assignment.term?.name || 'Full Year'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <span className="px-2.5 py-1 bg-terracotta-50 text-terracotta-700 rounded-full text-[11px] font-semibold uppercase tracking-wide">
                       {assignment.designation.replace(/_/g, ' ')}
                     </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link
                      href={`/teacher/attendance?classId=${assignment.section.classId}&sectionId=${assignment.sectionId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-warm-200 rounded-xl text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:bg-forest-700 hover:text-white hover:border-forest-700 transition-all shadow-sm"
                    >
                       Mark Attendance <ChevronRight size={14}/>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <div className="py-32 text-center">
              <Layers className="mx-auto text-warm-200 mb-4" size={64} />
              <p className="text-warm-400 font-semibold text-lg uppercase tracking-wide">No assigned classes found</p>
              <p className="text-warm-400 text-sm mt-1 font-medium">Please contact administration if this is an error.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
