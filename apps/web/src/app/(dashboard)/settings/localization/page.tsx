'use client';

import { Select } from '@/components/ui/input';
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

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-forest-700" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-charcoal-900">Localization & Region</h2>
        <p className="text-warm-500 text-sm font-medium">Configure timezone, currency and formatting preferences.</p>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-4">
              <h3 className="text-xs font-semibold text-warm-400 uppercase tracking-wide flex items-center gap-2">
                <Clock size={14} className="text-forest-700" /> Time & Date
              </h3>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide px-1">Timezone</label>
                <Select
                  className="w-full bg-ivory-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-forest-700 p-3"
                  value={settings.timezone}
                  onChange={e => setSettings({...settings, timezone: e.target.value})}
                >
                  <option value="UTC">UTC (Universal Coordinated Time)</option>
                  <option value="Africa/Accra">GMT (Africa/Accra)</option>
                  <option value="Africa/Lagos">WAT (Africa/Lagos)</option>
                  <option value="Africa/Nairobi">EAT (Africa/Nairobi)</option>
                  <option value="America/New_York">EST (America/New_York)</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide px-1">Date Format</label>
                <Select
                  className="w-full bg-ivory-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-forest-700 p-3"
                  value={settings.dateFormat}
                  onChange={e => setSettings({...settings, dateFormat: e.target.value})}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </Select>
              </div>
           </div>

           <div className="space-y-4">
              <h3 className="text-xs font-semibold text-warm-400 uppercase tracking-wide flex items-center gap-2">
                <Globe size={14} className="text-warning-600" /> Regional
              </h3>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide px-1">Currency</label>
                <Select
                  className="w-full bg-ivory-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-forest-700 p-3"
                  value={settings.currency}
                  onChange={e => setSettings({...settings, currency: e.target.value})}
                >
                  <option value="USD">USD ($)</option>
                  <option value="GHS">GHS (₵)</option>
                  <option value="NGN">NGN (₦)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide px-1">First Day of Week</label>
                <Select
                  className="w-full bg-ivory-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-forest-700 p-3"
                  value={settings.firstDayOfWeek}
                  onChange={e => setSettings({...settings, firstDayOfWeek: parseInt(e.target.value)})}
                >
                  <option value={0}>Sunday</option>
                  <option value={1}>Monday</option>
                </Select>
              </div>
           </div>
        </div>

        <div className="pt-8 border-t border-warm-100 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-forest-700 text-white rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-lg shadow-sage-200"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Update Localization
          </button>
        </div>
      </div>
    </div>
  );
}
