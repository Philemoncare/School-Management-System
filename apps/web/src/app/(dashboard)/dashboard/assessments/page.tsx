'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import Link from 'next/link';
import {
  FileText,
  Settings,
  Plus,
  ChevronRight,
  TrendingUp,
  BarChart3,
  Layers,
  FileCheck2,
  Trophy,
  Loader2
} from 'lucide-react';

export default function AssessmentDashboard() {
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/assessments')
      .then(setAssessments)
      .finally(() => setLoading(false));
  }, []);

  const modules = [
    { name: 'Active Assessments', description: 'Manage exams and assignments', href: '/dashboard/assessments/list', icon: FileText, color: 'bg-forest-700' },
    { name: 'Evaluation Types', description: 'Configure academic categories', href: '/dashboard/assessments/types', icon: Layers, color: 'bg-success-600' },
    { name: 'Grading Scales', description: 'Configure rules and bands', href: '/dashboard/assessments/grading', icon: Trophy, color: 'bg-terracotta-600' },
    { name: 'Score Entry', description: 'Submit student performances', href: '/dashboard/assessments/scores', icon: BarChart3, color: 'bg-terracotta-600' },
  ];

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Examination Hub</h1>
          <p className="text-warm-500 mt-1 font-medium">Academic evaluation, scoring and result publication.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="group block bg-card border border-warm-200 rounded-xl p-8 hover:shadow-xs hover:border-sage-200 transition-all relative overflow-hidden"
          >
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                   <div className={`${module.color} p-5 rounded-3xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                      <module.icon size={28} />
                   </div>
                   <div>
                      <h3 className="text-xl font-semibold text-charcoal-900 group-hover:text-forest-700 transition-colors">{module.name}</h3>
                      <p className="text-sm text-warm-500 mt-1 font-medium">{module.description}</p>
                   </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-ivory-50 flex items-center justify-center text-warm-400 group-hover:bg-sage-50 group-hover:text-forest-700 transition-all">
                  <ChevronRight size={24} />
                </div>
             </div>
          </Link>
        ))}
      </div>

      <div className="bg-card border border-warm-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-8 border-b border-warm-100 flex justify-between items-center bg-ivory-50/50">
           <h2 className="text-lg font-semibold text-charcoal-900">Recent Assessment Status</h2>
           <button className="text-xs font-semibold text-forest-700 uppercase tracking-wide hover:underline">View All</button>
        </div>
        <div className="relative">
          {loading && <div className="absolute inset-0 bg-card/60 flex items-center justify-center"><Loader2 className="animate-spin text-forest-700" size={32} /></div>}
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50/50">
              <tr>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Assessment</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Target</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {assessments.map((a) => (
                <tr key={a.id} className="hover:bg-sage-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <p className="text-sm font-semibold text-charcoal-900 leading-tight">{a.name}</p>
                    <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5">{a.assessmentType.name} • {a.subject.name}</p>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-xs font-bold text-warm-700">{a.class.name} {a.section?.name}</p>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tighter ${
                      a.status === 'PUBLISHED' ? 'bg-success-100 text-success-700' : 'bg-sage-100 text-forest-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <Link href={`/dashboard/assessments/${a.id}/scores`} className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide hover:underline">
                      Enter Scores
                    </Link>
                  </td>
                </tr>
              ))}
              {assessments.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <FileCheck2 className="mx-auto text-warm-200 mb-4" size={64} />
                    <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No active assessments found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
