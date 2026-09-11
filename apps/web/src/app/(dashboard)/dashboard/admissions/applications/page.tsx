'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Loader2,
  FileText,
  User,
  Inbox,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import Link from 'next/link';

export default function ApplicationsList() {
  const searchParams = useSearchParams();
  const campaignId = searchParams.get('campaignId');

  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadApplications();
  }, [search, campaignId]);

  async function loadApplications() {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (search) query.append('search', search);
      if (campaignId) query.append('campaignId', campaignId);

      const data = await apiFetch(`/admissions/applications?${query.toString()}`);
      setApplications(data);
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
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Application Queue</h1>
          <p className="text-gray-500 mt-1 font-medium text-sm">Reviewing and processing student admission requests.</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
          <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
            <Search size={18} className="text-gray-400 mr-3" />
            <input
              type="text"
              placeholder="Search by name, reference or guardian..."
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
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Applicant</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Class</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Reference</th>
                  <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 font-black text-xs">
                          {app.firstName[0]}{app.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-black text-gray-900 leading-tight">{app.firstName} {app.lastName}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-0.5">{app.campaign.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-gray-700">{app.class.name}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">{app.academicYear.name}</p>
                    </td>
                    <td className="px-8 py-5 font-mono text-[11px] font-black text-blue-600">
                      {app.reference}
                    </td>
                    <td className="px-8 py-5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link href={`/dashboard/admissions/applications/${app.id}`} className="p-2 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 rounded-xl text-gray-400 hover:text-blue-600 transition-all opacity-0 group-hover:opacity-100">
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <Inbox className="mx-auto text-gray-200 mb-4" size={64} />
                      <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No applications found</p>
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

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    SUBMITTED: 'bg-blue-50 text-blue-700',
    UNDER_REVIEW: 'bg-amber-50 text-amber-700',
    DOCUMENTS_REQUIRED: 'bg-red-50 text-red-700',
    OFFERED: 'bg-purple-50 text-purple-700',
    ACCEPTED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-gray-100 text-gray-500',
    ENROLLED: 'bg-green-600 text-white shadow-md shadow-green-100'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tight ${styles[status] || 'bg-gray-50 text-gray-500'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
