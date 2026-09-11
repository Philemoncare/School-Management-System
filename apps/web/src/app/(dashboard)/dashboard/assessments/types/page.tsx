'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Plus,
  Settings2,
  Trash2,
  Search,
  MoreVertical,
  Layers,
  FileText
} from 'lucide-react';

export default function AssessmentTypesPage() {
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/assessments/types')
      .then(setTypes)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Layers className="text-blue-600" /> Assessment Types
          </h1>
          <p className="text-gray-500 font-medium mt-1">Define categories for academic evaluations (e.g. Exam, Quiz, Assignment).</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2">
          <Plus size={20} /> New Category
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Name & Code</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
              <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
              <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr><td colSpan={4} className="px-8 py-10 text-center text-gray-400 animate-pulse">Loading categories...</td></tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                   <FileText className="mx-auto text-gray-200 mb-4" size={64} />
                   <p className="text-gray-400 font-bold text-lg">No categories defined</p>
                </td>
              </tr>
            ) : types.map((type) => (
              <tr key={type.id} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-8 py-5">
                   <p className="text-sm font-black text-gray-900 leading-tight">{type.name}</p>
                   <p className="text-[10px] font-black text-blue-600 uppercase mt-0.5 tracking-tight">{type.code}</p>
                </td>
                <td className="px-8 py-5">
                   <p className="text-sm text-gray-500 font-medium">{type.description || 'No description'}</p>
                </td>
                <td className="px-8 py-5">
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                     type.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                   }`}>
                     {type.isActive ? 'Active' : 'Inactive'}
                   </span>
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors"><Settings2 size={18}/></button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={18}/></button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
