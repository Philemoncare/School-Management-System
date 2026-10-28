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
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
             <Trophy className="text-forest-700" /> My Assessments
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Manage evaluations and student performance scoring.</p>
        </div>
        <button className="bg-forest-700 text-white px-8 py-3 rounded-2xl font-semibold text-sm uppercase tracking-wide hover:bg-forest-800 shadow-xs shadow-sage-100 transition-all flex items-center gap-2">
          <Plus size={20} /> Create New Assessment
        </button>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
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
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75 py-20">
               <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Assessment Details</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Class & Subject</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Grading Status</th>
                <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-sage-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <p className="text-sm font-semibold text-charcoal-900 leading-tight">{a.name}</p>
                    <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5">{a.assessmentType.name} • Max {a.totalMarks}</p>
                  </td>
                  <td className="px-8 py-6">
                     <p className="text-sm font-semibold text-charcoal-800">{a.subject.name}</p>
                     <p className="text-[11px] font-bold text-warm-400 uppercase">{a.class.name} {a.section?.name}</p>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tighter ${
                      a.status === 'PUBLISHED' ? 'bg-success-100 text-success-700' : 'bg-sage-100 text-forest-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <Link
                      href={`/teacher/assessments/${a.id}/scores`}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-warm-200 rounded-xl text-[11px] font-semibold uppercase tracking-wide text-forest-700 hover:bg-forest-700 hover:text-white hover:border-forest-700 transition-all shadow-sm"
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
              <FileText className="mx-auto text-warm-200 mb-4" size={64} />
              <p className="text-warm-400 font-semibold text-lg uppercase tracking-wide">No assessments found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
