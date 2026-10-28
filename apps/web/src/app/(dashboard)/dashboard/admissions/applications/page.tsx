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
  CheckCircle,
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
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Application Queue</h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">Reviewing and processing student admission requests.</p>
        </div>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
          <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm focus-within:ring-2 focus-within:ring-forest-700/10 transition-all">
            <Search size={18} className="text-warm-400 mr-3" />
            <input
              type="text"
              placeholder="Search by name, reference or guardian..."
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
                  <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Applicant</th>
                  <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Target Class</th>
                  <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Reference</th>
                  <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                  <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-ivory-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-warm-100 rounded-xl flex items-center justify-center text-warm-400 font-semibold text-xs">
                          {app.firstName[0]}{app.lastName[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-charcoal-900 leading-tight">{app.firstName} {app.lastName}</p>
                          <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight mt-0.5">{app.campaign.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-warm-700">{app.class.name}</p>
                      <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mt-1">{app.academicYear.name}</p>
                    </td>
                    <td className="px-8 py-5 font-mono text-[11px] font-semibold text-forest-700">
                      {app.reference}
                    </td>
                    <td className="px-8 py-5">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link href={`/dashboard/admissions/applications/${app.id}`} className="p-2 hover:bg-card hover:shadow-md border border-transparent hover:border-warm-100 rounded-xl text-warm-400 hover:text-forest-700 transition-all opacity-0 group-hover:opacity-100">
                        <ChevronRight size={18} />
                      </Link>
                    </td>
                  </tr>
                ))}
                {applications.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <Inbox className="mx-auto text-warm-200 mb-4" size={64} />
                      <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No applications found</p>
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
    SUBMITTED: 'bg-sage-50 text-forest-800',
    UNDER_REVIEW: 'bg-warning-50 text-warning-700',
    DOCUMENTS_REQUIRED: 'bg-danger-50 text-danger-700',
    OFFERED: 'bg-terracotta-50 text-terracotta-700',
    ACCEPTED: 'bg-sage-50 text-forest-700',
    REJECTED: 'bg-warm-100 text-warm-500',
    ENROLLED: 'bg-success-600 text-white shadow-md shadow-success-100'
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tight ${styles[status] || 'bg-ivory-50 text-warm-500'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

