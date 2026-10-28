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
          <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-3">
             <Users className="text-forest-700" /> User Directory
          </h1>
          <p className="text-warm-500 font-medium mt-1">Manage school staff, teachers, and administrative access.</p>
        </div>
        <button className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-bold hover:bg-forest-800 shadow-xs shadow-sage-200 transition-all flex items-center gap-2">
          <UserPlus size={20} /> Invite New User
        </button>
      </div>

      <div className="bg-card border border-warm-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-4 py-2.5 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input
                type="text"
                placeholder="Search users by name or email..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className="p-2.5 bg-card border border-warm-200 rounded-2xl text-warm-500 hover:bg-ivory-50 shadow-sm transition-all"><Filter size={18}/></button>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75">
               <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Team Member</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">School Roles</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Joined At</th>
                <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {filtered.map((member) => (
                <tr key={member.id} className="hover:bg-sage-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center font-bold text-warm-500 border border-warm-100">
                        {member.user.firstName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-charcoal-900 leading-tight">{member.user.firstName} {member.user.lastName}</p>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-warm-400 mt-1 uppercase tracking-tighter">
                           <Mail size={10} /> {member.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-1">
                      {member.user.userRoles.map((ur: any) => (
                        <span key={ur.id} className="px-2 py-0.5 bg-sage-50 text-forest-700 rounded text-[11px] font-semibold uppercase">
                          {ur.role.name}
                        </span>
                      ))}
                      {member.user.userRoles.length === 0 && <span className="text-[11px] text-warm-400 font-bold italic">No roles assigned</span>}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tighter ${
                      member.status === 'ACTIVE' ? 'bg-success-100 text-success-700' : 'bg-danger-100 text-danger-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                     <p className="text-xs font-bold text-warm-400 uppercase tracking-tight">{new Date(member.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button onClick={() => handleToggleStatus(member.id, member.status)} className="p-2 text-warm-400 hover:text-terracotta-600 transition-colors">
                          <Lock size={18}/>
                       </button>
                       <button className="p-2 text-warm-400 hover:text-charcoal-900 transition-colors"><MoreHorizontal size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && !loading && (
            <div className="py-20 text-center">
              <Users className="mx-auto text-warm-200 mb-4" size={64} />
              <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
