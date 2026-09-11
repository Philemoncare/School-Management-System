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

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
             <ChevronLeft size={20} />
           </button>
           <div>
             <h1 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{assessment.name}</h1>
             <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px] mt-2">
               {assessment.subject.name} • {assessment.class.name} {assessment.section?.name} • Max {assessment.totalMarks} Marks
             </p>
           </div>
        </div>
        <div className="flex items-center gap-4">
           {success && (
             <div className="flex items-center gap-2 text-green-600 font-black text-[10px] uppercase bg-green-50 px-4 py-2 rounded-xl animate-in fade-in slide-in-from-right-4">
                <CheckCircle2 size={16} /> Scores Synced
             </div>
           )}
           <button
             onClick={handleSave}
             disabled={saving}
             className="bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Save All Drafts
           </button>
        </div>
      </div>

      {/* Spreadsheet Interface */}
      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Trophy size={18} className="text-blue-600" />
              <span className="text-sm font-black text-gray-900">Score Entry Spreadsheet</span>
           </div>
           <div className="flex items-center gap-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Weight: {assessment.weight}x</span>
           </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
           <thead className="bg-white">
              <tr>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                 <th className="px-8 py-5 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Raw Score (/{assessment.totalMarks})</th>
                 <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Performance Remark</th>
              </tr>
           </thead>
           <tbody className="divide-y divide-gray-100 bg-white">
              {assessment.scores.map((record: any) => (
                <tr key={record.student.id} className="hover:bg-blue-50/20 transition-colors focus-within:bg-blue-50/40">
                   <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                         <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xs">
                           {record.student.firstName[0]}
                         </div>
                         <div>
                            <p className="text-sm font-black text-gray-900 leading-tight">{record.student.firstName} {record.student.lastName}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase">{record.student.studentNumber}</p>
                         </div>
                      </div>
                   </td>
                   <td className="px-8 py-4">
                      <div className="flex justify-center">
                         <input
                           type="number"
                           max={assessment.totalMarks}
                           min={0}
                           className="w-24 bg-gray-50 border-2 border-transparent rounded-xl px-4 py-2 text-center text-sm font-black text-gray-900 focus:border-blue-600 focus:bg-white focus:ring-0 transition-all"
                           value={scores[record.studentId] ?? ''}
                           onChange={(e) => setScores({...scores, [record.studentId]: parseFloat(e.target.value)})}
                         />
                      </div>
                   </td>
                   <td className="px-8 py-4">
                      <input
                        type="text"
                        placeholder="Add a brief note..."
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-bold text-gray-700 focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                        value={remarks[record.studentId] || ''}
                        onChange={(e) => setRemarks({...remarks, [record.studentId]: e.target.value})}
                      />
                   </td>
                </tr>
              ))}
           </tbody>
        </table>

        {assessment.scores.length === 0 && (
          <div className="py-20 text-center text-gray-400 uppercase font-black tracking-widest text-[10px]">No students found for this class context</div>
        )}
      </div>

      {/* Footer Guidance */}
      <div className="flex items-center gap-3 p-6 bg-orange-50 rounded-[2rem] border border-orange-100">
         <AlertCircle className="text-orange-600 shrink-0" size={24} />
         <p className="text-xs font-bold text-orange-800 leading-relaxed">
           Scores are saved as drafts. They will not be visible to students or parents until they are validated by the department head and published by the administration.
         </p>
      </div>
    </div>
  );
}
