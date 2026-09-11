'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  ClipboardList,
  Search,
  Plus,
  ChevronRight,
  MoreVertical,
  Calendar,
  Loader2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // apiFetch('/teacher-portal/assignments-work')
    setLoading(false);
  }, []);

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <ClipboardList className="text-blue-600" /> Class Assignments
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Student Work • Homework • Project Submissions</p>
        </div>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2">
          <Plus size={20} /> Create Assignment
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder="Search assignments..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold" />
           </div>
        </div>

        <div className="py-24 text-center">
           <ClipboardList className="mx-auto text-gray-200 mb-4" size={64} />
           <p className="text-gray-400 font-black text-lg uppercase tracking-widest">Assignment tracking foundation active</p>
           <p className="text-gray-400 text-sm mt-1 font-medium leading-relaxed max-w-xs mx-auto">
             Monitor student homework and project submissions in real-time.
           </p>
        </div>
      </div>
    </div>
  );
}
