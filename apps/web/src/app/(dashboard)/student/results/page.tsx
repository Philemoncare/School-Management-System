'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import {
  GraduationCap,
  Trophy,
  Loader2,
  CheckCircle
} from 'lucide-react';

export default function StudentResultsPortal() {
  const { activeSchoolId } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/results')
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm">
        <h1 className="text-2xl font-bold text-charcoal-900 flex items-center gap-2">
          <GraduationCap className="text-forest-700" />
          My Published Results
        </h1>
        <p className="text-warm-500 text-sm">Official academic records and terminal grades released by the registry.</p>
      </div>

      <div className="bg-card border border-warm-100 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ivory-50 text-[11px] font-bold text-warm-400 uppercase tracking-wider border-b border-warm-100">
                <th className="p-4">Subject</th>
                <th className="p-4">Academic Year</th>
                <th className="p-4">Term</th>
                <th className="p-4">Weighted Score</th>
                <th className="p-4">Percentage</th>
                <th className="p-4">Grade</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-50 text-sm text-warm-700 font-medium">
              {results.map((res) => (
                <tr key={res.id} className="hover:bg-ivory-50/50 transition-colors">
                  <td className="p-4 font-bold text-charcoal-900">{res.subject?.name} ({res.subject?.code})</td>
                  <td className="p-4 text-xs text-warm-500">{res.academicYear?.name}</td>
                  <td className="p-4 text-xs">{res.term?.name || 'Annual'}</td>
                  <td className="p-4">{res.weightedScore}</td>
                  <td className="p-4 text-forest-700 font-bold">{res.percentage?.toFixed(1)}%</td>
                  <td className="p-4"><span className="px-2 py-0.5 rounded-md font-bold bg-warm-100 text-charcoal-800">{res.grade}</span></td>
                  <td className="p-4">
                    <span className="flex items-center gap-1 text-xs text-success-600 font-bold">
                      <CheckCircle size={12} /> Published
                    </span>
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center p-12 text-warm-400 italic font-medium">
                    <Trophy className="mx-auto text-warm-200 mb-2" size={40} />
                    No published results available yet.
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

