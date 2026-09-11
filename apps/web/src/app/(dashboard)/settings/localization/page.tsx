'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Save, Loader2, Globe, Clock, Calendar } from 'lucide-react';

export default function LocalizationSettings() {
  const [settings, setSettings] = useState<any>({
    timezone: 'UTC',
    currency: 'USD',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24h',
    firstDayOfWeek: 1
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Fetch effective settings
    apiFetch('/settings/effective?keys=timezone,currency,dateFormat,timeFormat,firstDayOfWeek')
      .then(setSettings)
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        await apiFetch(`/settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value })
        });
      }
      alert('Localization settings updated!');
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
        <h2 className="text-xl font-black text-gray-900">Localization & Region</h2>
        <p className="text-gray-500 text-sm font-medium">Configure timezone, currency and formatting preferences.</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Clock size={14} className="text-blue-600" /> Time & Date
              </h3>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Timezone</label>
                <select
                  className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 p-3"
                  value={settings.timezone}
                  onChange={e => setSettings({...settings, timezone: e.target.value})}
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="Africa/Accra">GMT (Africa/Accra)</option>
                  <option value="Africa/Lagos">WAT (Africa/Lagos)</option>
                  <option value="Africa/Nairobi">EAT (Africa/Nairobi)</option>
                  <option value="America/New_York">EST (America/New_York)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date Format</label>
                <select
                  className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 p-3"
                  value={settings.dateFormat}
                  onChange={e => setSettings({...settings, dateFormat: e.target.value})}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Globe size={14} className="text-amber-600" /> Regional
              </h3>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Currency</label>
                <select
                  className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 p-3"
                  value={settings.currency}
                  onChange={e => setSettings({...settings, currency: e.target.value})}
                >
                  <option value="USD">USD ($)</option>
                  <option value="GHS">GHS (₵)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">First Day of Week</label>
                <select
                  className="w-full bg-gray-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-600 p-3"
                  value={settings.firstDayOfWeek}
                  onChange={e => setSettings({...settings, firstDayOfWeek: parseInt(e.target.value)})}
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                </select>
              </div>
           </div>
        </div>

        <div className="pt-8 border-t border-gray-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Update Localization
          </button>
        </div>
      </div>
    </div>
  );
}
