'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  MoreHorizontal,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import Link from 'next/link';

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/enrollments')
      .then(setEnrollments)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-3">
             <Users className="text-forest-700" /> Enrollment Directory
          </h1>
          <p className="text-warm-500 font-medium mt-1">Manage student placements in classes and sections.</p>
        </div>
        <button className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-bold hover:bg-forest-800 shadow-xs shadow-sage-200 transition-all flex items-center gap-2">
          <UserPlus size={20} /> Enroll New Student
        </button>
      </div>

      <div className="bg-card border border-warm-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex flex-col md:flex-row items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input type="text" placeholder="Search enrollments by name, ID or class..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold placeholder:text-warm-400" />
           </div>
           <div className="flex items-center gap-3">
              <button className="p-2.5 bg-card border border-warm-200 rounded-2xl text-warm-500 hover:bg-ivory-50 shadow-sm"><Filter size={18}/></button>
           </div>
        </div>

        <table className="min-w-full divide-y divide-warm-200">
          <thead className="bg-ivory-50">
            <tr>
              <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student Information</th>
              <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Class & Section</th>
              <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Academic Year</th>
              <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
              <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100 bg-card">
            {loading ? (
              <tr><td colSpan={5} className="px-8 py-10 text-center text-warm-400 animate-pulse font-bold uppercase tracking-tighter">Syncing enrollment data...</td></tr>
            ) : enrollments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                   <BookOpen className="mx-auto text-warm-200 mb-4" size={64} />
                   <p className="text-warm-400 font-bold text-lg">No active enrollments</p>
                   <p className="text-warm-400 text-sm mt-1">Students will appear here once enrolled in a class.</p>
                </td>
              </tr>
            ) : enrollments.map((enrollment) => (
              <tr key={enrollment.id} className="hover:bg-sage-50/30 transition-colors group">
                <td className="px-8 py-5">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center font-bold text-warm-500 border border-warm-100 group-hover:bg-card transition-colors">
                        {enrollment.student.firstName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-charcoal-900 leading-tight">{enrollment.student.firstName} {enrollment.student.lastName}</p>
                        <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5">{enrollment.student.studentNumber}</p>
                      </div>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <p className="text-sm font-semibold text-charcoal-800">{enrollment.class.name}</p>
                   <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight">{enrollment.section?.name || 'Default'}</p>
                </td>
                <td className="px-8 py-5">
                   <span className="text-xs font-bold text-warm-600 bg-warm-100 px-2 py-0.5 rounded-lg">{enrollment.academicYear.name}</span>
                </td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-[11px] font-semibold uppercase tracking-tighter">
                    {enrollment.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/students/${enrollment.studentId}`} className="p-2 text-warm-400 hover:text-forest-700 transition-colors"><ExternalLink size={18}/></Link>
                      <button className="p-2 text-warm-400 hover:text-charcoal-900 transition-colors"><MoreHorizontal size={18}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
