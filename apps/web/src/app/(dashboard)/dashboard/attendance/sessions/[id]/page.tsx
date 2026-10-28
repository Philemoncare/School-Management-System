'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useParams, useRouter } from 'next/navigation';
import { Check, X, Clock, AlertCircle, Save } from 'lucide-react';

export default function AttendanceSheetPage() {
  const { id } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [eligibleStudents, setEligibleStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    try {
      const [sessionData, students] = await Promise.all([
        apiFetch(`/attendance/sessions/${id}`),
        apiFetch(`/attendance/sessions/${id}/eligible-students`)
      ]);
      setSession(sessionData);
      setEligibleStudents(students);

      // Map existing records to the attendance state
      const initialMap: Record<string, string> = {};
      sessionData.records.forEach((r: any) => {
        initialMap[r.studentId] = r.status;
      });
      setAttendance(initialMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const markStatus = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const markAll = (status: string) => {
    const newMap: Record<string, string> = {};
    eligibleStudents.forEach(e => {
      newMap[e.student.id] = status;
    });
    setAttendance(newMap);
  };

  async function handleSave() {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await apiFetch(`/attendance/sessions/${id}/bulk-mark`, {
        method: 'POST',
        body: JSON.stringify({ records }),
      });

      alert('Attendance saved successfully');
    } catch (err) {
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-center">Loading Sheet...</div>;

  const isLocked = session.status === 'LOCKED';

  return (
    <div className="p-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-bold">
            Attendance Sheet: {session.class.name} {session.section?.name}
          </h1>
          <p className="text-warm-600">
            Date: {new Date(session.date).toLocaleDateString()} | Type: {session.sessionType}
          </p>
          {isLocked && (
            <div className="mt-2 inline-flex items-center text-danger-600 font-bold uppercase text-xs">
              <AlertCircle size={14} className="mr-1" /> This session is locked
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {!isLocked && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-forest-700 text-white px-6 py-2 rounded-lg hover:bg-forest-800 flex items-center disabled:opacity-50"
            >
              <Save size={18} className="mr-2" />
              {saving ? 'Saving...' : 'Save Attendance'}
            </button>
          )}
        </div>
      </div>

      {!isLocked && (
        <div className="mb-6 flex gap-2">
          <button onClick={() => markAll('PRESENT')} className="px-3 py-1 bg-success-50 text-success-700 border border-success-200 rounded text-sm hover:bg-success-100 transition-colors">Mark All Present</button>
          <button onClick={() => markAll('ABSENT')} className="px-3 py-1 bg-danger-50 text-danger-700 border border-danger-200 rounded text-sm hover:bg-danger-100 transition-colors">Mark All Absent</button>
        </div>
      )}

      <div className="bg-card border border-warm-200 rounded-xl overflow-hidden shadow-sm">
        <table className="min-w-full divide-y divide-warm-200">
          <thead className="bg-ivory-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-warm-500 uppercase">Student Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-warm-500 uppercase">ID</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-warm-500 uppercase">Attendance Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-200">
            {eligibleStudents.map((enrollment: any) => {
              const student = enrollment.student;
              const status = attendance[student.id];

              return (
                <tr key={student.id} className="hover:bg-ivory-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-charcoal-900">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-warm-500 font-mono">
                    {student.studentNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex justify-center gap-1">
                      <StatusButton
                        icon={<Check size={16} />}
                        label="Present"
                        active={status === 'PRESENT'}
                        color="green"
                        disabled={isLocked}
                        onClick={() => markStatus(student.id, 'PRESENT')}
                      />
                      <StatusButton
                        icon={<X size={16} />}
                        label="Absent"
                        active={status === 'ABSENT'}
                        color="red"
                        disabled={isLocked}
                        onClick={() => markStatus(student.id, 'ABSENT')}
                      />
                      <StatusButton
                        icon={<Clock size={16} />}
                        label="Late"
                        active={status === 'LATE'}
                        color="orange"
                        disabled={isLocked}
                        onClick={() => markStatus(student.id, 'LATE')}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatusButton({ icon, label, active, color, onClick, disabled }: any) {
  const colors: any = {
    green: active ? 'bg-success-600 text-white' : 'bg-card text-success-600 border-success-200 hover:bg-success-50',
    red: active ? 'bg-danger-600 text-white' : 'bg-card text-danger-600 border-danger-200 hover:bg-danger-50',
    orange: active ? 'bg-terracotta-600 text-white' : 'bg-card text-terracotta-600 border-terracotta-200 hover:bg-terracotta-50',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-md border text-xs font-medium transition-all ${colors[color]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
