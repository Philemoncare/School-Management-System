'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  FileText,
  Search,
  Plus,
  ChevronRight,
  MoreVertical,
  Layers,
  BarChart3,
  Loader2,
  Trophy
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherAssessmentsPage() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    // In a real implementation we would fetch assessments for the teacher's assigned subjects
    apiFetch('/assessments')
      .then(setAssessments)
      .finally(() => setLoading(false));
  }, []);

  const filtered = assessments.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.subject.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <Trophy className="text-blue-600" /> My Assessments
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Manage evaluations and student performance scoring.</p>
        </div>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center gap-2">
          <Plus size={20} /> Create New Assessment
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by assessment name or subject..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
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
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Assessment Details</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Class & Subject</th>
                <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Grading Status</th>
                <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-black text-gray-900 leading-tight">{a.name}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">{a.assessmentType.name} • Max {a.totalMarks}</p>
                  </td>
                  <td className="px-8 py-6">
                     <p className="text-sm font-black text-gray-800">{a.subject.name}</p>
                     <p className="text-[10px] font-bold text-gray-400 uppercase">{a.class.name} {a.section?.name}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      a.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link
                      href={`/teacher/assessments/${a.id}/scores`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                    >
                       Enter Scores <ChevronRight size={14}/>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <div className="py-32 text-center">
              <FileText className="mx-auto text-gray-200 mb-4" size={64} />
              <p className="text-gray-400 font-black text-lg uppercase tracking-widest">No assessments found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
