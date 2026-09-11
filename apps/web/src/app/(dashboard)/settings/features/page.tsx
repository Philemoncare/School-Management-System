'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Save, Loader2, Zap, Info } from 'lucide-react';

const FEATURES = [
  { name: 'LIBRARY_MANAGEMENT', label: 'Library Module', description: 'Enable digital book catalog and loan tracking.' },
  { name: 'TRANSPORT_MANAGEMENT', label: 'Transport Module', description: 'Route planning and vehicle management.' },
  { name: 'ONLINE_PAYMENTS', label: 'Online Payments', description: 'Allow parents to pay fees via credit card/mobile money.' },
  { name: 'ADMISSIONS_PORTAL', label: 'Public Admissions', description: 'Enable the public-facing application form.' },
  { name: 'MESSAGING_SYSTEM', label: 'Private Messaging', description: 'Internal secure communication for staff and parents.' },
];

export default function FeatureSettings() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
     // Fetch features for this school
     // For now mocking the retrieval
     setFlags(FEATURES.map(f => ({ ...f, isEnabled: true, isLocked: false })));
     setLoading(false);
  }, []);

  const toggleFeature = (name: string) => {
    setFlags(flags.map(f => f.name === name ? { ...f, isEnabled: !f.isEnabled } : f));
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin text-blue-600" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-xl font-black text-gray-900">Feature Management</h2>
        <p className="text-gray-500 text-sm font-medium">Enable or disable specific system capabilities.</p>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 mb-8 flex items-start gap-4">
         <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-200">
            <Zap size={20} />
         </div>
         <div>
            <h4 className="text-sm font-black text-blue-900 uppercase tracking-tight">Subscription Entitlements</h4>
            <p className="text-xs font-bold text-blue-700/70 mt-1 leading-relaxed">
              Some features are controlled by your platform subscription. Features marked with a lock icon require a plan upgrade to activate.
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {flags.map((feature) => (
          <div key={feature.name} className="flex items-center justify-between p-6 bg-white border border-gray-100 rounded-[2rem] hover:shadow-xl hover:shadow-gray-100/50 transition-all group">
             <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-sm font-black text-gray-800">{feature.label}</h3>
                  {feature.isLocked && (
                    <span className="px-2 py-0.5 bg-amber-50 text-amber-600 text-[9px] font-black rounded uppercase tracking-wider">Locked</span>
                  )}
                </div>
                <p className="text-xs font-bold text-gray-400 max-w-md">{feature.description}</p>
             </div>

             <div className="flex items-center gap-4">
                <button
                  disabled={feature.isLocked}
                  onClick={() => toggleFeature(feature.name)}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    feature.isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                  } ${feature.isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      feature.isEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
             </div>
          </div>
        ))}
      </div>

      <div className="mt-10 pt-8 border-t border-gray-100 flex justify-end">
         <button className="flex items-center gap-2 px-10 py-3.5 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200">
            <Save size={16} /> Save Capabilities
         </button>
      </div>
    </div>
  );
}
