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
  Lock,
  Loader2,
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
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-2.5">
             <Users className="text-forest-700 h-6 w-6 sm:h-7 sm:w-7" /> User Directory
          </h1>
          <p className="text-xs sm:text-sm text-warm-500 font-medium mt-0.5">Manage school staff, teachers, and administrative access.</p>
        </div>
        <button className="bg-forest-700 text-white px-4 py-2.5 rounded-xl font-bold hover:bg-forest-800 transition-all flex items-center justify-center gap-2 text-sm w-full sm:w-auto">
          <UserPlus size={18} /> Invite New User
        </button>
      </div>

      <div className="bg-card border border-warm-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-warm-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-3.5 py-2 rounded-xl flex items-center shadow-xs">
              <Search size={16} className="text-warm-400 mr-2.5 shrink-0" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="bg-transparent border-none w-full focus:ring-0 text-xs sm:text-sm font-semibold outline-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className="p-2.5 bg-card border border-warm-200 rounded-xl text-warm-500 hover:bg-ivory-50 transition-all flex items-center justify-center min-w-[40px] min-h-[40px]">
             <Filter size={18}/>
           </button>
        </div>

        <div className="relative overflow-x-auto scrollbar-thin">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75">
               <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] font-bold text-warm-400 uppercase tracking-wide">Team Member</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] font-bold text-warm-400 uppercase tracking-wide">School Roles</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] font-bold text-warm-400 uppercase tracking-wide">Status</th>
                <th className="px-4 sm:px-6 py-3.5 text-left text-[11px] font-bold text-warm-400 uppercase tracking-wide">Joined At</th>
                <th className="px-4 sm:px-6 py-3.5 text-right text-[11px] font-bold text-warm-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {filtered.map((member) => (
                <tr key={member.id} className="hover:bg-sage-50/30 transition-colors">
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-warm-100 flex items-center justify-center font-bold text-warm-500 text-xs border border-warm-100 shrink-0">
                        {member.user.firstName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-charcoal-900 leading-tight truncate">{member.user.firstName} {member.user.lastName}</p>
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-warm-500 mt-0.5 truncate">
                           <Mail size={11} className="shrink-0" /> <span className="truncate">{member.user.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {member.user.userRoles.map((ur: any) => (
                        <span key={ur.id} className="px-2 py-0.5 bg-sage-50 text-forest-700 rounded text-[10px] font-bold uppercase">
                          {ur.role.name}
                        </span>
                      ))}
                      {member.user.userRoles.length === 0 && <span className="text-[11px] text-warm-400 font-medium italic">No roles assigned</span>}
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight ${
                      member.status === 'ACTIVE' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                     <p className="text-xs font-semibold text-warm-500">{new Date(member.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                       <button onClick={() => handleToggleStatus(member.id, member.status)} className="p-2 text-warm-400 hover:text-terracotta-600 transition-colors" title="Toggle status">
                          <Lock size={16}/>
                       </button>
                       <button className="p-2 text-warm-400 hover:text-charcoal-900 transition-colors" title="More options"><MoreHorizontal size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <div className="py-16 text-center">
              <Users className="mx-auto text-warm-200 mb-3" size={48} />
              <p className="text-warm-400 font-bold text-sm uppercase tracking-wide">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
