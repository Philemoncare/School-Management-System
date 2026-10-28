'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { AlertCircle, CheckCircle2, Loader2, Zap } from 'lucide-react';

const FEATURE_LABELS: Record<string, string> = {
  LIBRARY_MANAGEMENT: 'Library Module',
  TRANSPORT_MANAGEMENT: 'Transport Module',
  ONLINE_PAYMENTS: 'Online Payments',
  ADMISSIONS_PORTAL: 'Public Admissions',
  MESSAGING_SYSTEM: 'Private Messaging',
  HEALTH_MANAGEMENT: 'Health Management',
  INVENTORY_MANAGEMENT: 'Inventory Management',
};

type FeatureFlag = {
  name: string;
  description: string | null;
  isEnabled: boolean;
  hasOverride: boolean;
};

export default function FeatureSettings() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    apiFetch('/settings/features')
      .then(setFlags)
      .catch((err) => setError(err.message || 'Unable to load feature settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function toggleFeature(feature: FeatureFlag) {
    const nextValue = !feature.isEnabled;
    setSaving(feature.name);
    setError('');
    setSaved('');
    try {
      await apiFetch(`/settings/features/${feature.name}`, {
        method: 'PUT',
        body: JSON.stringify({ isEnabled: nextValue }),
      });
      setFlags((current) =>
        current.map((item) =>
          item.name === feature.name ? { ...item, isEnabled: nextValue, hasOverride: true } : item,
        ),
      );
      setSaved(`${FEATURE_LABELS[feature.name] || feature.name} ${nextValue ? 'enabled' : 'disabled'}.`);
    } catch (err: any) {
      setError(err.message || 'The feature could not be updated.');
    } finally {
      setSaving(null);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-forest-700" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-charcoal-900">Feature Management</h2>
        <p className="text-warm-500 text-sm font-medium">Enable or disable capabilities for this school.</p>
      </div>

      <div className="bg-sage-50 border border-sage-100 rounded-xl p-6 mb-8 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-white shrink-0">
          <Zap size={20} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-forest-950">School feature overrides</h4>
          <p className="text-xs font-medium text-forest-800/70 mt-1 leading-relaxed">
            Changes apply immediately to this school. Platform-wide defaults remain unchanged.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}
      {saved && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-success-200 bg-success-50 p-4 text-success-700">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-semibold">{saved}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {flags.map((feature) => (
          <div key={feature.name} className="flex items-center justify-between gap-6 p-6 bg-card border border-warm-100 rounded-xl">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-sm font-semibold text-charcoal-800">{FEATURE_LABELS[feature.name] || feature.name}</h3>
                {feature.hasOverride && (
                  <span className="px-2 py-0.5 bg-sage-50 text-forest-700 text-[11px] font-semibold rounded uppercase tracking-wider">Custom</span>
                )}
              </div>
              <p className="text-xs font-medium text-warm-400 max-w-md">{feature.description || 'No description provided.'}</p>
            </div>

            <button
              type="button"
              disabled={saving === feature.name}
              aria-label={`${feature.isEnabled ? 'Disable' : 'Enable'} ${FEATURE_LABELS[feature.name] || feature.name}`}
              onClick={() => toggleFeature(feature)}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                feature.isEnabled ? 'bg-forest-700' : 'bg-warm-200'
              } disabled:opacity-60`}
            >
              {saving === feature.name ? (
                <Loader2 size={16} className="absolute left-1/2 -translate-x-1/2 animate-spin text-white" />
              ) : (
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-card transition-transform ${
                    feature.isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
