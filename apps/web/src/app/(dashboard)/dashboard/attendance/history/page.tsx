'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  History,
  Search,
  Filter,
  FileSpreadsheet,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical
} from 'lucide-react';

export default function AttendanceHistoryPage() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch paginated attendance records
    setLoading(false);
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <History className="text-blue-600" /> Attendance Audit
          </h1>
          <p className="text-gray-500 font-medium mt-1">Review student attendance history across all classes and subjects.</p>
        </div>
        <button className="bg-white border border-gray-200 text-gray-700 px-6 py-3 rounded-2xl font-bold hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm">
          <FileSpreadsheet size={20} /> Export Audit Log
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input type="text" placeholder="Search by student name, ID or date..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold placeholder:text-gray-400" />
           </div>
           <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-bold text-gray-600 shadow-sm"><Calendar size={16}/> Select Range</button>
              <button className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 shadow-sm"><Filter size={18}/></button>
           </div>
        </div>

        <div className="py-24 text-center">
           <History className="mx-auto text-gray-200 mb-4" size={64} />
           <p className="text-gray-400 font-bold text-lg uppercase tracking-tighter">Unified attendance history will appear here</p>
           <p className="text-gray-400 text-sm mt-1">Audit student presence, tardiness and excused absences in one view.</p>
        </div>
      </div>
    </div>
  );
}
