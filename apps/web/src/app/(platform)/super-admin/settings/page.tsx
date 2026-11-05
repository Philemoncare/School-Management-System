'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Flag,
  Loader2,
  Pencil,
  Plus,
  Save,
  Settings,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

type Tab = 'settings' | 'features';

export default function PlatformSettingsPage() {
  const [tab, setTab] = useState<Tab>('settings');
  const [settings, setSettings] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const [settingModal, setSettingModal] = useState(false);
  const [settingForm, setSettingForm] = useState({ key: '', value: '{\n  \n}', reason: '' });
  const [editingSetting, setEditingSetting] = useState<any>(null);

  const [featureModal, setFeatureModal] = useState(false);
  const [editingFeature, setEditingFeature] = useState<any>(null);
  const [featureForm, setFeatureForm] = useState<any>({ name: '', description: '', isEnabled: false, allSchools: false, schoolIds: [] });

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [settingsData, featuresData, schoolsData] = await Promise.all([
        apiFetch('/super-admin/settings/platform'),
        apiFetch('/super-admin/settings/features'),
        apiFetch('/super-admin/schools?take=100'),
      ]);
      setSettings(settingsData);
      setFeatures(featuresData);
      setSchools(schoolsData.items || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load platform settings');
    } finally {
      setLoading(false);
    }
  }

  function openSetting(setting?: any) {
    setEditingSetting(setting || null);
    setSettingForm({
      key: setting?.key || '',
      value: JSON.stringify(setting?.value ?? {}, null, 2),
      reason: '',
    });
    setError('');
    setSettingModal(true);
  }

  async function saveSetting() {
    if (!settingForm.key.trim()) return setError('A setting key is required.');
    let parsed: any;
    try {
      parsed = JSON.parse(settingForm.value);
    } catch {
      return setError('Setting value must be valid JSON.');
    }
    setBusy('setting');
    setError('');
    try {
      await apiFetch(`/super-admin/settings/platform/${encodeURIComponent(settingForm.key.trim())}`, {
        method: 'PUT',
        body: JSON.stringify({ value: parsed, changeReason: settingForm.reason || undefined }),
      });
      setSettingModal(false);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Unable to save setting');
    } finally {
      setBusy('');
    }
  }

  function openFeature(feature?: any) {
    setEditingFeature(feature || null);
    setFeatureForm(feature
      ? {
          name: feature.name,
          description: feature.description || '',
          isEnabled: feature.isEnabled,
          allSchools: feature.allSchools,
          schoolIds: feature.schoolIds || [],
        }
      : { name: '', description: '', isEnabled: false, allSchools: false, schoolIds: [] });
    setError('');
    setFeatureModal(true);
  }

  async function saveFeature() {
    if (!featureForm.name.trim()) return setError('A feature name is required.');
    setBusy('feature');
    setError('');
    try {
      if (editingFeature) {
        await apiFetch(`/super-admin/settings/features/${editingFeature.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            description: featureForm.description,
            isEnabled: featureForm.isEnabled,
            allSchools: featureForm.allSchools,
            schoolIds: featureForm.allSchools ? [] : featureForm.schoolIds,
          }),
        });
      } else {
        await apiFetch('/super-admin/settings/features', {
          method: 'POST',
          body: JSON.stringify({
            ...featureForm,
            schoolIds: featureForm.allSchools ? [] : featureForm.schoolIds,
          }),
        });
      }
      setFeatureModal(false);
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Unable to save feature flag');
    } finally {
      setBusy('');
    }
  }

  async function toggleFeature(feature: any) {
    setBusy(feature.id);
    setError('');
    try {
      await apiFetch(`/super-admin/settings/features/${feature.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isEnabled: !feature.isEnabled }),
      });
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Unable to toggle feature flag');
    } finally {
      setBusy('');
    }
  }

  function toggleSchool(id: string) {
    setFeatureForm((current: any) => ({
      ...current,
      schoolIds: current.schoolIds.includes(id)
        ? current.schoolIds.filter((schoolId: string) => schoolId !== id)
        : [...current.schoolIds, id],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
            <Settings className="text-forest-700" /> Platform Settings
          </h1>
          <p className="mt-1 font-medium text-warm-500">Manage platform defaults, versioned configuration, and feature rollouts.</p>
        </div>
        <Button onClick={() => tab === 'settings' ? openSetting() : openFeature()} leftIcon={<Plus size={16} />}>
          {tab === 'settings' ? 'Add setting' : 'Create feature flag'}
        </Button>
      </div>

      {error && !settingModal && !featureModal && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      <div className="flex w-fit gap-1 rounded-2xl border border-warm-200 bg-card p-1.5 shadow-sm">
        <button onClick={() => setTab('settings')} className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide ${tab === 'settings' ? 'bg-forest-700 text-white' : 'text-warm-500'}`}>Platform settings</button>
        <button onClick={() => setTab('features')} className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide ${tab === 'features' ? 'bg-forest-700 text-white' : 'text-warm-500'}`}>Feature flags</button>
      </div>

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-forest-700" size={34} /></div>
      ) : tab === 'settings' ? (
        <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>{['Key', 'Value', 'Updated', 'Actions'].map((label) => <th key={label} className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {settings.map((setting) => (
                <tr key={setting.key} className="hover:bg-ivory-50">
                  <td className="px-5 py-4 font-mono text-xs font-semibold text-charcoal-900">{setting.key}</td>
                  <td className="px-5 py-4"><pre className="max-w-md overflow-x-auto rounded-lg bg-warm-50 px-3 py-2 font-mono text-[11px] text-warm-700">{JSON.stringify(setting.value)}</pre></td>
                  <td className="px-5 py-4 text-[11px] font-semibold text-warm-500">{new Date(setting.updatedAt).toLocaleString()}</td>
                  <td className="px-5 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => openSetting(setting)}><Pencil size={15} /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {settings.length === 0 && <p className="p-12 text-center text-xs font-semibold text-warm-400">No platform settings stored yet. Add one to establish a default.</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div key={feature.id} className="rounded-2xl border border-warm-200 bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="rounded-xl bg-sage-50 p-2 text-forest-700"><Flag size={18} /></div>
                <button onClick={() => toggleFeature(feature)} disabled={busy === feature.id} className={`transition disabled:opacity-40 ${feature.isEnabled ? 'text-success-600' : 'text-warm-300'}`} title="Toggle feature">
                  {busy === feature.id ? <Loader2 size={22} className="animate-spin" /> : feature.isEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                </button>
              </div>
              <p className="mt-3 font-mono text-xs font-semibold text-charcoal-900">{feature.name}</p>
              <p className="mt-1 text-[11px] font-medium text-warm-500 min-h-[32px]">{feature.description || 'No description.'}</p>
              <div className="mt-3 flex items-center justify-between border-t border-warm-100 pt-3">
                <span className="text-[10px] font-bold uppercase text-warm-400">
                  {feature.allSchools ? 'All schools' : feature.schoolIds?.length ? `${feature.schoolIds.length} targeted` : 'No schools'}
                </span>
                <span className={`text-[10px] font-bold uppercase ${feature.isEnabled ? 'text-success-600' : 'text-warm-400'}`}>{feature.isEnabled ? 'Enabled' : 'Disabled'}</span>
              </div>
              <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => openFeature(feature)} leftIcon={<Pencil size={13} />}>Edit rollout</Button>
            </div>
          ))}
          {features.length === 0 && <div className="md:col-span-2 xl:col-span-3 rounded-2xl border-2 border-dashed border-warm-200 bg-card p-12 text-center text-xs font-semibold text-warm-400">No feature flags configured.</div>}
        </div>
      )}

      <Modal
        isOpen={settingModal}
        onClose={() => setSettingModal(false)}
        title={editingSetting ? `Edit ${editingSetting.key}` : 'Add Platform Setting'}
        footerActions={<><Button variant="outline" onClick={() => setSettingModal(false)}>Cancel</Button><Button onClick={saveSetting} isLoading={busy === 'setting'} leftIcon={<Save size={15} />}>Save setting</Button></>}
      >
        <div className="space-y-4">
          {error && <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">{error}</div>}
          <Input label="Setting key" value={settingForm.key} disabled={!!editingSetting} onChange={(e) => setSettingForm({ ...settingForm, key: e.target.value })} placeholder="e.g. platform.branding" />
          <div>
            <label className="ml-0.5 text-[11px] font-semibold text-warm-600 sm:text-xs">Value (JSON)</label>
            <textarea value={settingForm.value} onChange={(e) => setSettingForm({ ...settingForm, value: e.target.value })} rows={8} className="mt-1.5 w-full rounded-lg border border-warm-300 bg-card p-3 font-mono text-xs outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/15" />
          </div>
          <Input label="Change reason (audited)" value={settingForm.reason} onChange={(e) => setSettingForm({ ...settingForm, reason: e.target.value })} placeholder="Why is this changing?" />
        </div>
      </Modal>

      <Modal
        isOpen={featureModal}
        onClose={() => setFeatureModal(false)}
        title={editingFeature ? `Edit ${editingFeature.name}` : 'Create Feature Flag'}
        size="lg"
        footerActions={<><Button variant="outline" onClick={() => setFeatureModal(false)}>Cancel</Button><Button onClick={saveFeature} isLoading={busy === 'feature'}>{editingFeature ? 'Save rollout' : 'Create flag'}</Button></>}
      >
        <div className="space-y-4">
          {error && <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">{error}</div>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Feature name" value={featureForm.name} disabled={!!editingFeature} onChange={(e) => setFeatureForm({ ...featureForm, name: e.target.value.toUpperCase() })} placeholder="NEW_FEATURE" />
            <Input label="Description" value={featureForm.description} onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-warm-200 p-3">
              <input type="checkbox" checked={featureForm.isEnabled} onChange={(e) => setFeatureForm({ ...featureForm, isEnabled: e.target.checked })} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
              <span className="text-xs font-semibold text-warm-700">Feature enabled</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-warm-200 p-3">
              <input type="checkbox" checked={featureForm.allSchools} onChange={(e) => setFeatureForm({ ...featureForm, allSchools: e.target.checked })} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
              <span className="text-xs font-semibold text-warm-700">Roll out to all schools</span>
            </label>
          </div>
          {!featureForm.allSchools && (
            <div>
              <p className="mb-2 text-xs font-semibold text-warm-600">Targeted schools ({featureForm.schoolIds.length})</p>
              <div className="grid max-h-52 grid-cols-1 gap-1 overflow-y-auto rounded-xl border border-warm-200 p-2 sm:grid-cols-2">
                {schools.map((school) => (
                  <label key={school.id} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-ivory-50">
                    <input type="checkbox" checked={featureForm.schoolIds.includes(school.id)} onChange={() => toggleSchool(school.id)} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
                    <span className="truncate text-xs font-semibold text-warm-700">{school.name}</span>
                  </label>
                ))}
                {schools.length === 0 && <p className="p-2 text-xs text-warm-400">No schools available.</p>}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
