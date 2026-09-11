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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Staff Directory</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Central registry of all teaching and administrative workforce.</p>
        </div>
        <Link href="/dashboard/hr/staff/new" className="bg-gray-900 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center gap-2">
          <Plus size={18} /> Register New Employee
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
            <Search size={18} className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search by name, staff ID or email..."
              className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 shadow-sm hover:bg-gray-50 transition-all"><Filter size={18}/></button>
        </div>

        <div className="relative min-h-[400px]">
          {loading && (
            <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Employee Details</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Department & Position</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Type</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {staff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors font-black text-xs">
                          {member.firstName[0]}{member.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-tight">{member.firstName} {member.lastName}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{member.employeeId || 'No ID'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-gray-700">{member.position?.name || member.designation || 'Unassigned'}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 mt-1">
                        <Building size={10} /> {member.department?.name || 'General'}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter ${
                        member.type === 'TEACHER' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                      }`}>
                        {member.type}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        member.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <Link href={`/dashboard/hr/staff/${member.id}?type=${member.type}`} className="p-2 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 transition-all">
                          <ChevronRight size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
                {staff.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <UserCircle className="mx-auto text-gray-200 mb-4" size={64} />
                      <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No workforce records found</p>
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
