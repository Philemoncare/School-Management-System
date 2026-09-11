'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Users,
  Search,
  Filter,
  ShieldCheck,
  MoreHorizontal,
  Mail,
  Calendar,
  Lock,
  Loader2
} from 'lucide-react';

export default function SuperAdminUsers() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, [search]);

  async function loadUsers() {
    setLoading(true);
    try {
      const result = await apiFetch(`/super-admin/users?search=${search}`);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(userId: string, current: boolean) {
    if (!confirm(`Are you sure you want to ${current ? 'disable' : 'enable'} this account?`)) return;
    try {
      await apiFetch(`/super-admin/users/${userId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !current })
      });
      loadUsers();
    } catch (err) {
      alert('Failed to update user');
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-3">
         <Users className="text-blue-600" /> Platform User Directory
      </h1>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by name, email or ID..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-500 shadow-sm"><Filter size={18}/></button>
        </div>

        <div className="relative">
           {loading && (
             <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
           )}

           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-gray-50">
                <tr>
                   <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">User Profile</th>
                   <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Role & Permissions</th>
                   <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Memberships</th>
                   <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                   <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 bg-white">
                {data.items.map((user: any) => (
                  <tr key={user.id} className="hover:bg-blue-50/30 transition-colors">
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-500 border border-gray-100">
                             {user.firstName[0]}
                           </div>
                           <div>
                              <p className="text-sm font-black text-gray-900 leading-tight">{user.firstName} {user.lastName}</p>
                              <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                 <Mail size={10} /> {user.email}
                              </div>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1">
                           {user.userRoles.map((ur: any) => (
                             <span key={ur.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase">{ur.role.name}</span>
                           ))}
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <p className="text-xs font-black text-gray-700">{user.memberships.length} Schools</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 truncate max-w-[120px]">
                          {user.memberships[0]?.school.name || 'Standalone'}
                        </p>
                     </td>
                     <td className="px-8 py-5">
                        <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {user.isActive ? 'Active' : 'Disabled'}
                        </span>
                     </td>
                     <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                           <button onClick={() => handleToggleStatus(user.id, user.isActive)} className="p-2 text-gray-400 hover:text-orange-600 transition-colors"><Lock size={18}/></button>
                           <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><MoreHorizontal size={18}/></button>
                        </div>
                     </td>
                  </tr>
                ))}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
