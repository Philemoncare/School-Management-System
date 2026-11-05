'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  SettingsError,
  SettingsLoading,
  SettingsPageHeader,
  SettingsSection,
} from '@/components/settings/settings-ui';
import { Badge } from '@/components/ui/badge';
import { Info, ShieldCheck, Zap } from 'lucide-react';

/**
 * Feature access (read-only).
 *
 * Feature flags are owned by the platform administrator, so this page only
 * reports what the school may use. There is intentionally no write path here.
 */

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
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/settings/features');
      setFlags(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err?.message || 'Unable to load feature access.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SettingsLoading label="Loading feature access…" />;

  if (error) {
    return <SettingsError title="Unable to load feature access" message={error} onRetry={load} />;
  }

  const enabledCount = flags.filter((f) => f.isEnabled).length;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <SettingsPageHeader
        title="Feature Access"
        description="Features available to your school, controlled by the platform administrator."
        actions={<Badge variant="neutral" className="text-[10px]">{enabledCount}/{flags.length} enabled</Badge>}
      />

      <SettingsSection
        title="Platform-managed features"
        description="Enablement is set by the SchooMA platform administrator."
        icon={ShieldCheck}
      >
        <p className="text-sm text-warm-600">
          This page is read-only. To request a change to your school's feature access, contact your
          platform administrator.
        </p>
      </SettingsSection>

      {flags.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-warm-200 bg-card p-12 text-center text-xs font-semibold text-warm-400">
          No feature flags configured for your school.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {flags.map((feature) => (
            <div
              key={feature.name}
              className="flex items-center justify-between gap-6 p-6 bg-card border border-warm-100 rounded-xl"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Zap
                    size={16}
                    className={feature.isEnabled ? 'text-forest-700' : 'text-warm-300'}
                  />
                  <h3 className="text-sm font-semibold text-charcoal-800">
                    {FEATURE_LABELS[feature.name] || feature.name}
                  </h3>
                  <Badge variant={feature.isEnabled ? 'success' : 'neutral'} className="text-[10px]">
                    {feature.isEnabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                  {feature.hasOverride && (
                    <Badge variant="info" className="text-[10px]">Custom</Badge>
                  )}
                </div>
                <p className="text-xs font-medium text-warm-400 max-w-md">
                  {feature.description || 'No description provided.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Info size={16} className="text-warm-400 shrink-0" />
                <span className="text-xs text-warm-500">
                  {feature.isEnabled ? 'Available to your school' : 'Not available — contact platform admin'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
