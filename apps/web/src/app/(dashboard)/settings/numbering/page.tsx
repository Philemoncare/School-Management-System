'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Save, Loader2, RefreshCw } from 'lucide-react';

const ENTITIES = [
  { key: 'STUDENT', label: 'Student Number' },
  { key: 'ADMISSION_APPLICATION', label: 'Admission Application' },
  { key: 'STAFF', label: 'Staff Employee ID' },
  { key: 'INVOICE', label: 'Invoice Number' },
  { key: 'PAYMENT', label: 'Payment Reference' },
  { key: 'RECEIPT', label: 'Receipt Number' },
];

export default function NumberingSettings() {
  const [rules, setRules] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Initial fetch of rules
    // For now mocking or fetching from specialized endpoint
    apiFetch('/settings/numbering/rules')
      .then(setRules)
      .catch(() => setRules({}))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (entity: string) => {
    setSaving(true);
    try {
      await apiFetch(`/settings/numbering/${entity}`, {
        method: 'PUT',
        body: JSON.stringify(rules[entity])
      });
      alert(`${entity} numbering rule updated!`);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-black text-gray-900">Numbering & Sequences</h2>
        <p className="text-gray-500 text-sm font-medium">Define how identifiers are generated across the system.</p>
      </div>

      <div className="space-y-6">
        {ENTITIES.map((entity) => (
          <div key={entity.key} className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
             <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">{entity.label}</h3>
                <div className="px-3 py-1 bg-white rounded-lg border border-gray-200 text-[10px] font-black text-gray-400">
                   Current Val: {rules[entity.key]?.currentValue || 0}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Prefix</label>
                  <input
                    type="text"
                    className="w-full bg-white border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 p-2.5"
                    placeholder="e.g. STU"
                    value={rules[entity.key]?.prefix || ''}
                    onChange={e => setRules({...rules, [entity.key]: {...rules[entity.key], prefix: e.target.value}})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Padding</label>
                  <select
                    className="w-full bg-white border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 p-2.5"
                    value={rules[entity.key]?.padding || 6}
                    onChange={e => setRules({...rules, [entity.key]: {...rules[entity.key], padding: parseInt(e.target.value)}})}
                  >
                    <option value={4}>4 Digits</option>
                    <option value={5}>5 Digits</option>
                    <option value={6}>6 Digits</option>
                    <option value={8}>8 Digits</option>
                  </select>
                </div>
                <div className="flex items-end pb-1.5">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-600"
                      checked={rules[entity.key]?.includeYear ?? true}
                      onChange={e => setRules({...rules, [entity.key]: {...rules[entity.key], includeYear: e.target.checked}})}
                    />
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-gray-700 transition-colors">Include Year</span>
                  </label>
                </div>
                <div className="flex items-end">
                   <button
                     onClick={() => handleSave(entity.key)}
                     disabled={saving}
                     className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all shadow-sm"
                   >
                     <Save size={14} /> Update Rule
                   </button>
                </div>
             </div>

             <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                <p className="text-[10px] font-bold text-gray-400 uppercase">Preview: <span className="text-blue-600 ml-2">
                  {rules[entity.key]?.prefix || 'PREFIX'}-{rules[entity.key]?.includeYear !== false ? new Date().getFullYear() : ''}-{ '0'.repeat(rules[entity.key]?.padding || 6).slice(0, -1) + '1' }
                </span></p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
