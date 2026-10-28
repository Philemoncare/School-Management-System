'use client';

import React, { useEffect, useState } from 'react';
import { useChild } from '@/context/child-context';
import { useAuth } from '@/context/auth-context';
import { FileSpreadsheet, Award, Calendar } from 'lucide-react';

export default function ParentResults() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResults() {
      if (!activeChild || !activeSchoolId) return;
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/parent/children/${activeChild.id}/results`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-school-id': activeSchoolId,
          },
        });
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Failed to fetch results:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchResults();
  }, [activeChild, activeSchoolId]);

  if (childLoading || loading) return <div>Loading report cards and academic results...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-charcoal-900">Academic Results & Performance</h1>
        <p className="text-warm-500">Official published term sheets and grading reports for {activeChild?.firstName}.</p>
      </div>

      <div className="bg-card rounded-2xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100">
          <h2 className="text-lg font-bold text-charcoal-900 flex items-center gap-2">
            <Award size={20} className="text-forest-700" />
            Term-End Results
          </h2>
        </div>
        <div className="p-6">
          {results.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map((result) => (
                <div key={result.id} className="p-4 rounded-xl bg-ivory-50 border border-warm-100 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-charcoal-900 text-sm">{result.subject?.name}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-warm-500 font-medium">
                      <Calendar size={12} />
                      <span>{result.academicYear?.name} • {result.term?.name || 'Full Year'}</span>
                    </div>
                    {result.remark && <p className="text-xs text-warm-400 mt-2 font-medium italic">"{result.remark}"</p>}
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <div className="text-xl font-semibold text-forest-700 bg-sage-50 px-3 py-1 rounded-lg border border-sage-100">
                      {result.grade}
                    </div>
                    <span className="text-[11px] font-bold text-warm-400 uppercase tracking-wider">{result.weightedScore}% Score</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileSpreadsheet size={40} className="text-warm-300 mx-auto mb-3" />
              <p className="text-warm-500 font-medium">No official term results have been published yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
