'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Users,
  Search,
  Filter,
  ChevronRight,
  GraduationCap,
  Mail,
  Loader2,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function MyStudentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch('/teacher-portal/students')
      .then(setEnrollments)
      .finally(() => setLoading(false));
  }, []);

  const filtered = enrollments.filter(e =>
    `${e.student.firstName} ${e.student.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    e.student.studentNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <GraduationCap className="text-blue-600" /> My Students
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Academic Year 2026/2027 • Scoped to Assigned Classes</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search students by name or ID..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 shadow-sm"><Filter size={18}/></button>
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
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Profile</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Placement</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((e) => (
                <tr key={e.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-500 border border-gray-100 group-hover:bg-white transition-colors">
                        {e.student.firstName[0]}{e.student.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-tight">{e.student.firstName} {e.student.lastName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{e.student.studentNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <p className="text-sm font-black text-gray-800">{e.class.name}</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Section {e.section?.name || 'A'}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      e.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {e.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                     <Link href={`/dashboard/students/${e.studentId}`} className="inline-flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">
                        View Profile <ExternalLink size={14}/>
                     </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <div className="py-32 text-center">
              <Users className="mx-auto text-gray-200 mb-4" size={64} />
              <p className="text-gray-400 font-black text-lg uppercase tracking-widest">No matching students found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
