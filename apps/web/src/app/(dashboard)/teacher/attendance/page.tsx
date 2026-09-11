'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  Users,
  Calendar,
  CheckCircle2,
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

  useEffect(() => {
    if (classId && sectionId) {
      loadStudents();
    }
  }, [classId, sectionId]);

  async function loadStudents() {
    setLoading(true);
    try {
      const data = await apiFetch(`/attendance/eligible-students?classId=${classId}&sectionId=${sectionId}`);
      setStudents(data);
      // Initialize with PRESENT
      const initial: Record<string, string> = {};
      data.forEach((s: any) => initial[s.student.id] = 'PRESENT');
      setAttendance(initial);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // 1. Create or Find Session
      const session = await apiFetch('/attendance/sessions', {
        method: 'POST',
        body: JSON.stringify({
          date,
          classId,
          sectionId,
          sessionType: 'DAILY',
          academicYearId: students[0]?.academicYearId, // Get from first enrollment
        })
      }).catch(err => {
        // If conflict, try fetching existing
        return apiFetch(`/attendance/sessions?date=${date}&classId=${classId}&sectionId=${sectionId}`).then(res => res[0]);
      });

      if (!session) throw new Error('Could not resolve attendance session');

      // 2. Submit Bulk Attendance
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await apiFetch(`/attendance/sessions/${session.id}/bulk`, {
        method: 'POST',
        body: JSON.stringify({ records })
      });

      alert('Attendance saved successfully');
      router.push('/teacher/dashboard');
    } catch (err) {
      console.error(err);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  if (!classId || !sectionId) {
    return (
      <div className="p-20 text-center">
         <Filter className="mx-auto text-gray-200 mb-4" size={64} />
         <h2 className="text-2xl font-black text-gray-900">Select a class first</h2>
         <p className="text-gray-500 mt-2">Please go to <Link href="/teacher/classes" className="text-blue-600 underline">My Classes</Link> and select a section to mark attendance.</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
             <ChevronLeft size={20} />
           </button>
           <div>
             <h1 className="text-3xl font-black text-gray-900 tracking-tight">Daily Roll Call</h1>
             <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-1">Mark student presence for {date}</p>
           </div>
        </div>
        <div className="flex gap-4">
           <input
             type="date"
             className="bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-sm font-black text-gray-700 shadow-sm focus:ring-2 focus:ring-blue-600 transition-all"
             value={date}
             onChange={(e) => setDate(e.target.value)}
           />
           <button
             onClick={handleSave}
             disabled={saving || loading}
             className="bg-blue-600 text-white px-8 py-2.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center gap-2 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              Submit Roll Call
           </button>
        </div>
      </div>

      {/* Student List */}
      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
           <div className="flex items-center gap-2">
              <Users size={18} className="text-blue-600" />
              <span className="text-sm font-black text-gray-900">{students.length} Students Enrolled</span>
           </div>
           <div className="flex gap-4">
              <button
                onClick={() => {
                  const updated: Record<string, string> = {};
                  students.forEach(s => updated[s.student.id] = 'PRESENT');
                  setAttendance(updated);
                }}
                className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
              >
                Mark All Present
              </button>
           </div>
        </div>

        <div className="relative">
           {loading && <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>}

           <table className="min-w-full divide-y divide-gray-200">
             <thead className="bg-white">
                <tr>
                   <th className="px-8 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Student Information</th>
                   <th className="px-8 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                   <th className="px-8 py-4 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Details</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-gray-100 bg-white">
                {students.map((record) => (
                  <tr key={record.student.id} className="hover:bg-gray-50 transition-colors">
                     <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center font-black text-gray-400">
                             {record.student.firstName[0]}
                           </div>
                           <div>
                              <p className="text-sm font-black text-gray-900 leading-tight">{record.student.firstName} {record.student.lastName}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase">{record.student.studentNumber}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-2">
                           <StatusButton
                             active={attendance[record.student.id] === 'PRESENT'}
                             color="bg-green-500"
                             label="Present"
                             icon={<CheckCircle2 size={14}/>}
                             onClick={() => setAttendance({...attendance, [record.student.id]: 'PRESENT'})}
                           />
                           <StatusButton
                             active={attendance[record.student.id] === 'ABSENT'}
                             color="bg-red-500"
                             label="Absent"
                             icon={<XCircle size={14}/>}
                             onClick={() => setAttendance({...attendance, [record.student.id]: 'ABSENT'})}
                           />
                           <StatusButton
                             active={attendance[record.student.id] === 'LATE'}
                             color="bg-orange-500"
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
                          className="bg-gray-50 border-none rounded-xl text-[10px] font-bold w-32 focus:ring-1 focus:ring-blue-600"
                        />
                     </td>
                  </tr>
                ))}
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
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
        active
          ? `${color} text-white shadow-lg`
          : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
      }`}
    >
       {icon} {label}
    </button>
  );
}

export default function AttendancePage() {
  return (
    <Suspense fallback={<div className="p-20 text-center animate-pulse font-black text-gray-400">LOADING WORKSPACE...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
