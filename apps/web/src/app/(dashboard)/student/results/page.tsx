'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  GraduationCap,
  Trophy,
  TrendingUp,
  FileText,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  Download,
  LayoutGrid,
  CheckCircle2
} from 'lucide-react';
import Link from 'next/link';

export default function StudentResultsPortal() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, backend handles current student ID from user token
    apiFetch('/results/my-results?studentId=current')
      .then(setResults)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-center bg-blue-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-4xl font-black tracking-tight">Academic <span className="text-blue-200">Performance</span></h1>
          <p className="text-blue-100 font-bold mt-2 uppercase tracking-widest text-[10px]">Student Results & Historical Transcripts Hub</p>
        </div>
        <div className="relative z-10 flex gap-4">
           <Link href="/student/transcript" className="bg-white/10 border border-white/20 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2">
             <FileText size={18} /> Digital Transcript
           </Link>
        </div>
        <Trophy size={180} className="absolute -right-10 -bottom-10 text-white/10 -rotate-12" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <Calendar className="text-blue-600" /> Terminal Result Sheets
           </h3>

           <div className="space-y-6">
              {results.map((res) => (
                 <div key={res.id} className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all group">
                    <div className="flex flex-col md:flex-row justify-between gap-8">
                       <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-3">
                             <div className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-full tracking-widest">
                                {res.term?.name || 'Annual'}
                             </div>
                             <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{res.academicYear.name}</p>
                          </div>
                          <h4 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">Summary Statement of Results</h4>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4">
                             <Metric label="Average" value={`${res.averagePercentage?.toFixed(1)}%`} color="text-blue-600" />
                             <Metric label="Grade" value="B+" color="text-gray-900" />
                             <Metric label="GPA" value={res.averageGradePoint?.toFixed(2)} color="text-gray-900" />
                             <Metric label="Class Rank" value={`${res.position}/${res.totalStudents}`} color="text-emerald-600" />
                          </div>
                       </div>

                       <div className="flex md:flex-col gap-3 justify-end">
                          <button className="bg-gray-50 text-gray-700 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center gap-2">
                             <Download size={16} /> Save PDF
                          </button>
                          <Link href={`/student/results/${res.id}`} className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
                             Full Breakdown <ChevronRight size={16} />
                          </Link>
                       </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-green-500" />
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Verified by Academic Registry on {new Date(res.publishedAt).toLocaleDateString()}</p>
                       </div>
                    </div>
                 </div>
              ))}

              {results.length === 0 && (
                <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[2.5rem]">
                   <TrendingUp className="mx-auto text-gray-200 mb-4" size={64} />
                   <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No published results found</p>
                   <p className="text-gray-400 text-xs font-medium mt-2">Official results will appear here once authorized by school admin.</p>
                </div>
              )}
           </div>
        </div>

        <div className="space-y-8">
           <section className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
              <h3 className="text-lg font-black mb-8 tracking-tight">Performance Summary</h3>
              <div className="space-y-8">
                 <div>
                    <div className="flex justify-between items-end mb-2">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cumulative Progress</p>
                       <p className="text-xl font-black">88%</p>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500 w-[88%]" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                    <div>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Subjects Passed</p>
                       <p className="text-xl font-black">12/12</p>
                    </div>
                    <div>
                       <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Credit Earned</p>
                       <p className="text-xl font-black">36.0</p>
                    </div>
                 </div>
              </div>
           </section>

           <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-lg font-black text-gray-900 mb-6 tracking-tight">Teacher Feedback</h3>
              <div className="space-y-6">
                 <FeedbackItem label="Class Teacher" text="Exceptional performance this term. Consistently demonstrates leadership skills and academic rigor." />
                 <FeedbackItem label="Science Dept" text="Strong analytical capabilities. Recommended for Advanced Physics track." />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: any) {
  return (
    <div>
       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
       <p className={`text-lg font-black ${color}`}>{value}</p>
    </div>
  );
}

function FeedbackItem({ label, text }: any) {
  return (
    <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
       <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1.5">{label}</p>
       <p className="text-xs font-bold text-gray-700 leading-relaxed italic">"{text}"</p>
    </div>
  );
}
