'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserCheck, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewCampaignPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    title: '',
    slug: '',
    targetClass: 'Primary 1',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    applicationFee: '100',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/admissions/campaigns', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          applicationFee: Number(form.applicationFee) || 0,
        }),
      });
      router.push('/dashboard/admissions/campaigns');
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admissions/campaigns" className="p-2.5 bg-card border border-warm-200 rounded-xl text-warm-600 hover:text-charcoal-900 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="text-forest-700" /> Create Admission Campaign
          </h1>
          <p className="text-xs sm:text-sm text-warm-500 font-medium mt-0.5">
            Set up an open intake campaign for new prospective students.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl text-xs sm:text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-warm-200 rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Campaign Title *" required placeholder="e.g. 2025/2026 Academic Year Intake" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Input label="URL Slug *" required placeholder="e.g. 2025-2026-intake" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <Input label="Target Class Range *" required placeholder="e.g. Primary 1 to JHS 3" value={form.targetClass} onChange={(e) => setForm({ ...form, targetClass: e.target.value })} />
          <Input label="Application Fee (GH₵)" type="number" placeholder="100.00" value={form.applicationFee} onChange={(e) => setForm({ ...form, applicationFee: e.target.value })} />
          <Input label="Start Date *" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          <Input label="Closing Date *" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-warm-100">
          <Link href="/dashboard/admissions/campaigns" className="px-5 py-2.5 border border-warm-200 rounded-xl text-xs font-bold text-warm-600 hover:bg-warm-50 text-center transition-colors">
            Cancel
          </Link>
          <Button type="submit" isLoading={loading} leftIcon={<Save size={16} />}>
            Create Campaign
          </Button>
        </div>
      </form>
    </div>
  );
}
