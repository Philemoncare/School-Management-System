'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewStaffPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'MALE',
    staffNumber: '',
    roleName: 'TEACHER',
    department: 'Academics',
    position: 'Class Teacher',
    employmentType: 'FULL_TIME',
    joinedDate: new Date().toISOString().split('T')[0],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/staff', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.push('/dashboard/hr/staff');
    } catch (err: any) {
      setError(err.message || 'Failed to onboard staff member.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/hr/staff" className="p-2.5 bg-card border border-warm-200 rounded-xl text-warm-600 hover:text-charcoal-900 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-2.5">
            <Users className="text-forest-700" /> Onboard Staff Member
          </h1>
          <p className="text-xs sm:text-sm text-warm-500 font-medium mt-0.5">
            Register new teacher, administrative staff, or operational team member.
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
          <Input label="First Name *" required placeholder="e.g. Kwame" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          <Input label="Last Name *" required placeholder="e.g. Appiah" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          <Input label="Email Address *" type="email" required placeholder="k.appiah@school.edu.gh" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Phone Number" placeholder="e.g. +233 24 000 0000" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input label="Staff ID Number *" required placeholder="e.g. STF-2024-089" value={form.staffNumber} onChange={(e) => setForm({ ...form, staffNumber: e.target.value })} />
          <Select label="Gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </Select>
          <Select label="Primary Platform Role" value={form.roleName} onChange={(e) => setForm({ ...form, roleName: e.target.value })}>
            <option value="TEACHER">Teacher</option>
            <option value="ACCOUNTANT">Accountant / Finance</option>
            <option value="LIBRARIAN">Librarian</option>
            <option value="RECEPTIONIST">Front Office / Receptionist</option>
            <option value="NURSE">Health Officer / Nurse</option>
            <option value="HR">HR Officer</option>
            <option value="SCHOOL_ADMIN">School Administrator</option>
          </Select>
          <Input label="Department" placeholder="e.g. Science & Mathematics" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Input label="Job Title / Position" placeholder="e.g. Senior Physics Teacher" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          <Select label="Employment Type" value={form.employmentType} onChange={(e) => setForm({ ...form, employmentType: e.target.value })}>
            <option value="FULL_TIME">Full Time</option>
            <option value="PART_TIME">Part Time</option>
            <option value="CONTRACT">Contract</option>
          </Select>
          <Input label="Joining Date" type="date" value={form.joinedDate} onChange={(e) => setForm({ ...form, joinedDate: e.target.value })} />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-warm-100">
          <Link href="/dashboard/hr/staff" className="px-5 py-2.5 border border-warm-200 rounded-xl text-xs font-bold text-warm-600 hover:bg-warm-50 text-center transition-colors">
            Cancel
          </Link>
          <Button type="submit" isLoading={loading} leftIcon={<Save size={16} />}>
            Save Staff Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
