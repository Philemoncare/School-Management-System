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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <BookMarked className="text-blue-600" /> Teaching Assignments
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Academic Year 2026/2027 • Authorized Classes Only</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden mb-10">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search classes or subjects..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center py-20">
               <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          )}

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Class & Section</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Academic Period</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Role</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((assignment) => (
                <tr key={assignment.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center font-black text-blue-600 text-lg border border-blue-50 group-hover:bg-white transition-colors">
                          {assignment.section.class.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-tight">{assignment.section.class.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 tracking-tighter">Section {assignment.section.name}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-black uppercase tracking-tight">{assignment.subject.code}</span>
                       <p className="text-sm font-black text-gray-800">{assignment.subject.name}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col">
                       <span className="text-xs font-black text-gray-700">{assignment.academicYear.name}</span>
                       <span className="text-[9px] font-bold text-gray-400 uppercase">{assignment.term?.name || 'Full Year'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                       {assignment.designation.replace(/_/g, ' ')}
                     </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link
                      href={`/teacher/attendance?classId=${assignment.section.classId}&sectionId=${assignment.sectionId}`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
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
              <Layers className="mx-auto text-gray-200 mb-4" size={64} />
              <p className="text-gray-400 font-black text-lg uppercase tracking-widest">No assigned classes found</p>
              <p className="text-gray-400 text-sm mt-1 font-medium">Please contact administration if this is an error.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
