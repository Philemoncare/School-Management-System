'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Clock, Save } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewTimetableEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    dayOfWeek: 'MONDAY',
    startTime: '08:00',
    endTime: '08:45',
    classId: '',
    subjectId: '',
    teacherId: '',
    roomId: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/timetable/entries', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      router.push('/dashboard/academics/timetable');
    } catch (err: any) {
      setError(err.message || 'Failed to create timetable slot.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/academics/timetable" className="p-2.5 bg-card border border-warm-200 rounded-xl text-warm-600 hover:text-charcoal-900 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-2.5">
            <Clock className="text-forest-700" /> New Timetable Schedule Entry
          </h1>
          <p className="text-xs sm:text-sm text-warm-500 font-medium mt-0.5">
            Schedule a class period for teachers and rooms.
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
          <Select label="Day of Week *" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
            <option value="SATURDAY">Saturday</option>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Input label="Start Time *" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            <Input label="End Time *" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          </div>
          <Input label="Class Identifier *" placeholder="e.g. Primary 5A" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} />
          <Input label="Subject Name / Code *" placeholder="e.g. Mathematics" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} />
          <Input label="Assigned Teacher Name *" placeholder="e.g. Mr. Kojo Asante" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} />
          <Input label="Classroom / Lab *" placeholder="e.g. Room 102" value={form.roomId} onChange={(e) => setForm({ ...form, roomId: e.target.value })} />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-warm-100">
          <Link href="/dashboard/academics/timetable" className="px-5 py-2.5 border border-warm-200 rounded-xl text-xs font-bold text-warm-600 hover:bg-warm-50 text-center transition-colors">
            Cancel
          </Link>
          <Button type="submit" isLoading={loading} leftIcon={<Save size={16} />}>
            Save Entry
          </Button>
        </div>
      </form>
    </div>
  );
}
