'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronLeft,
  Search,
  Save,
  Loader2,
  Filter
} from 'lucide-react';
import Link from 'next/link';

function AttendanceContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const classId = searchParams.get('classId');
  const sectionId = searchParams.get('sectionId');

  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [academicYearId, setAcademicYearId] = useState<string>('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    apiFetch('/academic-years/current')
      .then((year: any) => setAcademicYearId(year?.id || ''))
      .catch(() => setAcademicYearId(''));
  }, []);

  useEffect(() => {
    if (classId) {
      loadStudents();
    }
  }, [classId, sectionId]);

  async function loadStudents() {
    setLoading(true);
    setMessage(null);
    try {
      const query = new URLSearchParams({ classId: classId as string });
      if (sectionId) query.set('sectionId', sectionId);
      if (academicYearId) query.set('academicYearId', academicYearId);
      const data = await apiFetch(`/attendance/eligible-students?${query.toString()}`);
      setStudents(data);
      const initial: Record<string, string> = {};
      data.forEach((s: any) => (initial[s.student.id] = 'PRESENT'));
      setAttendance(initial);
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Could not load students for this class.' });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (students.length === 0) {
      setMessage({ type: 'error', text: 'There are no enrolled students to mark.' });
      return;
    }
    if (!academicYearId) {
      setMessage({ type: 'error', text: 'No active academic year. Activate one under Academics first.' });
      return;
    }

    setSaving(true);
    setMessage(null);
    try {
      const session = await apiFetch('/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify({
          date,
          classId,
          sectionId: sectionId || undefined,
          sessionType: 'DAILY',
          academicYearId,
        }),
      }).catch(() =>
        apiFetch(`/attendance/sessions?date=${date}&classId=${classId}${sectionId ? `&sectionId=${sectionId}` : ''}`).then(
          (res: any[]) => res?.[0],
        ),
      );

      if (!session?.id) throw new Error('Could not open an attendance session for this date.');

      const records = Object.entries(attendance).map(([studentId, status]) => ({ studentId, status }));
      await apiFetch(`/attendance/sessions/${session.id}/bulk-mark`, {
        method: 'POST',
        body: JSON.stringify({ records }),
      });

      setMessage({ type: 'success', text: `Attendance saved for ${records.length} student${records.length === 1 ? '' : 's'}.` });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to save attendance.' });
    } finally {
      setSaving(false);
    }
  }

  if (!classId) {
    return (
      <div className="p-20 text-center">
         <Filter className="mx-auto text-warm-200 mb-4" size={64} />
         <h2 className="text-2xl font-semibold text-charcoal-900">Select a class first</h2>
         <p className="text-warm-500 mt-2">Please go to <Link href="/teacher/classes" className="text-forest-700 underline">My Classes</Link> and select a section to mark attendance.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2.5 bg-card border border-warm-200 rounded-2xl hover:bg-ivory-50 transition-colors shadow-sm text-warm-500">
             <ChevronLeft size={20} />
           </button>
           <div>
             <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Daily Roll Call</h1>
             <p className="text-warm-500 font-bold uppercase tracking-wide text-[11px] mt-1">Mark student presence for {date}</p>
           </div>
        </div>
        <div className="flex gap-4">
           <input
             type="date"
             className="bg-card border border-warm-200 rounded-2xl px-4 py-2.5 text-sm font-semibold text-warm-700 shadow-sm focus:ring-2 focus:ring-forest-700 transition-all"
             value={date}
             onChange={(e) => setDate(e.target.value)}
           />
           <button
             onClick={handleSave}
             disabled={saving || loading}
             className="bg-forest-700 text-white px-8 py-2.5 rounded-2xl font-semibold text-sm uppercase tracking-wide hover:bg-forest-800 shadow-xs shadow-sage-100 flex items-center gap-2 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Submit Roll Call
           </button>
        </div>
      </div>

      {message && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            message.type === 'success'
              ? 'border-success-200 bg-success-50 text-success-800'
              : 'border-danger-200 bg-danger-50 text-danger-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Student List */}
      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 bg-ivory-50/50 flex items-center justify-between">           <div className="flex items-center gap-2">
              <Users size={18} className="text-forest-700" />
              <span className="text-sm font-semibold text-charcoal-900">{students.length} Students Enrolled</span>
           </div>
           <div className="flex gap-4">
              <button
                onClick={() => {
                  const updated: Record<string, string> = {};
                  students.forEach(s => updated[s.student.id] = 'PRESENT');
                  setAttendance(updated);
                }}
                className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide hover:underline"
              >
                Mark All Present
              </button>
           </div>
        </div>

        <div className="relative">
           {loading && <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center py-20"><Loader2 className="animate-spin text-forest-700" size={32} /></div>}

           <table className="min-w-full divide-y divide-warm-200">
             <thead className="bg-card">
                <tr>
                   <th className="px-8 py-4 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student Information</th>
                   <th className="px-8 py-4 text-center text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                   <th className="px-8 py-4 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Details</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-warm-100 bg-card">
                {students.map((record) => (
                  <tr key={record.student.id} className="hover:bg-ivory-50 transition-colors">
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-warm-100 flex items-center justify-center font-semibold text-warm-400">
                             {record.student.firstName[0]}
                           </div>
                           <div>
                              <p className="text-sm font-semibold text-charcoal-900 leading-tight">{record.student.firstName} {record.student.lastName}</p>
                              <p className="text-[11px] font-bold text-warm-400 uppercase">{record.student.studentNumber}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-2">
                           <StatusButton
                             active={attendance[record.student.id] === 'PRESENT'}
                             color="bg-success-500"
                             label="Present"
                             icon={<CheckCircle size={14}/>}
                             onClick={() => setAttendance({...attendance, [record.student.id]: 'PRESENT'})}
                           />
                           <StatusButton
                             active={attendance[record.student.id] === 'ABSENT'}
                             color="bg-danger-500"
                             label="Absent"
                             icon={<XCircle size={14}/>}
                             onClick={() => setAttendance({...attendance, [record.student.id]: 'ABSENT'})}
                           />
                           <StatusButton
                             active={attendance[record.student.id] === 'LATE'}
                             color="bg-terracotta-500"
                             label="Late"
                             icon={<Clock size={14}/>}
                             onClick={() => setAttendance({...attendance, [record.student.id]: 'LATE'})}
                           />
                        </div>
                     </td>
                     <td className="px-8 py-5 text-right">
                        <input
                          type="text"
                          placeholder="Note..."
                          className="bg-ivory-50 border-none rounded-xl text-[11px] font-bold w-32 focus:ring-1 focus:ring-forest-700"
                        />
                     </td>
                  </tr>
                ))}
                {students.length === 0 && !loading && (
                  <tr>
                    <td colSpan={3} className="px-8 py-16 text-center">
                      <Users className="mx-auto mb-3 text-warm-300" size={40} />
                      <p className="text-sm font-semibold text-charcoal-900">No students enrolled in this class</p>
                      <p className="mt-1 text-xs font-medium text-warm-500">
                        Enroll students for the active academic year, then return to mark attendance.
                      </p>
                    </td>
                  </tr>
                )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}

function StatusButton({ active, color, label, icon, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-semibold uppercase tracking-wide transition-all ${
        active
          ? `${color} text-white shadow-lg`
          : 'bg-ivory-50 text-warm-400 hover:bg-warm-100'
      }`}
    >
       {icon} {label}
    </button>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-20 text-center animate-pulse font-semibold text-warm-400">LOADING WORKSPACE...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}

