'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Building2,
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function SuperAdminSchools() {
  const [data, setData] = useState<{ items: any[]; total: number }>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const take = 10;

  useEffect(() => {
    loadSchools();
  }, [search, statusFilter, page]);

  async function loadSchools() {
    setLoading(true);
    try {
      const skip = (page - 1) * take;
      const query = new URLSearchParams({
        skip: skip.toString(),
        take: take.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
      });
      const result = await apiFetch(`/super-admin/schools?${query}`);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Building2 className="text-blue-600" /> School Directory
          </h1>
          <p className="text-gray-500 font-medium mt-1">Global registry of educational institutions.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2">
          <Plus size={20} /> Provision School
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search schools..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold placeholder:text-gray-400"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
           </div>
           <div className="flex items-center gap-3">
              <select
                className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-bold text-gray-700 focus:ring-0 shadow-sm"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="TRIAL">Trial</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="EXPIRED">Expired</option>
              </select>
              <button className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 shadow-sm"><Filter size={18}/></button>
           </div>
        </div>

        {/* Table */}
        <div className="relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
               <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          )}

          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">School Identity</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Usage</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {data.items.map((school) => (
                <tr key={school.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 text-lg border border-gray-100 group-hover:bg-white transition-colors">
                          {school.name[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-tight">{school.name}</p>
                          <p className="text-xs font-bold text-gray-400 uppercase mt-0.5">{school.code} • {school.slug}</p>
                        </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <StatusBadge status={school.status} />
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                       <span className="text-sm font-black text-gray-800">{school.subscription?.plan?.name || 'No Plan'}</span>
                       <span className="text-[10px] font-bold text-gray-400 uppercase">{school.subscription?.status || 'INACTIVE'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex gap-4">
                       <UsageItem label="Students" value={school._count.students} />
                       <UsageItem label="Teachers" value={school._count.teachers} />
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                        <Link href={`/super-admin/schools/${school.id}`} className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                          <ExternalLink size={18}/>
                        </Link>
                        <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><MoreHorizontal size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.items.length === 0 && !loading && (
            <div className="py-20 text-center">
              <ShieldAlert className="mx-auto text-gray-200 mb-4" size={64} />
              <p className="text-gray-400 font-bold text-lg">No schools found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="p-6 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
           <p className="text-xs font-bold text-gray-400 uppercase">Showing {data.items.length} of {data.total} schools</p>
           <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * take >= data.total}
                className="p-2 bg-white border border-gray-200 rounded-xl disabled:opacity-30 shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
           </div>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const styles: any = {
    ACTIVE: 'bg-green-100 text-green-700',
    TRIAL: 'bg-blue-100 text-blue-700',
    SUSPENDED: 'bg-orange-100 text-orange-700',
    EXPIRED: 'bg-red-100 text-red-700',
    DEACTIVATED: 'bg-gray-100 text-gray-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${styles[status] || styles.ACTIVE}`}>
      {status}
    </span>
  );
}

function UsageItem({ label, value }: any) {
  return (
    <div>
       <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
       <p className="text-xs font-black text-gray-800">{value}</p>
    </div>
  );
}
