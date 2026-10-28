'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Building2,
  Save,
  Upload,
  Globe,
  Mail,
  Phone,
  MapPin,
  Clock,
  BadgeDollarSign,
  ShieldCheck,
  Loader2,
  CheckCircle
} from 'lucide-react';

export default function SchoolSettingsPage() {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    apiFetch('/school-profile')
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      await apiFetch('/school-profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          address: profile.address,
          timezone: profile.timezone,
          currency: profile.currency,
        })
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      showFeedback('ERROR', 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">School Configuration</h1>
          <p className="text-warm-500 font-medium mt-1">Manage institutional profile, branding and regional preferences.</p>
        </div>
        {success && (
          <div className="flex items-center gap-2 text-success-600 bg-success-50 px-4 py-2 rounded-xl border border-success-100 animate-in fade-in slide-in-from-top-2">
             <CheckCircle size={18} />
             <span className="text-sm font-bold uppercase tracking-wide">Settings Saved</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Branding Section */}
        <section className="bg-card border border-warm-200 rounded-3xl p-8 shadow-sm">
           <h3 className="text-lg font-semibold text-charcoal-900 mb-8 flex items-center gap-2">
             <Building2 size={20} className="text-forest-700" /> Identity & Branding
           </h3>
           <div className="flex flex-col md:flex-row gap-10">
              <div className="shrink-0 text-center">
                 <div className="w-32 h-32 rounded-3xl bg-ivory-50 border-2 border-dashed border-warm-200 flex flex-col items-center justify-center text-warm-400 hover:border-sage-400 hover:bg-sage-50 transition-all cursor-pointer group">
                    <Upload size={24} className="group-hover:text-forest-500 mb-1" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Upload Logo</span>
                 </div>
                 <p className="text-[11px] font-bold text-warm-400 uppercase mt-3">PNG, JPG up to 2MB</p>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                 <InputGroup label="Official School Name" value={profile.name} onChange={(v) => setProfile({...profile, name: v})} icon={<Building2 size={16}/>} />
                 <InputGroup label="School Code (Read-only)" value={profile.code} disabled icon={<ShieldCheck size={16}/>} />
                 <InputGroup label="System Slug" value={profile.slug} disabled icon={<Globe size={16}/>} />
              </div>
           </div>
        </section>

        {/* Contact Info */}
        <section className="bg-card border border-warm-200 rounded-3xl p-8 shadow-sm">
           <h3 className="text-lg font-semibold text-charcoal-900 mb-8 flex items-center gap-2">
             <Mail size={20} className="text-forest-700" /> Communication Details
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputGroup label="Official Email" value={profile.email} onChange={(v) => setProfile({...profile, email: v})} icon={<Mail size={16}/>} />
              <InputGroup label="Contact Phone" value={profile.phone} onChange={(v) => setProfile({...profile, phone: v})} icon={<Phone size={16}/>} />
              <div className="md:col-span-2">
                 <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-2 px-1">Physical Address</label>
                 <div className="relative">
                    <div className="absolute top-4 left-4 text-warm-400"><MapPin size={16}/></div>
                    <textarea
                      className="w-full bg-ivory-50 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-forest-700 transition-all min-h-[100px]"
                      value={profile.address || ''}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                    />
                 </div>
              </div>
           </div>
        </section>

        {/* Localization */}
        <section className="bg-card border border-warm-200 rounded-3xl p-8 shadow-sm">
           <h3 className="text-lg font-semibold text-charcoal-900 mb-8 flex items-center gap-2">
             <Globe size={20} className="text-forest-700" /> Regional Settings
           </h3>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectGroup
                label="Timezone"
                value={profile.timezone}
                onChange={(v) => setProfile({...profile, timezone: v})}
                icon={<Clock size={16}/>}
                options={['UTC', 'Africa/Accra', 'Africa/Lagos', 'Africa/Nairobi']}
              />
              <SelectGroup
                label="Currency"
                value={profile.currency}
                onChange={(v) => setProfile({...profile, currency: v})}
                icon={<BadgeDollarSign size={16}/>}
                options={['USD', 'GHS', 'NGN', 'KES']}
              />
           </div>
        </section>

        <div className="flex justify-end pt-4">
           <button
             type="submit"
             disabled={saving}
             className="bg-forest-700 text-white px-10 py-4 rounded-2xl font-semibold text-sm uppercase tracking-wide hover:bg-forest-800 shadow-xs shadow-sage-200 transition-all flex items-center gap-3 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Changes
           </button>
        </div>
      </form>
    </div>
  );
}

function InputGroup({ label, value, onChange, disabled = false, icon }: any) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-2 px-1">{label}</label>
      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-warm-400">{icon}</div>
         <input
           type="text"
           disabled={disabled}
           className="w-full bg-ivory-50 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-forest-700 transition-all disabled:opacity-50"
           value={value || ''}
           onChange={(e) => onChange?.(e.target.value)}
         />
      </div>
    </div>
  );
}

function SelectGroup({ label, value, onChange, icon, options }: any) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-2 px-1">{label}</label>
      <div className="relative">
         <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-warm-400">{icon}</div>
         <Select
           className="w-full bg-ivory-50 border-none rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold focus:ring-2 focus:ring-forest-700 transition-all appearance-none"
           value={value}
           onChange={(e) => onChange(e.target.value)}
         >
            {options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
         </Select>
      </div>
    </div>
  );
}

