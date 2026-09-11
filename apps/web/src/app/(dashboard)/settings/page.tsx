'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Save, Loader2, AlertCircle } from 'lucide-react';

export default function BasicInfoSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const schoolId = localStorage.getItem('schoolId');
    if (schoolId) {
      apiFetch(`/schools/${schoolId}`)
        .then(setSchool)
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/schools/${school.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: school.name,
          phone: school.phone,
          email: school.email,
          address: school.address,
        })
      });
      alert('Settings updated successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-black text-gray-900">Basic School Information</h2>
          <p className="text-gray-500 text-sm font-medium">Public identity and contact details.</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3 text-red-700 text-sm font-bold">
           <AlertCircle size={18} className="shrink-0" />
           {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">School Name</label>
            <input
              type="text"
              className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 p-3"
              value={school.name}
              onChange={e => setSchool({...school, name: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">School Code</label>
            <input
              type="text"
              disabled
              className="w-full bg-gray-100 border-none rounded-xl text-sm font-bold p-3 text-gray-500"
              value={school.code}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Public Email</label>
            <input
              type="email"
              className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 p-3"
              value={school.email || ''}
              onChange={e => setSchool({...school, email: e.target.value})}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Contact Phone</label>
            <input
              type="text"
              className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 p-3"
              value={school.phone || ''}
              onChange={e => setSchool({...school, phone: e.target.value})}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Address</label>
          <textarea
            rows={3}
            className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 p-3"
            value={school.address || ''}
            onChange={e => setSchool({...school, address: e.target.value})}
          />
        </div>

        <div className="pt-6 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
