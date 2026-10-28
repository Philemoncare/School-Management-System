'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Eye,
  Loader2,
  LogOut,
  Plus,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import {
  collectUserRoles,
  getActiveSupportGrantId,
  isPlatformSuperAdmin,
} from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';

const statusStyles: Record<string, string> = {
  REQUESTED: 'bg-warning-100 text-warning-700',
  APPROVED: 'bg-success-100 text-success-700',
  DENIED: 'bg-danger-100 text-danger-700',
  REVOKED: 'bg-warm-100 text-warm-600',
  EXPIRED: 'bg-warm-100 text-warm-600',
};

export default function SupportAccessPage() {
  const router = useRouter();
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canApprove = isPlatformSuperAdmin(roles);
  const activeGrant = getActiveSupportGrantId();

  const [grants, setGrants] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    schoolId: '',
    durationMinutes: '60',
    reason: '',
  });

  useEffect(() => {
    void loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [grantData, schoolData] = await Promise.all([
        apiFetch('/super-admin/support-access'),
        apiFetch('/super-admin/schools?take=100'),
      ]);
      setGrants(grantData.items || []);
      setSchools(schoolData.items || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load support access grants');
    } finally {
      setLoading(false);
    }
  }

  async function createRequest() {
    if (!form.schoolId) return setError('Select a school.');
    if (form.reason.trim().length < 10) {
      return setError('Provide a reason of at least 10 characters.');
    }

    setSaving(true);
    setError('');
    try {
      await apiFetch('/super-admin/support-access', {
        method: 'POST',
        body: JSON.stringify({
          schoolId: form.schoolId,
          reason: form.reason.trim(),
          durationMinutes: Number(form.durationMinutes),
        }),
      });
      setForm({ schoolId: '', durationMinutes: '60', reason: '' });
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Unable to request support access');
    } finally {
      setSaving(false);
    }
  }

  async function approve(grant: any) {
    if (!window.confirm(`Approve read-only support access to ${grant.school?.name} for ${grant.requestedBy?.email}?`)) return;
    setBusy(`approve-${grant.id}`);
    setError('');
    try {
      await apiFetch(`/super-admin/support-access/${grant.id}/approve`, { method: 'POST' });
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Unable to approve support access');
    } finally {
      setBusy('');
    }
  }

  async function revoke(grant: any) {
    if (!window.confirm('Revoke this support access grant immediately?')) return;
    setBusy(`revoke-${grant.id}`);
    setError('');
    try {
      await apiFetch(`/super-admin/support-access/${grant.id}/revoke`, { method: 'POST' });
      if (activeGrant === grant.id) exitSession();
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Unable to revoke support access');
    } finally {
      setBusy('');
    }
  }

  function launchSession(grant: any) {
    localStorage.setItem('supportGrantId', grant.id);
    localStorage.setItem('schoolId', grant.schoolId);
    router.push('/dashboard');
  }

  function exitSession() {
    localStorage.removeItem('supportGrantId');
    localStorage.removeItem('schoolId');
    router.push('/super-admin/support-access');
    window.location.reload();
  }

  const activeSessionGrant = grants.find((grant) => grant.id === activeGrant);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            <ShieldCheck className="text-forest-700" /> Support Access
          </h1>
          <p className="mt-1 font-medium text-warm-500">
            Time-limited, read-only tenant access. Every session is attributable to a platform user.
          </p>
        </div>
      </div>

      {activeSessionGrant && (
        <div className="flex flex-col gap-3 rounded-2xl border border-forest-200 bg-forest-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Eye className="mt-0.5 text-forest-700" size={20} />
            <div>
              <p className="text-sm font-semibold text-forest-900">
                Read-only support session active: {activeSessionGrant.school?.name}
              </p>
              <p className="text-xs font-semibold text-forest-700">
                Expires {new Date(activeSessionGrant.expiresAt).toLocaleString()}. All writes are blocked by the API.
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={exitSession} leftIcon={<LogOut size={16} />}>
            Exit session
          </Button>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        <div className="h-fit rounded-2xl border border-warm-200 bg-card p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-base font-semibold text-charcoal-900">
            <Plus size={18} className="text-forest-700" /> Request access
          </h2>
          <p className="mt-1 text-xs font-medium text-warm-500">
            A platform super admin must approve every request. You cannot approve your own request.
          </p>

          <div className="mt-5 space-y-4">
            <Select
              label="School"
              value={form.schoolId}
              onChange={(event) => setForm((current) => ({ ...current, schoolId: event.target.value }))}
            >
              <option value="">Select a school</option>
              {schools.map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name} ({school.code})
                </option>
              ))}
            </Select>

            <Select
              label="Duration"
              value={form.durationMinutes}
              onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="120">2 hours</option>
              <option value="240">4 hours</option>
            </Select>

            <div>
              <label className="ml-0.5 text-[11px] font-semibold text-warm-600 sm:text-xs">
                Reason
              </label>
              <textarea
                value={form.reason}
                onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))}
                rows={4}
                maxLength={500}
                placeholder="Reference the support ticket and the data you need to inspect."
                className="mt-1.5 w-full rounded-lg border border-warm-300 bg-card px-3.5 py-2.5 text-sm text-charcoal-900 outline-none transition-colors placeholder:text-warm-400 focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/15"
              />
              <p className="mt-1 text-right text-[11px] font-medium text-warm-400">{form.reason.length}/500</p>
            </div>

            <Button onClick={createRequest} isLoading={saving} className="w-full">
              Submit request
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
          <div className="flex items-center justify-between border-b border-warm-200 px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-charcoal-900">Access grants</h2>
              <p className="text-xs font-medium text-warm-500">Real requests, approvals, revocations, and session usage.</p>
            </div>
            <span className="text-xs font-bold text-warm-400">{grants.length} total</span>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <Loader2 className="mx-auto animate-spin text-forest-700" size={34} />
            </div>
          ) : grants.length === 0 ? (
            <div className="px-6 py-16 text-center">
              <ShieldCheck className="mx-auto mb-3 text-warm-200" size={56} />
              <p className="text-sm font-semibold text-warm-500">No support access has been requested.</p>
            </div>
          ) : (
            <div className="divide-y divide-warm-100">
              {grants.map((grant) => {
                const isRequester = grant.requestedById === user?.id;
                const canLaunch =
                  isRequester &&
                  grant.status === 'APPROVED' &&
                  grant.expiresAt &&
                  new Date(grant.expiresAt) > new Date();
                return (
                  <div key={grant.id} className="p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[grant.status] || statusStyles.EXPIRED}`}>
                            {grant.status}
                          </span>
                          <span className="rounded-full bg-sage-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-forest-700">
                            {(grant.scope || []).join(', ')}
                          </span>
                          <span className="text-[11px] font-semibold text-warm-400">
                            {grant.requestedMinutes} min requested
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-semibold text-charcoal-900">
                          {grant.school?.name} <span className="text-warm-400">({grant.school?.code})</span>
                        </p>
                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-warm-600">{grant.reason}</p>
                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[11px] font-semibold text-warm-500">
                          <span>Requested by {grant.requestedBy?.email || grant.requestedById}</span>
                          {grant.approvedBy && <span>Approved by {grant.approvedBy.email}</span>}
                          {grant.expiresAt && <span>Expires {new Date(grant.expiresAt).toLocaleString()}</span>}
                          <span>{grant.useCount} read request(s)</span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {canApprove && grant.status === 'REQUESTED' && grant.requestedById !== user?.id && (
                          <Button
                            size="sm"
                            onClick={() => approve(grant)}
                            isLoading={busy === `approve-${grant.id}`}
                            leftIcon={<CheckCircle2 size={15} />}
                          >
                            Approve
                          </Button>
                        )}
                        {canLaunch && (
                          <Button size="sm" variant="secondary" onClick={() => launchSession(grant)} leftIcon={<ArrowRight size={15} />}>
                            {activeGrant === grant.id ? 'Resume session' : 'Launch read-only'}
                          </Button>
                        )}
                        {(grant.status === 'REQUESTED' || grant.status === 'APPROVED') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => revoke(grant)}
                            isLoading={busy === `revoke-${grant.id}`}
                            leftIcon={<XCircle size={15} />}
                          >
                            Revoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-warm-200 bg-ivory-50 p-5">
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 text-forest-700" size={20} />
          <div>
            <p className="text-sm font-semibold text-charcoal-900">Read-only by design</p>
            <p className="mt-1 text-sm leading-relaxed text-warm-600">
              Support grants allow GET and HEAD requests only. Creating, updating, deleting, inviting, exporting, or changing settings is rejected by the API even during an active session.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
