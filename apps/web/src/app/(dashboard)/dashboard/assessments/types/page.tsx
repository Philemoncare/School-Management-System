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
          <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-3">
             <Layers className="text-forest-700" /> Assessment Types
          </h1>
          <p className="text-warm-500 font-medium mt-1">Define categories for academic evaluations (e.g. Exam, Quiz, Assignment).</p>
        </div>
        <button className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-bold hover:bg-forest-800 shadow-xs shadow-sage-200 transition-all flex items-center gap-2">
          <Plus size={20} /> New Category
        </button>
      </div>

      <div className="bg-card border border-warm-200 rounded-3xl shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-warm-200">
          <thead className="bg-ivory-50">
            <tr>
              <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Name & Code</th>
              <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Description</th>
              <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
              <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100 bg-card">
            {loading ? (
              <tr><td colSpan={4} className="px-8 py-10 text-center text-warm-400 animate-pulse">Loading categories...</td></tr>
            ) : types.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-20 text-center">
                   <FileText className="mx-auto text-warm-200 mb-4" size={64} />
                   <p className="text-warm-400 font-bold text-lg">No categories defined</p>
                </td>
              </tr>
            ) : types.map((type) => (
              <tr key={type.id} className="hover:bg-sage-50/30 transition-colors">
                <td className="px-8 py-5">
                   <p className="text-sm font-semibold text-charcoal-900 leading-tight">{type.name}</p>
                   <p className="text-[11px] font-semibold text-forest-700 uppercase mt-0.5 tracking-tight">{type.code}</p>
                </td>
                <td className="px-8 py-5">
                   <p className="text-sm text-warm-500 font-medium">{type.description || 'No description'}</p>
                </td>
                <td className="px-8 py-5">
                   <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tighter ${
                     type.isActive ? 'bg-success-100 text-success-700' : 'bg-warm-100 text-warm-700'
                   }`}>
                     {type.isActive ? 'Active' : 'Inactive'}
                   </span>
                </td>
                <td className="px-8 py-5 text-right">
                   <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-warm-400 hover:text-forest-700 transition-colors"><Settings2 size={18}/></button>
                      <button className="p-2 text-warm-400 hover:text-danger-600 transition-colors"><Trash2 size={18}/></button>
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
