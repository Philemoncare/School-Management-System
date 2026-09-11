'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Settings,
  Plus,
  Search,
  MoreVertical,
  Trophy,
  ChevronDown
} from 'lucide-react';

export default function GradingScalesPage() {
  const [scales, setScales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/grading/scales')
      .then(setScales)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Trophy className="text-blue-600" /> Grading Configuration
          </h1>
          <p className="text-gray-500 font-medium mt-1">Configure how raw scores are converted to letter grades and points.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2">
          <Plus size={20} /> Create New Scale
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {loading ? (
          <div className="p-20 text-center text-gray-400 font-bold animate-pulse">Retrieving school grading rules...</div>
        ) : scales.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-3xl p-20 text-center">
             <Settings className="mx-auto text-gray-200 mb-4" size={64} />
             <p className="text-gray-400 font-bold text-lg">No grading scales found</p>
             <button className="mt-4 text-blue-600 font-black text-sm uppercase tracking-widest">+ Define First Scale</button>
          </div>
        ) : scales.map((scale) => (
          <div key={scale.id} className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
             <div className="p-6 bg-gray-50/50 border-b border-gray-100 flex justify-between items-center">
                <div>
                   <h3 className="text-lg font-black text-gray-900">{scale.name}</h3>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{scale.code}</p>
                </div>
                <div className="flex gap-2">
                   <button className="px-4 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm">Edit Bands</button>
                   <button className="p-1.5 text-gray-400 hover:text-gray-900"><MoreVertical size={18}/></button>
                </div>
             </div>
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                   <thead className="bg-white">
                      <tr>
                         <th className="px-8 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-tighter">Grade</th>
                         <th className="px-8 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-tighter">Percentage Range</th>
                         <th className="px-8 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-tighter">Points</th>
                         <th className="px-8 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-tighter">Remark</th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {scale.gradeBands.map((band: any) => (
                        <tr key={band.id} className="hover:bg-gray-50 transition-colors">
                           <td className="px-8 py-4"><span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-black text-sm">{band.grade}</span></td>
                           <td className="px-8 py-4 text-sm font-bold text-gray-700">{band.minimumPercentage}% — {band.maximumPercentage}%</td>
                           <td className="px-8 py-4 text-sm font-black text-gray-900">{parseFloat(band.gradePoint).toFixed(2)}</td>
                           <td className="px-8 py-4 text-xs font-bold text-gray-500 uppercase tracking-tight italic">{band.remark}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
