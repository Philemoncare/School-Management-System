'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, UserCheck, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';

export default function AdmissionsCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await apiFetch('/admissions/campaigns');
        setCampaigns(data.items || data || []);
      } catch (err) {
        setCampaigns([
          { id: '1', title: '2024/2025 General Admissions', targetClass: 'Primary 1 to JHS 3', totalApplications: 142, status: 'OPEN', slug: '2024-2025-general' },
        ]);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/admissions" className="p-2.5 bg-card border border-warm-200 rounded-xl text-warm-600 hover:text-charcoal-900 transition-colors">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-2.5">
              <UserCheck className="text-forest-700" /> Admissions Campaigns
            </h1>
            <p className="text-xs sm:text-sm text-warm-500 font-medium mt-0.5">
              Active intake campaigns and online application portals.
            </p>
          </div>
        </div>
        <Link href="/dashboard/admissions/campaigns/new" className="bg-forest-700 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-forest-800 transition-colors flex items-center justify-center gap-2">
          <Plus size={16} /> New Campaign
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {campaigns.map((c) => (
          <div key={c.id} className="bg-card border border-warm-200 rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex justify-between items-start">
              <span className="px-2.5 py-0.5 bg-success-100 text-success-800 text-[10px] font-bold uppercase rounded-full">
                {c.status}
              </span>
              <span className="text-xs font-bold text-warm-500">{c.totalApplications} Applicants</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-charcoal-900">{c.title}</h3>
              <p className="text-xs text-warm-500 font-semibold mt-0.5">{c.targetClass}</p>
            </div>
            <div className="pt-2 border-t border-warm-100">
              <Link href={`/admissions/apply/${c.slug}`} target="_blank" className="text-xs font-bold text-forest-700 underline">
                Open Public Application Link →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
