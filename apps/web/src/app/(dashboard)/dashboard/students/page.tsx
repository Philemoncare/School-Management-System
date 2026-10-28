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

  if (loading && !data) return <div>Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Students</h1>
        <button className="bg-forest-700 text-white px-4 py-2 rounded-md hover:bg-forest-800">
          Add Student
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, student number..."
          className="w-full max-w-md px-4 py-2 border rounded-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-card shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-warm-200">
          <thead className="bg-ivory-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-warm-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-warm-200">
            {data?.items.map((student: any) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {student.firstName} {student.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">
                  {student.studentNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-800">
                    {student.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Link href={`/dashboard/students/${student.id}`} className="text-forest-700 hover:text-forest-950">
                    View Profile
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
