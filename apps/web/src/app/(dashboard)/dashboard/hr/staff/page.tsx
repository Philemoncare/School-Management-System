'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  Building,
  UserCircle
} from 'lucide-react';
import Link from 'next/link';

export default function StaffDirectory() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadStaff();
  }, [search]);

  async function loadStaff() {
    setLoading(true);
    try {
      const data = await apiFetch(`/hr/staff?search=${search}`);
      setStaff(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Staff Directory</h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">Central registry of all teaching and administrative workforce.</p>
        </div>
        <Link href="/dashboard/hr/staff/new" className="bg-charcoal-900 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-charcoal-950 transition-all shadow-xs flex items-center gap-2">
          <Plus size={18} /> Register New Employee
        </Link>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
          <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm focus-within:ring-2 focus-within:ring-forest-700/10 transition-all">
            <Search size={18} className="text-warm-400 mr-3" />
            <input
              type="text"
              placeholder="Search by name, staff ID or email..."
              className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-3 bg-card border border-warm-200 rounded-2xl text-warm-500 shadow-sm hover:bg-ivory-50 transition-all"><Filter size={18}/></button>
        </div>

        <div className="relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Employee Details</th>
                  <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Department & Position</th>
                  <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Type</th>
                  <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                  <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-ivory-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-warm-100 rounded-xl flex items-center justify-center text-warm-400 group-hover:bg-sage-100 group-hover:text-forest-700 transition-colors font-semibold text-xs">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-charcoal-900 leading-tight">{member.firstName} {member.lastName}</p>
                          <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight mt-0.5">{member.employeeId || 'No ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-warm-700">{member.position?.name || member.designation || 'Unassigned'}</p>
                      <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide flex items-center gap-1 mt-1">
                        <Building size={10} /> {member.department?.name || 'General'}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-tighter ${
                        member.type === 'TEACHER' ? 'bg-sage-50 text-forest-700' : 'bg-terracotta-50 text-terracotta-600'
                      }`}>
                        {member.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                        member.status === 'ACTIVE' ? 'bg-success-50 text-success-700' : 'bg-warm-100 text-warm-500'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Link href={`/dashboard/hr/staff/${member.id}?type=${member.type}`} className="p-2 hover:bg-card hover:shadow-md border border-transparent hover:border-warm-100 rounded-xl text-warm-400 hover:text-forest-700 transition-all">
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <UserCircle className="mx-auto text-warm-200 mb-4" size={64} />
                      <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No workforce records found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
