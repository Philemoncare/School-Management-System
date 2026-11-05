'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  ShieldCheck,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

type Completion = { percent: number; complete: boolean; missingFields: string[] };

function formatValue(value: unknown, fallback = 'Not on file') {
  if (value === undefined || value === null || String(value).trim() === '') return fallback;
  return String(value);
}

function formatDate(value: unknown) {
  if (!value) return 'Not on file';
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? 'Not on file' : date.toLocaleDateString();
}

const ACCOUNT_STATUS_LABEL: Record<string, string> = {
  NOT_CREATED: 'No login account',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
};

export default function StaffOwnProfile() {
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/staff/me')
      .then(setStaff)
      .catch((err) => setError(err?.message || 'Could not load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-20 text-center">
        <Loader2 className="mx-auto animate-spin text-forest-700" size={48} />
      </div>
    );
  }

  if (error || !staff) {
    return (
      <div className="mx-auto max-w-xl space-y-3 p-8 text-center">
        <AlertTriangle className="mx-auto text-warning-600" size={28} />
        <p className="text-sm font-semibold text-warm-600">
          {error || 'No staff record is linked to this account yet.'}
        </p>
      </div>
    );
  }

  const completion: Completion | undefined = staff.completion;
  const photoUrl = staff.photoUrl;

  return (
    <div className="mx-auto max-w-5xl space-y-10 p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl border-4 border-white bg-warm-100 text-warm-300 shadow-inner">
          {photoUrl ? (
            <img src={photoUrl} alt={`${staff.firstName} ${staff.lastName}`} className="h-full w-full object-cover" />
          ) : (
            <User size={80} />
          )}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-charcoal-900 sm:text-4xl">
            {staff.firstName} {staff.middleName ? `${staff.middleName} ` : ''}
            {staff.lastName}
          </h1>
          <p className="mt-1 flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wide text-warm-500 md:justify-start">
            <Briefcase size={14} className="text-forest-700" />
            {staff.position?.name || staff.designation || 'Staff Member'}
          </p>
          <p className="mt-1 text-xs font-semibold text-warm-400">
            Staff number: {formatValue(staff.employeeId, 'Not assigned')}
          </p>
        </div>
      </div>

      {completion && (
        <section className="rounded-xl border border-warm-200 bg-card p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wide text-charcoal-900">
              Profile completion
            </h3>
            <span className="text-sm font-bold text-forest-700">{completion.percent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-forest-700" style={{ width: `${completion.percent}%` }} />
          </div>
          {!completion.complete && completion.missingFields.length > 0 && (
            <p className="mt-3 text-xs font-medium text-warm-500">
              Still needed: {completion.missingFields.join(', ')}. Ask an administrator to complete
              these from the staff directory.
            </p>
          )}
        </section>
      )}

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <section className="space-y-6 rounded-xl border border-warm-200 bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
            <User size={16} className="text-forest-700" /> Personal &amp; contact
          </h3>
          <div className="space-y-5">
            <InfoField icon={<ShieldCheck size={14} />} label="Staff number" value={formatValue(staff.employeeId, 'Not assigned')} />
            <InfoField icon={<Mail size={14} />} label="Email address" value={formatValue(staff.email)} />
            <InfoField icon={<Phone size={14} />} label="Primary phone" value={formatValue(staff.phone)} />
            <InfoField icon={<Phone size={14} />} label="Alternative phone" value={formatValue(staff.altPhone)} />
            <InfoField icon={<Building size={14} />} label="Address" value={formatValue(staff.address)} />
            <InfoField icon={<User size={14} />} label="Gender" value={formatValue(staff.gender)} />
            <InfoField icon={<Calendar size={14} />} label="Date of birth" value={formatDate(staff.dateOfBirth)} />
          </div>
        </section>

        <section className="space-y-6 rounded-xl border border-warm-200 bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
            <Building size={16} className="text-terracotta-600" /> Employment &amp; account
          </h3>
          <div className="space-y-5">
            <InfoField icon={<Building size={14} />} label="Department" value={formatValue(staff.department?.name, 'Unassigned')} />
            <InfoField icon={<Briefcase size={14} />} label="Position" value={formatValue(staff.position?.name, 'Unassigned')} />
            <InfoField icon={<Briefcase size={14} />} label="Designation" value={formatValue(staff.designation)} />
            <InfoField icon={<Briefcase size={14} />} label="Employment type" value={formatValue(staff.employmentType)} />
            <InfoField icon={<Calendar size={14} />} label="Commencement date" value={formatDate(staff.commencementDate)} />
            <InfoField icon={<Calendar size={14} />} label="Contract end date" value={formatDate(staff.contractEndDate)} />
            <InfoField icon={<ShieldCheck size={14} />} label="Employment status" value={formatValue(staff.status, '—')} />
            <InfoField
              icon={<ShieldCheck size={14} />}
              label="Login account status"
              value={ACCOUNT_STATUS_LABEL[staff.accountStatus] ?? 'Unknown'}
            />
          </div>
        </section>
      </div>

      {staff.emergencyContactName || staff.emergencyContactPhone ? (
        <section className="space-y-5 rounded-xl border border-warm-200 bg-card p-6 shadow-sm">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-charcoal-900">
            <AlertTriangle size={16} className="text-terracotta-600" /> Emergency contact
          </h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <InfoField icon={<User size={14} />} label="Name" value={formatValue(staff.emergencyContactName, '—')} />
            <InfoField icon={<Phone size={14} />} label="Phone" value={formatValue(staff.emergencyContactPhone, '—')} />
            <InfoField icon={<ShieldCheck size={14} />} label="Relationship" value={formatValue(staff.emergencyContactRelationship, '—')} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="space-y-1 border-b border-ivory-50 pb-4 last:border-0 last:pb-0">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
        {icon}
        {label}
      </p>
      <p className="text-sm font-bold text-warm-700">{value}</p>
    </div>
  );
}
