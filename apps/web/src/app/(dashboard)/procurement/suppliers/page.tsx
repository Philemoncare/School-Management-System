'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Users,
  Plus,
  Search,
  Mail,
  Phone,
  ArrowRight,
  MoreVertical,
  Building2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    apiFetch('/procurement/suppliers')
      .then(setSuppliers)
      .finally(() => setLoading(false));
  }, []);

  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Supplier Registry</h1>
          <p className="text-warm-500 text-sm">Authorized vendors and service providers.</p>
        </div>
        <Link href="/procurement/suppliers/new" className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-colors">
          <Plus size={18} /> Add Supplier
        </Link>
      </div>

      <div className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 bg-ivory-50/50">
           <div className="relative max-w-md">
             <input
               type="text"
               placeholder="Search by name or vendor code..."
               className="w-full pl-10 pr-4 py-2 bg-card border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-all"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             <Search className="absolute left-3 top-2.5 text-warm-400" size={16} />
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
           {loading ? (
             <div className="col-span-full p-20 text-center text-warm-400 font-bold animate-pulse">Retrieving supplier data...</div>
           ) : filteredSuppliers.length === 0 ? (
             <div className="col-span-full p-20 text-center text-warm-400 font-bold">No suppliers registered yet.</div>
           ) : filteredSuppliers.map((supplier) => (
             <div key={supplier.id} className="bg-card border border-warm-100 rounded-2xl p-6 hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-4">
                   <div className="w-12 h-12 bg-sage-50 text-forest-700 rounded-xl flex items-center justify-center border border-sage-100 group-hover:bg-forest-700 group-hover:text-white transition-colors">
                      <Building2 size={24} />
                   </div>
                   <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                      supplier.status === 'ACTIVE' ? 'bg-sage-50 text-forest-600' : 'bg-warm-100 text-warm-500'
                   }`}>{supplier.status}</span>
                </div>
                <h3 className="text-base font-semibold text-charcoal-900 mb-1">{supplier.name}</h3>
                <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wide mb-4">Code: {supplier.code}</p>

                <div className="space-y-3 mb-6">
                   <div className="flex items-center gap-3 text-xs text-warm-600 font-medium">
                      <Mail size={14} className="text-warm-400" />
                      <span>{supplier.email || 'N/A'}</span>
                   </div>
                   <div className="flex items-center gap-3 text-xs text-warm-600 font-medium">
                      <Phone size={14} className="text-warm-400" />
                      <span>{supplier.phone || 'N/A'}</span>
                   </div>
                </div>

                <div className="pt-4 border-t border-ivory-50 flex items-center justify-between">
                   <div className="flex gap-1">
                      {supplier.categories.slice(0, 2).map((cat: string) => (
                        <span key={cat} className="px-2 py-0.5 bg-ivory-50 border border-warm-100 rounded text-[11px] font-bold text-warm-400 uppercase">{cat}</span>
                      ))}
                   </div>
                   <Link href={`/procurement/suppliers/${supplier.id}`} className="text-forest-700 hover:underline text-xs font-bold flex items-center gap-1">
                      Profile <ArrowRight size={14} />
                   </Link>
                </div>
             </div>
           ))}
        </div>
      </div>
    </div>
  );
}

