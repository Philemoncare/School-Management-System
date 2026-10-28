'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  Loader2,
  Lock,
  Save,
  User,
} from 'lucide-react';

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
};

type Preference = {
  notificationType: string;
  channel: string;
  isEnabled: boolean;
};

const NOTIFICATION_OPTIONS = [
  { notificationType: 'ANNOUNCEMENT', channel: 'EMAIL', label: 'Announcement emails', description: 'Receive school announcements by email.' },
  { notificationType: 'MESSAGE', channel: 'IN_APP', label: 'In-app messages', description: 'Show new messages in your notification tray.' },
  { notificationType: 'ATTENDANCE', channel: 'EMAIL', label: 'Attendance alerts', description: 'Email alerts for attendance follow-ups.' },
  { notificationType: 'SECURITY', channel: 'EMAIL', label: 'Security alerts', description: 'Email alerts for sign-ins and password changes.' },
];

export default function TeacherSettingsPage() {
  const [activeTab, setActiveTab] = useState('account');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  useEffect(() => {
    Promise.all([apiFetch('/users/me'), apiFetch('/users/me/notifications/preferences')])
      .then(([user, prefs]) => {
        setProfile({ firstName: user.firstName, lastName: user.lastName, email: user.email, phone: user.phone });
        setPreferences(prefs);
      })
      .catch((err) => setError(err.message || 'Unable to load your settings.'))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (!profile) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const updated = await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ firstName: profile.firstName.trim(), lastName: profile.lastName.trim(), phone: profile.phone?.trim() || null }),
      });
      setProfile((current) => current ? { ...current, ...updated } : current);
      setMessage('Personal information saved.');
    } catch (err: any) {
      setError(err.message || 'Your profile could not be saved.');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: React.FormEvent) {
    event.preventDefault();
    setMessage('');
    setError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('The new passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/users/me/password/change', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setMessage('Password changed successfully.');
    } catch (err: any) {
      setError(err.message || 'Your password could not be changed.');
    } finally {
      setSaving(false);
    }
  }

  async function togglePreference(option: typeof NOTIFICATION_OPTIONS[number]) {
    const current = preferences.find((item) => item.notificationType === option.notificationType && item.channel === option.channel);
    const nextValue = current ? !current.isEnabled : false;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await apiFetch('/users/me/notifications/preferences', {
        method: 'PATCH',
        body: JSON.stringify({ notificationType: option.notificationType, channel: option.channel, isEnabled: nextValue }),
      });
      setPreferences((items) => {
        const exists = items.some((item) => item.notificationType === option.notificationType && item.channel === option.channel);
        return exists
          ? items.map((item) => item.notificationType === option.notificationType && item.channel === option.channel ? { ...item, isEnabled: nextValue } : item)
          : [...items, { ...option, isEnabled: nextValue }];
      });
      setMessage('Notification preference updated.');
    } catch (err: any) {
      setError(err.message || 'The preference could not be updated.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={40} /></div>;
  if (!profile) return null;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Workspace Settings</h1>
        <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Customize your account details and security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        <div className="space-y-2">
          <TabButton id="account" label="Personal Account" icon={<User size={18} />} active={activeTab === 'account'} onClick={setActiveTab} />
          <TabButton id="security" label="Login & Security" icon={<Lock size={18} />} active={activeTab === 'security'} onClick={setActiveTab} />
          <TabButton id="notifications" label="Alert Preferences" icon={<Bell size={18} />} active={activeTab === 'notifications'} onClick={setActiveTab} />
        </div>

        <div className="lg:col-span-3">
          <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm min-h-[420px]">
            {error && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-semibold">{error}</p>
              </div>
            )}
            {message && (
              <div className="mb-6 flex items-start gap-3 rounded-xl border border-success-200 bg-success-50 p-4 text-success-700">
                <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
                <p className="text-xs font-semibold">{message}</p>
              </div>
            )}

            {activeTab === 'account' && (
              <form onSubmit={saveProfile} className="space-y-8">
                <h3 className="text-xl font-semibold text-charcoal-900">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputGroup label="First Name" value={profile.firstName} onChange={(value) => setProfile({ ...profile, firstName: value })} />
                  <InputGroup label="Last Name" value={profile.lastName} onChange={(value) => setProfile({ ...profile, lastName: value })} />
                  <InputGroup label="Email Address" value={profile.email} disabled />
                  <InputGroup label="Phone Number" value={profile.phone || ''} onChange={(value) => setProfile({ ...profile, phone: value })} />
                </div>
                <div className="pt-6 border-t border-warm-100 flex justify-end">
                  <button disabled={saving} className="bg-charcoal-900 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-charcoal-950 transition-all flex items-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <form onSubmit={changePassword} className="space-y-8">
                <h3 className="text-xl font-semibold text-charcoal-900">Change Password</h3>
                <p className="text-sm font-medium text-warm-500">Use at least 12 characters with uppercase, lowercase, numbers and symbols.</p>
                <div className="space-y-5">
                  <InputGroup label="Current Password" type="password" value={passwordForm.currentPassword} onChange={(value) => setPasswordForm({ ...passwordForm, currentPassword: value })} />
                  <InputGroup label="New Password" type="password" value={passwordForm.newPassword} onChange={(value) => setPasswordForm({ ...passwordForm, newPassword: value })} />
                  <InputGroup label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={(value) => setPasswordForm({ ...passwordForm, confirmPassword: value })} />
                </div>
                <div className="pt-6 border-t border-warm-100 flex justify-end">
                  <button disabled={saving} className="bg-charcoal-900 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-charcoal-950 transition-all flex items-center gap-2 disabled:opacity-60">
                    {saving ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />} Update Password
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-8">
                <h3 className="text-xl font-semibold text-charcoal-900">Communication Channels</h3>
                <div className="space-y-4">
                  {NOTIFICATION_OPTIONS.map((option) => {
                    const preference = preferences.find((item) => item.notificationType === option.notificationType && item.channel === option.channel);
                    const enabled = preference ? preference.isEnabled : true;
                    return (
                      <div key={`${option.notificationType}-${option.channel}`} className="flex items-center justify-between gap-4 p-5 bg-ivory-50 rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-charcoal-900">{option.label}</p>
                          <p className="text-[11px] font-medium text-warm-400 mt-1">{option.description}</p>
                        </div>
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => togglePreference(option)}
                          aria-label={`Toggle ${option.label}`}
                          className={`w-12 h-6 rounded-full relative transition-colors shrink-0 disabled:opacity-60 ${enabled ? 'bg-forest-700' : 'bg-warm-300'}`}
                        >
                          <span className={`absolute top-1 w-4 h-4 bg-card rounded-full transition-all ${enabled ? 'left-7' : 'left-1'}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TabButton({ label, icon, active, onClick, id }: { label: string; icon: React.ReactNode; active: boolean; onClick: (id: string) => void; id: string }) {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      className={`w-full flex items-center gap-3 p-4 rounded-xl transition-all ${active ? 'bg-forest-700 text-white font-semibold' : 'bg-card border border-warm-200 text-warm-500 hover:bg-ivory-50 font-bold'}`}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

function InputGroup({ label, value, onChange, type = 'text', disabled }: { label: string; value: string; onChange?: (value: string) => void; type?: string; disabled?: boolean }) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-2 px-1">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className="w-full bg-ivory-50 border border-warm-100 rounded-xl px-5 py-3.5 text-sm font-medium text-charcoal-900 focus:ring-2 focus:ring-forest-700 transition-all outline-none disabled:opacity-60"
      />
    </div>
  );
}
