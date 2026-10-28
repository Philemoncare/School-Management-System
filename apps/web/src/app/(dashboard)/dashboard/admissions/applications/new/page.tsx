'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserCheck, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'MALE',
    targetClass: 'Primary 1',
    guardianName: '',
    guardianPhone: '',
    guardianEmail: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/admissions/applications', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.push('/dashboard/admissions/applications');
    } catch (err: any) {
      setError(err.message || 'Failed to record application.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/admissions/applications" className="p-2.5 bg-card border border-warm-200 rounded-xl text-warm-600 hover:text-charcoal-900 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-2.5">
            <UserCheck className="text-forest-700" /> Walk-In / Manual Admission Application
          </h1>
          <p className="text-xs sm:text-sm text-warm-500 font-medium mt-0.5">
            Record a prospective student application submitted at front desk.
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
          <Input label="Applicant First Name *" required placeholder="e.g. Yaw" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Applicant Last Name *" required placeholder="e.g. Mensah" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input label="Date of Birth" type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </Select>
          <Input label="Grade / Class Applying For *" required placeholder="e.g. Primary 5" value={form.targetClass} onChange={(e) => setForm({ ...form, targetClass: e.target.value })} />
          <Input label="Guardian Full Name *" required placeholder="e.g. Mr. John Mensah" value={form.guardianName} onChange={(e) => setForm({ ...form, guardianName: e.target.value })} />
          <Input label="Guardian Phone *" required placeholder="e.g. +233 24 111 2222" value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
          <Input label="Guardian Email" type="email" placeholder="guardian@example.com" value={form.guardianEmail} onChange={(e) => setForm({ ...form, guardianEmail: e.target.value })} />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-warm-100">
          <Link href="/dashboard/admissions/applications" className="px-5 py-2.5 border border-warm-200 rounded-xl text-xs font-bold text-warm-600 hover:bg-warm-50 text-center transition-colors">
            Cancel
          </Link>
          <Button type="submit" isLoading={loading} leftIcon={<Save size={16} />}>
            Submit Application
          </Button>
        </div>
      </form>
    </div>
  );
}
