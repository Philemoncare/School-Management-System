'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Users,
  Search,
  UserPlus,
  Filter,
  MoreHorizontal,
  Mail,
  ShieldCheck,
  Lock,
  Loader2,
  ChevronDown
} from 'lucide-react';

export default function SchoolUsersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    try {
      const data = await apiFetch('/memberships');
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleStatus(membershipId: string, current: string) {
    const next = current === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to ${next === 'ACTIVE' ? 'reactivate' : 'suspend'} this user?`)) return;

    try {
      await apiFetch(`/memberships/${membershipId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next })
      });
      loadMembers();
    } catch (err) {
      alert('Failed to update status');
    }
  }

  const filtered = members.filter(m =>
    `${m.user.firstName} ${m.user.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
    m.user.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
             <Users className="text-blue-600" /> User Directory
          </h1>
          <p className="text-gray-500 font-medium mt-1">Manage school staff, teachers, and administrative access.</p>
        </div>
        <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all flex items-center gap-2">
          <UserPlus size={20} /> Invite New User
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className="p-2.5 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 shadow-sm transition-all"><Filter size={18}/></button>
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
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Team Member</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">School Roles</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Joined At</th>
                <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map((member) => (
                <tr key={member.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-500 border border-gray-100">
                        {member.user.firstName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 leading-tight">{member.user.firstName} {member.user.lastName}</p>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                           <Mail size={10} /> {member.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-1">
                      {member.user.userRoles.map((ur: any) => (
                        <span key={ur.id} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black uppercase">
                          {ur.role.name}
                        </span>
                      ))}
                      {member.user.userRoles.length === 0 && <span className="text-[10px] text-gray-400 font-bold italic">No roles assigned</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      member.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-tight">{new Date(member.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => handleToggleStatus(member.id, member.status)} className="p-2 text-gray-400 hover:text-orange-600 transition-colors">
                          <Lock size={18}/>
                       </button>
                       <button className="p-2 text-gray-400 hover:text-gray-900 transition-colors"><MoreHorizontal size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <div className="py-20 text-center">
              <Users className="mx-auto text-gray-200 mb-4" size={64} />
              <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
