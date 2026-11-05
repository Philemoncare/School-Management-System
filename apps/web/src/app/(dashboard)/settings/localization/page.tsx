'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  SettingsError,
  SettingsLoading,
  SettingsNotice,
  SettingsPageHeader,
  SettingsSection,
  useSettingsAccess,
} from '@/components/settings/settings-ui';
import { Calendar, Clock, Globe, Save } from 'lucide-react';

/**
 * Formatting preferences only. School timezone and currency live on the
 * school record and are edited in Settings -> School Profile, so this page
 * shows them read-only rather than offering a second, conflicting writer.
 */
const FORMAT_KEYS = ['dateFormat', 'timeFormat', 'firstDayOfWeek'] as const;

const DEFAULTS: Record<string, any> = {
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '24h',
  firstDayOfWeek: 1,
};

export default function LocalizationSettings() {
  // The API only accepts setting writes from SCHOOL_ADMIN (alias ADMIN), so the
  // edit UI is gated identically — a PRINCIPAL sees a read-only view.
  const { canManage } = useSettingsAccess(['SCHOOL_ADMIN', 'ADMIN']);
  const [settings, setSettings] = useState<Record<string, any>>(DEFAULTS);
  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    setLoadError('');
    Promise.all([
      apiFetch(
        `/settings/effective?keys=${FORMAT_KEYS.join(',')}`,
      ).catch(() => ({})),
      apiFetch('/schools/me').catch(() => null),
    ])
      .then(([formatSettings, schoolData]) => {
        // The effective-settings response wraps values; keep plain scalars.
        const normalized: Record<string, any> = { ...DEFAULTS };
        for (const key of FORMAT_KEYS) {
          const raw = (formatSettings as any)?.[key];
          if (raw !== undefined && raw !== null) {
            normalized[key] = typeof raw === 'object' && 'value' in raw ? raw.value : raw;
          }
        }
        setSettings(normalized);
        setSchool(schoolData);
      })
      .catch((err) => setLoadError(err.message || 'Unable to load localization settings'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async () => {
    setError('');
    setMessage('');
    setSaving(true);
    try {
      for (const key of FORMAT_KEYS) {
        await apiFetch(`/settings/${key}`, {
          method: 'PUT',
          body: JSON.stringify({ value: settings[key] }),
        });
      }
      setMessage('Localization settings updated.');
    } catch (err: any) {
      setError(err.message || 'Unable to save localization settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SettingsLoading label="Loading localization settings" />;
  if (loadError)
    return <SettingsError title="Unable to load settings" message={loadError} onRetry={load} />;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <SettingsPageHeader
        title="Localization & Region"
        description="Date, time and week formatting preferences for your school."
        actions={
          canManage && (
            <Button onClick={handleSave} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
              Save Changes
            </Button>
          )
        }
      />

      {error && <SettingsNotice kind="error" message={error} />}
      {message && <SettingsNotice kind="success" message={message} />}

      {!canManage && (
        <div className="rounded-xl border border-warm-200 bg-ivory-50 p-4 text-sm font-medium text-warm-600">
          You have view-only access. Formatting preferences can be changed by a School Administrator.
        </div>
      )}

      <SettingsSection
        title="Time & Date"
        description="How dates and times are displayed across the school workspace."
        icon={Clock}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Date Format"
            value={String(settings.dateFormat)}
            disabled={!canManage}
            onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
          </Select>
          <Select
            label="Time Format"
            value={String(settings.timeFormat)}
            disabled={!canManage}
            onChange={(e) => setSettings({ ...settings, timeFormat: e.target.value })}
          >
            <option value="24h">24-hour (14:30)</option>
            <option value="12h">12-hour (2:30 PM)</option>
          </Select>
        </div>
        <Select
          label="First Day of Week"
          value={String(settings.firstDayOfWeek)}
          disabled={!canManage}
          onChange={(e) =>
            setSettings({ ...settings, firstDayOfWeek: parseInt(e.target.value, 10) })
          }
        >
          <option value="1">Monday</option>
          <option value="0">Sunday</option>
        </Select>
      </SettingsSection>

      <SettingsSection
        title="School Region"
        description="Owned by School Profile — change it there so every module stays consistent."
        icon={Globe}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-warm-200">
            <p className="text-[10px] uppercase font-bold text-warm-400">Timezone</p>
            <p className="mt-1 text-sm font-semibold text-charcoal-900">
              {school?.timezone || 'UTC'}
            </p>
          </div>
          <div className="p-3 rounded-lg border border-warm-200">
            <p className="text-[10px] uppercase font-bold text-warm-400">Currency</p>
            <p className="mt-1 text-sm font-semibold text-charcoal-900">
              {school?.currency || 'USD'}
            </p>
          </div>
        </div>
        <Link
          href="/settings/profile"
          className="inline-flex items-center gap-2 text-xs font-semibold text-forest-700 hover:underline"
        >
          <Calendar className="w-3 h-3" /> Edit timezone and currency in School Profile
        </Link>
      </SettingsSection>
    </div>
  );
}
