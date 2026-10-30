'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { AlertCircle, Loader2, Zap, ShieldCheck, Info } from 'lucide-react';

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

  useEffect(() => {
    apiFetch('/settings/features')
      .then((data: any) => {
        setFlags(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.message || 'Unable to load feature settings.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-forest-700" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-charcoal-900">Feature Access</h2>
        <p className="text-warm-500 text-sm font-medium">
          Features available to your school, controlled by the platform administrator.
        </p>
      </div>

      <div className="bg-sage-50 border border-sage-100 rounded-xl p-6 mb-8 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-forest-700 flex items-center justify-center text-white shrink-0">
          <ShieldCheck size={20} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-forest-950">Platform-managed features</h4>
          <p className="text-xs font-medium text-forest-800/70 mt-1 leading-relaxed">
            Feature enablement is controlled by the SchooMA platform administrator.
            Contact your platform admin to request changes to your school's feature access.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-xs font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {flags.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-warm-200 bg-card p-12 text-center text-xs font-semibold text-warm-400">
            No feature flags configured for your school.
          </div>
        ) : (
          flags.map((feature) => (
            <div
              key={feature.name}
              className="flex items-center justify-between gap-6 p-6 bg-card border border-warm-100 rounded-xl"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-semibold text-charcoal-800">
                    {FEATURE_LABELS[feature.name] || feature.name}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    feature.isEnabled
                      ? 'bg-forest-100 text-forest-700'
                      : 'bg-warm-100 text-warm-600'
                  }`}>
                    {feature.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  {feature.hasOverride && (
                    <span className="px-2 py-0.5 bg-sage-50 text-forest-700 text-[11px] font-semibold rounded uppercase tracking-wider">
                      Custom
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-warm-400 max-w-md">
                  {feature.description || 'No description provided.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Info size={16} className="text-warm-400" />
                <span className="text-xs text-warm-500">
                  {feature.isEnabled ? 'Available to your school' : 'Not available — contact platform admin'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
