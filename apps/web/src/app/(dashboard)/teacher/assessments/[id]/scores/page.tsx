'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  Save,
  Loader2,
  Trophy,
  Users,
  AlertCircle,
  FileCheck2,
  CheckCircle2
} from 'lucide-react';

export default function ScoreEntryPage() {
  const { id } = useParams();
  const router = useRouter();
  const [assessment, setAssessment] = useState<any>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [remarks, setRemarks] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const data = await apiFetch(`/assessments/${id}`);
      setAssessment(data);

      const initialScores: Record<string, number> = {};
      const initialRemarks: Record<string, string> = {};
      data.scores.forEach((s: any) => {
        initialScores[s.studentId] = s.rawScore;
        initialRemarks[s.studentId] = s.remarks || '';
      });
      setScores(initialScores);
      setRemarks(initialRemarks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSuccess(false);
    try {
      const records = Object.entries(scores).map(([studentId, score]) => ({
        studentId,
        rawScore: score,
        remarks: remarks[studentId],
      }));

      await apiFetch(`/assessments/${id}/bulk-mark`, {
        method: 'POST',
        body: JSON.stringify({ scores: records })
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert('Failed to save scores');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2.5 bg-card border border-warm-200 rounded-2xl hover:bg-ivory-50 transition-colors shadow-sm text-warm-500">
             <ChevronLeft size={20} />
           </button>
           <div>
             <h1 className="text-2xl font-semibold text-charcoal-900 tracking-tight leading-none">{assessment.name}</h1>
             <p className="text-warm-400 font-bold uppercase tracking-wide text-[11px] mt-2">
               {assessment.subject.name} • {assessment.class.name} {assessment.section?.name} • Max {assessment.totalMarks} Marks
             </p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           {success && (
             <div className="flex items-center gap-2 text-success-600 font-semibold text-[11px] uppercase bg-success-50 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-right-4">
                <CheckCircle2 size={16} /> Scores Synced
             </div>
           )}
           <button
             onClick={handleSave}
             disabled={saving}
             className="bg-forest-700 text-white px-8 py-2.5 rounded-2xl font-semibold text-sm uppercase tracking-wide hover:bg-forest-800 shadow-xs shadow-sage-100 flex items-center gap-2 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save All Drafts
           </button>
        </div>
      </div>

      {/* Spreadsheet Interface */}
      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 bg-ivory-50/50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Trophy size={18} className="text-forest-700" />
              <span className="text-sm font-semibold text-charcoal-900">Score Entry Spreadsheet</span>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Weight: {assessment.weight}x</span>
           </div>
        </div>

        <table className="min-w-full divide-y divide-warm-200">
           <thead className="bg-card">
              <tr>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student</th>
                 <th className="px-8 py-5 text-center text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Raw Score (/{assessment.totalMarks})</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Performance Remark</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-warm-100 bg-card">
              {assessment.scores.map((record: any) => (
                <tr key={record.student.id} className="hover:bg-sage-50/20 transition-colors focus-within:bg-sage-50/40">
                   <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center font-semibold text-warm-400 text-xs">
                           {record.student.firstName[0]}
                         </div>
                         <div>
                            <p className="text-sm font-semibold text-charcoal-900 leading-tight">{record.student.firstName} {record.student.lastName}</p>
                            <p className="text-[11px] font-bold text-warm-400 uppercase">{record.student.studentNumber}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-4">
                      <div className="flex justify-center">
                         <input
                           type="number"
                           max={assessment.totalMarks}
                           min={0}
                           className="w-24 bg-ivory-50 border-2 border-transparent rounded-xl px-4 py-2 text-center text-sm font-semibold text-charcoal-900 focus:border-forest-700 focus:bg-card focus:ring-0 transition-all"
                           value={scores[record.studentId] ?? ''}
                           onChange={(e) => setScores({...scores, [record.studentId]: parseFloat(e.target.value)})}
                         />
                      </div>
                   </td>
                   <td className="px-8 py-4">
                      <input
                        type="text"
                        placeholder="Add a brief note..."
                        className="w-full bg-ivory-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-warm-700 focus:ring-2 focus:ring-forest-700 focus:bg-card transition-all"
                        value={remarks[record.studentId] || ''}
                        onChange={(e) => setRemarks({...remarks, [record.studentId]: e.target.value})}
                      />
                   </td>
                </tr>
              ))}
           </tbody>
        </table>

        {assessment.scores.length === 0 && (
          <div className="py-20 text-center text-warm-400 uppercase font-semibold tracking-wide text-[11px]">No students found for this class context</div>
        )}
      </div>

      {/* Footer Guidance */}
      <div className="flex items-center gap-3 p-6 bg-terracotta-50 rounded-xl border border-terracotta-100">
         <AlertCircle className="text-terracotta-600 shrink-0" size={24} />
         <p className="text-xs font-bold text-terracotta-800 leading-relaxed">
           Scores are saved as drafts. They will not be visible to students or parents until they are validated by the department head and published by the administration.
         </p>
      </div>
    </div>
  );
}
