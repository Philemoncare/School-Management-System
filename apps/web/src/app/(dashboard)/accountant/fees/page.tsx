'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Layers,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Settings,
  ChevronRight,
  Loader2,
  Trash2,
  Edit3
} from 'lucide-react';
import Link from 'next/link';

export default function FeeManagementPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('structures');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [catData, strData] = await Promise.all([
        apiFetch('/finance/fee-categories'),
        apiFetch('/finance/fee-structures'),
      ]);
      setCategories(catData);
      setStructures(strData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
             <Layers className="text-forest-700" /> Fee Configuration
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Define Fee Items and institutional Billing Structures</p>
        </div>
        <div className="flex gap-4">
           <button className="bg-card border border-warm-200 text-warm-700 px-6 py-3 rounded-2xl font-semibold text-[11px] uppercase tracking-wide hover:bg-ivory-50 transition-all shadow-sm">
             Categories
           </button>
           <Link href="/accountant/fees/new" className="bg-forest-700 text-white px-8 py-3 rounded-2xl font-semibold text-[11px] uppercase tracking-wide hover:bg-forest-800 shadow-xs shadow-sage-100 transition-all flex items-center gap-2">
             <Plus size={16} /> New Structure
           </Link>
        </div>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input type="text" placeholder="Search by name, class or category..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold placeholder:text-warm-400" />
           </div>
           <button className="p-3 bg-card border border-warm-200 rounded-2xl text-warm-500 shadow-sm"><Filter size={18}/></button>
        </div>

        <div className="relative min-h-[400px]">
           {loading && (
             <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-forest-700" size={32} />
             </div>
           )}

           <table className="min-w-full divide-y divide-warm-200">
             <thead className="bg-ivory-50/50">
               <tr>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Structure Details</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Category</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Applicable To</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Amount</th>
                 <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-warm-100 bg-card">
               {structures.map((str) => (
                 <tr key={str.id} className="hover:bg-sage-50/30 transition-colors group">
                    <td className="px-8 py-6">
                       <p className="text-sm font-semibold text-charcoal-900 leading-tight">{str.name}</p>
                       <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5 tracking-tighter">{str.academicYear.name} • {str.term?.name || 'Full Year'}</p>
                    </td>
                    <td className="px-8 py-6">
                       <span className="px-3 py-1 bg-warm-100 text-warm-600 rounded-full text-[11px] font-semibold uppercase tracking-tighter">
                          {str.feeCategory.name}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-xs font-semibold text-warm-700">{str.class?.name || 'All Classes'}</p>
                       <p className="text-[11px] font-bold text-warm-400 uppercase mt-0.5">{str.isMandatory ? 'Mandatory' : 'Optional'}</p>
                    </td>
                    <td className="px-8 py-6">
                       <p className="text-sm font-semibold text-charcoal-900">GH₵ {parseFloat(str.amount).toLocaleString()}</p>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex items-center justify-end gap-2">
                          <button className="p-2 text-warm-400 hover:text-forest-700 transition-colors"><Edit3 size={18}/></button>
                          <button className="p-2 text-warm-400 hover:text-danger-600 transition-colors"><Trash2 size={18}/></button>
                       </div>
                    </td>
                 </tr>
               ))}
               {structures.length === 0 && !loading && (
                 <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                       <Settings className="mx-auto text-warm-200 mb-4" size={64} />
                       <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No fee structures defined</p>
                       <button className="mt-4 text-forest-700 font-semibold text-xs uppercase tracking-wide">+ Create First Item</button>
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
