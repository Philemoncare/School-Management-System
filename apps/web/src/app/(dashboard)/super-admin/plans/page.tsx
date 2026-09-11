'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Plus,
  ShieldCheck,
  MoreVertical,
  CheckCircle2,
  Edit3,
  Archive,
  Layers,
  Settings
} from 'lucide-react';

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    try {
      const data = await apiFetch('/super-admin/plans');
      setPlans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Layers className="text-blue-600" /> Platform Plans
          </h1>
          <p className="text-gray-500 font-medium mt-1">Configure SaaS tiers, features and pricing models.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2">
          <Plus size={20} /> Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400 font-bold animate-pulse">Syncing tier configurations...</div>
        ) : plans.map((plan) => (
          <div key={plan.id} className="bg-white border border-gray-200 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative">
             <div className="p-8 border-b border-gray-100">
                <div className="flex justify-between items-start mb-4">
                   <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><ShieldCheck size={24}/></div>
                   <button className="p-1 text-gray-400 hover:text-gray-900"><MoreVertical size={20}/></button>
                </div>
                <h3 className="text-2xl font-black text-gray-900">{plan.name}</h3>
                <p className="text-xs font-black text-blue-500 uppercase tracking-widest mt-1">{plan.code}</p>
                <p className="text-gray-500 text-sm mt-4 font-medium leading-relaxed">{plan.description || 'No description provided.'}</p>
             </div>

             <div className="p-8 bg-gray-50/50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Core Features</p>
                <ul className="space-y-3">
                   {Object.entries(plan.features || {}).map(([key, val]: any) => (
                     <li key={key} className="flex items-center gap-2 text-xs font-bold text-gray-700">
                        <CheckCircle2 size={14} className="text-green-500" />
                        <span className="capitalize">{key.replace(/_/g, ' ')}: {val.toString()}</span>
                     </li>
                   ))}
                   {Object.keys(plan.features || {}).length === 0 && <li className="text-xs text-gray-400 italic">No specific features defined</li>}
                </ul>

                <div className="mt-8 pt-6 border-t border-gray-100">
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Active Pricing</p>
                   {plan.pricing.filter((p: any) => p.isActive).map((p: any) => (
                     <div key={p.id} className="flex justify-between items-center mb-2">
                        <span className="text-xs font-black text-gray-600">{p.interval}</span>
                        <span className="text-sm font-black text-gray-900">{p.amount} {p.currency}</span>
                     </div>
                   ))}
                </div>
             </div>

             <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <button className="flex-1 py-2.5 bg-gray-50 text-gray-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
                   <Edit3 size={14} /> Edit Plan
                </button>
                <button className="p-2.5 bg-white border border-gray-100 text-red-400 rounded-xl hover:bg-red-50 transition-colors">
                   <Archive size={16} />
                </button>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
