'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import Link from 'next/link';

export default function StudentsListPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadStudents();
  }, [search]);

  async function loadStudents() {
    setLoading(true);
    try {
      const result = await apiFetch(`/students?search=${search}`);
      setData(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading && !data) return <div className="py-12 text-center text-warm-500 font-medium text-xs">Loading students...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight">Students</h1>
          <p className="text-xs sm:text-sm text-warm-500 font-medium mt-0.5">Manage enrolled student profiles and records.</p>
        </div>
        <button className="bg-forest-700 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-forest-800 transition-colors w-full sm:w-auto text-sm">
          Add Student
        </button>
      </div>

      <div className="w-full max-w-md">
        <input
          type="text"
          placeholder="Search by name, student number..."
          className="w-full px-4 py-2.5 border border-warm-200 rounded-lg text-sm outline-none focus:border-forest-600 bg-card"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card border border-warm-200 shadow-xs rounded-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-bold text-warm-500 uppercase tracking-wide">Name</th>
                <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-bold text-warm-500 uppercase tracking-wide">ID</th>
                <th className="px-4 sm:px-6 py-3 text-left text-[11px] font-bold text-warm-500 uppercase tracking-wide">Status</th>
                <th className="px-4 sm:px-6 py-3 text-right text-[11px] font-bold text-warm-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-warm-100">
              {data?.items?.map((student: any) => (
                <tr key={student.id} className="hover:bg-sage-50/30 transition-colors">
                  <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-sm font-semibold text-charcoal-900">
                    {student.firstName} {student.lastName}
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap font-mono text-xs text-warm-600">
                    {student.studentNumber}
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold uppercase rounded-full bg-success-100 text-success-800">
                      {student.status}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-3.5 whitespace-nowrap text-right text-xs font-bold">
                    <Link href={`/dashboard/students/${student.id}`} className="text-forest-700 hover:text-forest-950 underline">
                      View Profile
                    </Link>
                  </td>
                </tr>
              ))}
              {(!data?.items || data.items.length === 0) && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-warm-400 font-bold uppercase tracking-wide">
                    No student records found
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
