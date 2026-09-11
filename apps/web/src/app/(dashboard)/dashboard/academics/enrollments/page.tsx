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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Users className="text-blue-600" /> Enrollment Directory
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage student placements in classes and sections.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2">
          <UserPlus size={20} /> Enroll New Student
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder="Search enrollments by name, ID or class..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold placeholder:text-gray-400" />
           </div>
           <div className="flex items-center gap-3">
              <button className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 shadow-sm"><Filter size={18}/></button>
           </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Information</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Class & Section</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Academic Year</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr><td colSpan={5} className="px-8 py-10 text-center text-gray-400 animate-pulse font-bold uppercase tracking-tighter">Syncing enrollment data...</td></tr>
            ) : enrollments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-20 text-center">
                   <BookOpen className="mx-auto text-gray-200 mb-4" size={64} />
                   <p className="text-gray-400 font-bold text-lg">No active enrollments</p>
                   <p className="text-gray-400 text-sm mt-1">Students will appear here once enrolled in a class.</p>
                </td>
              </tr>
            ) : enrollments.map((enrollment) => (
              <tr key={enrollment.id} className="hover:bg-blue-50/30 transition-colors group">
                <td className="px-8 py-5">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 border border-gray-100 group-hover:bg-white transition-colors">
                        {enrollment.student.firstName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-tight">{enrollment.student.firstName} {enrollment.student.lastName}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{enrollment.student.studentNumber}</p>
                      </div>
                   </div>
                </td>
                <td className="px-8 py-5">
                   <p className="text-sm font-black text-gray-800">{enrollment.class.name}</p>
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{enrollment.section?.name || 'Default'}</p>
                </td>
                <td className="px-8 py-5">
                   <span className="text-xs font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-lg">{enrollment.academicYear.name}</span>
                </td>
                <td className="px-8 py-5">
                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-tighter">
                    {enrollment.status}
                  </span>
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <Link href={`/dashboard/students/${enrollment.studentId}`} className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><ExternalLink size={18}/></Link>
                      <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><MoreHorizontal size={18}/></button>
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
