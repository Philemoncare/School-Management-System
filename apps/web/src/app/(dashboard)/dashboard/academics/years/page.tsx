'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../../../lib/api/client';

export default function AcademicYearsPage() {
  const [years, setYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/academic-years')
      .then(setYears)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Academic Years</h1>
          <p className="text-gray-600">Configure and manage school academic cycles.</p>
        </div>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
          Create Academic Year
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Year Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Code</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Start Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">End Date</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {years.map((year) => (
              <tr key={year.id} className={year.isCurrent ? 'bg-blue-50/50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="font-medium text-gray-900">{year.name}</span>
                    {year.isCurrent && (
                      <span className="ml-2 px-2 py-0.5 text-[10px] font-bold uppercase bg-blue-600 text-white rounded">Current</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-500">{year.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(year.startDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                  {new Date(year.endDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    year.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {year.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                  <button className="text-blue-600 hover:text-blue-900 font-medium">Edit</button>
                  <span className="mx-2 text-gray-300">|</span>
                  <button className="text-blue-600 hover:text-blue-900 font-medium">Manage Terms</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
