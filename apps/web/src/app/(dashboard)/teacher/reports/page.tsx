'use client';

import React from 'react';
import {
  TrendingUp,
  BarChart3,
  Users,
  ClipboardCheck,
  Download,
  ChevronRight,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';

export default function TeacherReportsPage() {
  const reportCategories = [
    { title: 'Class Performance', desc: 'Average scores and subject mastery trends.', icon: <BarChart3 className="text-blue-600"/>, color: 'bg-blue-50' },
    { title: 'Attendance Summaries', desc: 'Monthly presence and absence logs for your classes.', icon: <ClipboardCheck className="text-green-600"/>, color: 'bg-green-50' },
    { title: 'Student Progress', desc: 'Individual development and grade history.', icon: <TrendingUp className="text-purple-600"/>, color: 'bg-purple-50' },
    { title: 'Assessment Audit', desc: 'Score distribution and completion status.', icon: <FileSpreadsheet className="text-orange-600"/>, color: 'bg-orange-50' },
  ];

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <BarChart3 className="text-blue-600" /> Academic Reports
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Institutional Data • Departmental Summaries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         {reportCategories.map((cat, i) => (
           <div key={i} className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all group flex items-center justify-between">
              <div className="flex items-center gap-6">
                 <div className={`${cat.color} p-5 rounded-3xl transition-transform group-hover:scale-110 shadow-lg shadow-gray-50`}>{cat.icon}</div>
                 <div>
                    <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{cat.title}</h3>
                    <p className="text-gray-500 font-medium text-sm mt-1 leading-relaxed max-w-xs">{cat.desc}</p>
                 </div>
              </div>
              <button className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                 <Download size={20} />
              </button>
           </div>
         ))}
      </div>

      <div className="bg-gray-900 rounded-[2.5rem] p-12 text-center text-white relative overflow-hidden shadow-2xl">
         <Users className="absolute -bottom-10 -left-10 text-white/5 rotate-12" size={240} />
         <div className="relative z-10">
            <h3 className="text-3xl font-black mb-4">Looking for something specific?</h3>
            <p className="text-gray-400 font-medium max-w-lg mx-auto leading-relaxed mb-10">
               If you need a custom report for your department or a specialized data export, please contact the school administration.
            </p>
            <button className="px-10 py-4 bg-white text-gray-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-colors">Request Custom Report</button>
         </div>
      </div>
    </div>
  );
}
