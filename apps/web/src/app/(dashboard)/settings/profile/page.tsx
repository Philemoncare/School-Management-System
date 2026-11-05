'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  SettingsError,
  SettingsLoading,
  SettingsNotice,
  SettingsPageHeader,
  SettingsSection,
  useSettingsAccess,
} from '@/components/settings/settings-ui';
import { Building2, Mail, Globe, ShieldCheck } from 'lucide-react';

/** Keys persisted in the SchoolSetting table (PATCH /schools/me stores extras as KV). */
const EXTRA_KEYS = ['schoolType', 'schoolCategory', 'headteacherName', 'website'] as const;

const TIMEZONES = [
  'UTC',
  'Africa/Accra',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/New_York',
];

const CURRENCIES = ['USD', 'GHS', 'NGN', 'KES', 'EUR', 'GBP'];

/**
 * Shape the form starts in, before the school has loaded.
 *
 * Every control below is rendered with `value={form.<key>}`, so a missing key
 * means React sees an undefined value and treats the field as uncontrolled. The
 * moment the school arrives the same field gets a string, and React rejects that
 * uncontrolled-to-controlled switch. Keeping the keys present with empty values
 * means the input is controlled for its whole life.
 */
const EMPTY_FORM: Record<string, string> = EXTRA_KEYS.reduce(
  (acc, key) => ({ ...acc, [key]: '' }),
  { name: '', email: '', phone: '', address: '', timezone: 'UTC', currency: 'USD' },
);

export default function SchoolProfilePage() {
  const { canManage } = useSettingsAccess(['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL']);

  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    apiFetch('/schools/me')
      .then(setSchool)
      .catch((err) => setLoadError(err.message || 'Unable to load school profile'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  /** Flatten SchoolSetting KV rows into initial form values. */
  const initial = useMemo(() => {
    const extras: Record<string, string> = {};
    for (const key of EXTRA_KEYS) {
      const row = school?.schoolSettings?.find((s: any) => s.key === key);
      extras[key] = row?.value != null ? String(row.value) : '';
    }
    return extras;
  }, [school]);

  const [form, setForm] = useState<any>(EMPTY_FORM);
  useEffect(() => {
    if (!school) return;
    setForm({
      name: school.name || '',
      email: school.email || '',
      phone: school.phone || '',
      address: school.address || '',
      timezone: school.timezone || 'UTC',
      currency: school.currency || 'USD',
      ...initial,
    });
  }, [school, initial]);

  const setField = (key: string) => (e: any) =>
    setForm((prev: any) => ({ ...prev, [key]: e?.target ? e.target.value : e }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!form.name?.trim()) {
      setError('School name is required.');
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSaving(true);
    try {
      // Core fields update the School record; the rest are upserted by the
      // API into SchoolSetting (key/value) rows for this school.
      const updated = await apiFetch('/schools/me', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setSchool((prev: any) => ({
        ...prev,
        ...updated,
        schoolSettings: EXTRA_KEYS.map((key) => ({
          key,
          value: form[key] ?? '',
        })),
      }));
      setMessage('School profile saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Unable to save school profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SettingsLoading label="Loading school profile…" />;
  if (loadError)
    return <SettingsError title="Unable to load profile" message={loadError} onRetry={load} />;

  const statusVariant =
    school?.status === 'ACTIVE'
      ? 'success'
      : school?.status === 'SUSPENDED'
        ? 'error'
        : 'warning';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SettingsPageHeader
        title="School Profile"
        description="Manage your school's identity, contact details and regional settings."
        actions={
          canManage && (
            <Button
              onClick={handleSubmit}
              isLoading={saving}
              leftIcon={<ShieldCheck className="w-4 h-4" />}
            >
              Save Changes
            </Button>
          )
        }
      />

      {!canManage && (
        <div className="rounded-xl border border-warm-200 bg-ivory-50 p-4 text-sm font-medium text-warm-600">
          You have view-only access. Ask a School Administrator to change these details.
        </div>
      )}
      {error && <SettingsNotice kind="error" message={error} />}
      {message && <SettingsNotice kind="success" message={message} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <SettingsSection
          title="Core Identity"
          description="How your school is identified across the platform."
          icon={Building2}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="School Name *"
              value={form.name || ''}
              disabled={!canManage}
              onChange={setField('name')}
            />
            <Input label="Registration Code" value={school?.code || ''} disabled />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="School Type"
              value={form.schoolType || ''}
              disabled={!canManage}
              onChange={setField('schoolType')}
              placeholder="e.g. Private Basic School"
            />
            <Input
              label="School Category"
              value={form.schoolCategory || ''}
              disabled={!canManage}
              onChange={setField('schoolCategory')}
              placeholder="e.g. K-12"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Headteacher / Principal"
              value={form.headteacherName || ''}
              disabled={!canManage}
              onChange={setField('headteacherName')}
            />
            <Input
              label="School Website"
              type="url"
              value={form.website || ''}
              disabled={!canManage}
              onChange={setField('website')}
              placeholder="https://www.example.edu"
            />
          </div>
          {school?.logo && (
            <div className="flex items-center gap-3 p-3 rounded-lg border border-warm-200 bg-ivory-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={school.logo}
                alt="School logo"
                className="w-12 h-12 rounded-lg object-contain bg-card border border-warm-200"
              />
              <span className="text-xs font-semibold text-warm-500">Current school logo</span>
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title="Contact Information"
          description="The public contact details shown on receipts, invitations and reports."
          icon={Mail}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Public Email"
              type="email"
              value={form.email || ''}
              disabled={!canManage}
              onChange={setField('email')}
            />
            <Input
              label="Primary Phone"
              value={form.phone || ''}
              disabled={!canManage}
              onChange={setField('phone')}
              placeholder="+233 000 000 000"
            />
          </div>
          <Input
            label="Physical Address"
            as="textarea"
            rows={3}
            value={form.address || ''}
            disabled={!canManage}
            onChange={setField('address')}
            placeholder="Full physical address of the campus"
          />
        </SettingsSection>

        <SettingsSection
          title="Regional Settings"
          description="Timezone and currency applied across the school workspace."
          icon={Globe}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Timezone"
              value={form.timezone || 'UTC'}
              disabled={!canManage}
              onChange={setField('timezone')}
            >
              {TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
            <Select
              label="Currency"
              value={form.currency || 'USD'}
              disabled={!canManage}
              onChange={setField('currency')}
            >
              {CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <p className="text-[11px] text-warm-500">
            Date and time formatting preferences are managed under Settings → Localization &amp;
            Region.
          </p>
        </SettingsSection>

        <SettingsSection
          title="Workspace"
          description="Read-only platform facts about your school's tenant."
          icon={ShieldCheck}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg border border-warm-200">
              <p className="text-[10px] uppercase font-bold text-warm-400">Status</p>
              <Badge variant={statusVariant} className="mt-1">
                {school?.status || 'UNKNOWN'}
              </Badge>
            </div>
            <div className="p-3 rounded-lg border border-warm-200">
              <p className="text-[10px] uppercase font-bold text-warm-400">Workspace Slug</p>
              <p className="mt-1 font-semibold text-charcoal-900 break-all">
                {school?.slug || '—'}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-warm-200">
              <p className="text-[10px] uppercase font-bold text-warm-400">Since</p>
              <p className="mt-1 font-semibold text-charcoal-900">
                {school?.createdAt ? new Date(school.createdAt).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </SettingsSection>
      </form>
    </div>
  );
}
