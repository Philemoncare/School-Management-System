'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  Activity,
  AlertTriangle,
  Building2,
  Calendar,
  CheckCircle,
  ChevronLeft,
  CreditCard,
  Edit3,
  ExternalLink,
  KeyRound,
  Loader2,
  Mail,
  MapPin,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

export default function SchoolDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [school, setSchool] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [smsTopUpOpen, setSmsTopUpOpen] = useState(false);
  const [smsTopUp, setSmsTopUp] = useState({ packageId: '', reason: '' });
  const [smsPackages, setSmsPackages] = useState<any[]>([]);
  const [smsSaving, setSmsSaving] = useState(false);
  const [editForm, setEditForm] = useState<any>({});
  const [planForm, setPlanForm] = useState({ planId: '', status: 'ACTIVE' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDetail();
    apiFetch('/super-admin/plans').then((data) => setPlans(Array.isArray(data) ? data : [])).catch(console.error);
    // A credit grant has to reference a real package, so the catalogue is
    // needed here too. Failure must not break the rest of the page.
    apiFetch('/super-admin/sms-packages')
      .then((data) => setSmsPackages((Array.isArray(data) ? data : []).filter((p: any) => p.status === 'ACTIVE')))
      .catch(() => setSmsPackages([]));
  }, [id]);

  async function loadDetail() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/super-admin/schools/${id}`);
      setSchool(data);
      setEditForm({
        name: data.name || '',
        code: data.code || '',
        slug: data.slug || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        timezone: data.timezone || '',
        currency: data.currency || '',
        region: data.region || '',
        district: data.district || '',
        city: data.city || '',
        schoolType: data.schoolType || '',
      });
      if (data.subscription) {
        // Coerced because these feed `value={planForm.…}` directly. A missing
        // property would make the select uncontrolled until the user touches it,
        // which is the switch React refuses to do silently.
        setPlanForm({
          planId: data.subscription.planId ?? '',
          status: data.subscription.status ?? '',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load school');
    } finally {
      setLoading(false);
    }
  }

  async function changeStatus(status: string) {
    let reason = '';
    if (status === 'SUSPENDED' || status === 'REJECTED') {
      const input = window.prompt(`Reason for marking ${school.name} as ${status}:`);
      if (!input) return;
      reason = input;
    } else if (!window.confirm(`Change ${school.name} status to ${status}?`)) {
      return;
    }
    setBusy(`status-${status}`);
    setError('');
    try {
      const result = await apiFetch(`/super-admin/schools/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reason: reason || undefined }),
      });
      // Approval also opens the school's billing record. Say which way it went,
      // because "approved" with no subscription is a different problem to solve.
      const grant = result?.trialGrant;
      if (grant?.kind === 'granted') {
        setMessage(
          `School approved and placed on the ${grant.subscription?.plan?.code || 'trial'} plan until ` +
            `${grant.subscription?.trialEnd ? new Date(grant.subscription.trialEnd).toLocaleDateString() : 'an unspecified date'}.`,
        );
      } else if (grant?.kind === 'not_granted') {
        setMessage(`School status updated to ${status}, but no trial subscription was created (${grant.reason}).`);
      } else {
        setMessage(`School status updated to ${status}.`);
      }
      await loadDetail();
    } catch (err: any) {
      setError(err.message || 'Unable to update status');
    } finally {
      setBusy('');
    }
  }

  async function saveSchool() {
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/super-admin/schools/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(editForm),
      });
      setEditOpen(false);
      setMessage('School details updated.');
      await loadDetail();
    } catch (err: any) {
      setError(err.message || 'Unable to update school');
    } finally {
      setSaving(false);
    }
  }

  async function assignPlan() {
    if (!planForm.planId) return;
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/super-admin/schools/${id}/subscription`, {
        method: 'POST',
        body: JSON.stringify(planForm),
      });
      setPlanOpen(false);
      setMessage('Subscription updated.');
      await loadDetail();
    } catch (err: any) {
      setError(err.message || 'Unable to assign subscription');
    } finally {
      setSaving(false);
    }
  }

  async function topUpSmsCredits(e: React.FormEvent) {
    e.preventDefault();
    if (!smsTopUp.packageId) {
      setError('Choose an SMS package first - credits are defined by the package.');
      return;
    }
    setSmsSaving(true);
    setError('');
    try {
      const result = await apiFetch('/super-admin/sms-credits/topup', {
        method: 'POST',
        body: JSON.stringify({
          schoolId: id,
          packageId: smsTopUp.packageId,
          reason: smsTopUp.reason || 'Credit grant from school detail page',
        }),
      });
      setSmsTopUpOpen(false);
      setSmsTopUp({ packageId: '', reason: '' });
      setMessage(
        `Granted ${result?.creditsAdded ?? 0} credits. New SMS balance: ${result?.newBalance ?? 0}.`,
      );
      await loadDetail();
    } catch (err: any) {
      setError(err.message || 'Failed to grant SMS credits');
    } finally {
      setSmsSaving(false);
    }
  }

  async function sendReset(userId: string, email: string) {
    if (!window.confirm(`Send a secure password reset email to ${email}?`)) return;
    setBusy(`reset-${userId}`);
    setError('');
    try {
      const result = await apiFetch(`/super-admin/users/${userId}/send-password-reset`, { method: 'POST' });
      setMessage(result.message || `Reset instructions sent to ${email}.`);
    } catch (err: any) {
      setError(err.message || 'Unable to send reset email');
    } finally {
      setBusy('');
    }
  }

  async function voidInvoice(invoiceId: string) {
    if (!window.confirm('Void this platform invoice? This cannot be undone.')) return;
    setBusy(`invoice-${invoiceId}`);
    try {
      await apiFetch(`/super-admin/billing/invoices/${invoiceId}/void`, { method: 'POST' });
      setMessage('Invoice voided.');
      await loadDetail();
    } catch (err: any) {
      setError(err.message || 'Unable to void invoice');
    } finally {
      setBusy('');
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;
  if (!school) return <div className="p-20 text-center text-danger-500 font-bold uppercase">{error || 'School not found'}</div>;

  const admins = school.memberships?.filter((membership: any) => membership.status === 'ACTIVE') || [];
  const primaryPlan = school.subscription?.plan;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/super-admin/schools')} className="p-2.5 bg-card border border-warm-200 rounded-xl hover:bg-ivory-50 transition-colors shadow-sm">
            <ChevronLeft size={20} />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 tracking-tight">{school.name}</h1>
              <StatusBadge status={school.status} />
            </div>
            <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-xs">{school.code} · {school.slug}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)} leftIcon={<Edit3 size={16} />}>Edit details</Button>
          {['PENDING'].includes(school.status) && (
            <>
              <Button variant="success" onClick={() => changeStatus('ACTIVE')} isLoading={busy === 'status-ACTIVE'} leftIcon={<CheckCircle size={16} />}>Approve</Button>
              <Button variant="danger" onClick={() => changeStatus('REJECTED')} isLoading={busy === 'status-REJECTED'} leftIcon={<XCircle size={16} />}>Reject</Button>
            </>
          )}
          {['ACTIVE', 'TRIAL'].includes(school.status) && (
            <>
              <Button variant="danger" onClick={() => changeStatus('SUSPENDED')} isLoading={busy === 'status-SUSPENDED'} leftIcon={<AlertTriangle size={16} />}>Suspend</Button>
              <Button variant="outline" onClick={() => changeStatus('MAINTENANCE')} isLoading={busy === 'status-MAINTENANCE'}>Maintenance mode</Button>
            </>
          )}
          {['SUSPENDED', 'EXPIRED', 'REJECTED', 'DEACTIVATED', 'MAINTENANCE'].includes(school.status) && (
            <Button variant="success" onClick={() => changeStatus('ACTIVE')} isLoading={busy === 'status-ACTIVE'} leftIcon={<ShieldCheck size={16} />}>Reactivate</Button>
          )}
          <a href={`mailto:${admins[0]?.user?.email || school.email || ''}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-warm-300 bg-card px-4 text-sm font-semibold text-charcoal-800 hover:bg-warm-50">
            <Mail size={16} /> Email admin
          </a>
        </div>
      </div>

      {message && <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-semibold text-success-700">{message}</div>}
      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MiniStat label="Students" value={school._count.students} icon={<Users size={16} />} />
            <MiniStat label="Teachers" value={school._count.teachers} icon={<Users size={16} />} />
            <MiniStat label="Staff" value={school._count.staff} icon={<Users size={16} />} />
          </div>

          <div className="bg-card border border-warm-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-6">
              <h3 className="text-lg font-bold text-charcoal-900 flex items-center gap-2"><CreditCard className="text-forest-700" /> Subscription & Billing</h3>
              <Button size="sm" variant="outline" onClick={() => setPlanOpen(true)}>{school.subscription ? 'Change plan' : 'Grant access'}</Button>
            </div>
            {school.subscription ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide">Active plan</p>
                  <p className="text-2xl font-semibold text-charcoal-900">{primaryPlan?.name}</p>
                  <p className="text-sm font-bold text-forest-700 bg-sage-50 px-3 py-1 rounded-full w-fit">
                    {school.subscription.pricing?.interval} · {school.subscription.pricing?.amount} {school.subscription.pricing?.currency}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-warm-400 uppercase tracking-wide">Current period ends</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="text-warm-400" size={20} />
                    <p className="text-lg font-semibold text-charcoal-800">{new Date(school.subscription.currentPeriodEnd).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-bold text-warm-500">Status: {school.subscription.status}</span>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center bg-ivory-50 rounded-2xl border-2 border-dashed border-warm-100">
                <p className="text-warm-400 font-bold">No active subscription found</p>
                <p className="mt-1 text-xs text-muted-foreground">Assign a plan to unlock paid platform features.</p>
              </div>
            )}

            {/* SMS Credit Balance */}
            <div className="mt-6 pt-6 border-t border-warm-100">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-warm-400 uppercase tracking-wide">SMS Credit Balance</h4>
                <Button
                  size="sm"
                  onClick={() => {
                    setSmsTopUp({ packageId: '', reason: '' });
                    setSmsTopUpOpen(true);
                  }}
                  className={`text-xs ${
                    school.smsCreditBalance === 0
                      ? 'bg-terracotta-500 text-primary-foreground hover:bg-terracotta-600'
                      : 'bg-forest-500 text-primary-foreground hover:bg-forest-600'
                  }`}
                >
                  {school.smsCreditBalance === 0 ? 'Purchase Credits' : 'Top Up'}
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-charcoal-900">{school.smsCreditBalance.toLocaleString()}</span>
                <span className="text-sm font-semibold text-muted-foreground">
                  {school.currency} credits
                </span>
                {school.smsCreditBalance === 0 && (
                  <span className="text-xs font-bold text-terracotta-600 bg-terracotta-50 px-2 py-1 rounded">
                    No credits — SMS sending disabled
                  </span>
                )}
                {school.smsCreditBalance > 0 && school.smsCreditBalance < 10 && (
                  <span className="text-xs font-bold text-warning-600 bg-warning-50 px-2 py-1 rounded">
                    Low balance
                  </span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Each SMS sent deducts 1 credit. Manage all school SMS credits from{' '}
                <Link href="/super-admin/sms-credits" className="text-forest-700 hover:underline font-semibold">
                  SMS Credit Management
                </Link>.
              </p>
            </div>
          </div>

          <div className="bg-card border border-warm-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-bold text-charcoal-900 mb-6 flex items-center gap-2"><Activity className="text-forest-700" /> Recent Usage</h3>
            <div className="space-y-3">
              {school.usageLogs.map((log: any) => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-ivory-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-charcoal-800">{log.channel} Messaging</p>
                    <p className="text-[11px] font-bold text-warm-400 uppercase">{new Date(log.billingPeriodStart).toLocaleDateString()} - {new Date(log.billingPeriodEnd).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-forest-700">{log.successfulCount} Successful</p>
                    <p className="text-[11px] font-bold text-danger-400 uppercase">{log.failedCount} Failed</p>
                  </div>
                </div>
              ))}
              {school.usageLogs.length === 0 && <p className="text-center text-warm-400 py-4 italic text-sm">No usage recorded yet.</p>}
            </div>
          </div>

          <div className="bg-card border border-warm-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-bold text-charcoal-900 mb-6">Platform Invoices</h3>
            <div className="space-y-3">
              {school.platformInvoices.map((invoice: any) => (
                <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-ivory-50 rounded-xl">
                  <div>
                    <p className="text-sm font-semibold text-charcoal-800">{invoice.invoiceNumber}</p>
                    <p className="text-[11px] font-bold text-warm-400 uppercase">Due {new Date(invoice.dueDate).toLocaleDateString()} · {invoice.status}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-charcoal-900">{invoice.currency} {Number(invoice.total).toLocaleString()}</span>
                    {invoice.status !== 'PAID' && invoice.status !== 'VOID' && (
                      <Button size="xs" variant="outline" onClick={() => voidInvoice(invoice.id)} isLoading={busy === `invoice-${invoice.id}`}>Void</Button>
                    )}
                  </div>
                </div>
              ))}
              {school.platformInvoices.length === 0 && <p className="text-center text-warm-400 py-4 italic text-sm">No platform invoices yet.</p>}
            </div>
          </div>

          <div className="bg-card border border-warm-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-lg font-bold text-charcoal-900 mb-6">Administrative History</h3>
            <div className="space-y-3">
              {school.auditLogs.map((log: any) => (
                <div key={log.id} className="flex items-start justify-between gap-4 border-b border-warm-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-xs font-semibold text-charcoal-800">{log.action}</p>
                    <p className="text-[11px] text-warm-400">{log.module} · {log.userId || 'SYSTEM'}</p>
                  </div>
                  <span className="shrink-0 text-[11px] font-semibold text-warm-400">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              ))}
              {school.auditLogs.length === 0 && <p className="text-center text-warm-400 py-4 italic text-sm">No administrative history yet.</p>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border border-warm-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="font-bold text-charcoal-900 mb-5">School Administrators</h3>
            <div className="space-y-4">
              {admins.map((membership: any) => (
                <div key={membership.id} className="space-y-2 rounded-xl border border-warm-100 p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-sage-50 text-forest-700 rounded-xl flex items-center justify-center font-bold shrink-0">
                      {membership.user.firstName?.[0] || 'A'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-charcoal-900 leading-tight truncate">{membership.user.firstName} {membership.user.lastName}</p>
                      <p className="text-[11px] text-warm-400 font-medium truncate">{membership.user.email}</p>
                    </div>
                    <span className={`h-2 w-2 rounded-full ${membership.user.isActive ? 'bg-success-500' : 'bg-danger-500'}`} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {membership.user.userRoles?.filter((role: any) => role.schoolId === school.id).map((role: any) => (
                      <span key={role.id} className="rounded bg-sage-50 px-1.5 py-0.5 text-[10px] font-bold uppercase text-forest-700">{role.role.name}</span>
                    ))}
                  </div>
                  <Button size="xs" variant="outline" className="w-full" onClick={() => sendReset(membership.user.id, membership.user.email)} isLoading={busy === `reset-${membership.user.id}`} leftIcon={<KeyRound size={13} />}>
                    Send password reset
                  </Button>
                </div>
              ))}
              {admins.length === 0 && <p className="text-center text-warm-400 py-4 italic text-sm">No active memberships.</p>}
            </div>
          </div>

          <div className="bg-card border border-warm-200 rounded-2xl p-5 sm:p-6 shadow-sm">
            <h3 className="font-bold text-charcoal-900 mb-5">Contact & Profile</h3>
            <div className="space-y-3">
              <ContactItem label="Phone" value={school.phone || 'Not provided'} />
              <ContactItem label="Email" value={school.email || 'Not provided'} />
              <ContactItem label="Address" value={school.address || 'Not provided'} />
              <ContactItem label="Region" value={school.region || 'Not provided'} />
              <ContactItem label="District" value={school.district || 'Not provided'} />
              <ContactItem label="School type" value={school.schoolType || 'Not provided'} />
              <ContactItem label="Timezone" value={school.timezone} />
              <ContactItem label="Currency" value={school.currency} />
            </div>
          </div>

          <div className="bg-card border border-warm-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wide text-warm-400">Workspace created</p>
            <p className="mt-1 text-sm font-semibold text-charcoal-900">{new Date(school.createdAt).toLocaleString()}</p>
            <Link href="/super-admin/audit" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-forest-700 hover:underline">
              Open full audit trail <ExternalLink size={12} />
            </Link>
          </div>
        </div>
      </div>

      <Modal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit School Details"
        size="lg"
        footerActions={
          <>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={saveSchool} isLoading={saving}>Save changes</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="School name" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          <Input label="School code" value={editForm.code} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })} />
          <Input label="Slug" value={editForm.slug} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} />
          <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
          <Input label="Region" value={editForm.region} onChange={(e) => setEditForm({ ...editForm, region: e.target.value })} />
          <Input label="District" value={editForm.district} onChange={(e) => setEditForm({ ...editForm, district: e.target.value })} />
          <Input label="City" value={editForm.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} />
          <Input label="School type" value={editForm.schoolType} onChange={(e) => setEditForm({ ...editForm, schoolType: e.target.value })} />
          <Input label="Timezone" value={editForm.timezone} onChange={(e) => setEditForm({ ...editForm, timezone: e.target.value })} />
          <Input label="Currency" value={editForm.currency} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })} />
        </div>
      </Modal>

      <Modal
        isOpen={planOpen}
        onClose={() => setPlanOpen(false)}
        title="Assign Subscription"
        footerActions={
          <>
            <Button variant="outline" onClick={() => setPlanOpen(false)}>Cancel</Button>
            <Button onClick={assignPlan} isLoading={saving} disabled={!planForm.planId}>Assign plan</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select label="Plan" value={planForm.planId} onChange={(e) => setPlanForm({ ...planForm, planId: e.target.value })}>
            <option value="">Select a plan</option>
            {plans.filter((plan) => plan.status !== 'ARCHIVED').map((plan) => (
              <option key={plan.id} value={plan.id}>
                {plan.name} ({plan.pricing?.find((p: any) => p.isActive)?.amount || 0} {plan.pricing?.[0]?.currency || 'GHS'})
              </option>
            ))}
          </Select>
          <Select label="Subscription status" value={planForm.status} onChange={(e) => setPlanForm({ ...planForm, status: e.target.value })}>
            <option value="ACTIVE">Active</option>
            <option value="TRIALING">Trialing</option>
            <option value="PAST_DUE">Past due</option>
            <option value="SUSPENDED">Suspended</option>
          </Select>
          {plans.length === 0 && <p className="text-xs text-warning-600">No plans exist yet. Create one in Platform Plans first.</p>}
        </div>
      </Modal>

      <Modal
        isOpen={smsTopUpOpen}
        onClose={() => setSmsTopUpOpen(false)}
        title="Top Up SMS Credits"
        footerActions={
          <>
            <Button variant="outline" onClick={() => setSmsTopUpOpen(false)}>Cancel</Button>
            <Button onClick={topUpSmsCredits} isLoading={smsSaving}>Confirm Top Up</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="SMS package"
            value={smsTopUp.packageId}
            onChange={(e) => setSmsTopUp({ ...smsTopUp, packageId: e.target.value })}
          >
            <option value="">Select a package</option>
            {smsPackages.map((pkg) => (
              <option key={pkg.id} value={pkg.id}>
                {pkg.name} ({pkg.code}) — {pkg.credits} credits @ {pkg.currency} {Number(pkg.price).toFixed(2)}
              </option>
            ))}
          </Select>
          {smsPackages.length === 0 && (
            <p className="text-xs text-warning-600">
              No active SMS packages exist. Create one under Platform SMS Packages before credits
              can be granted.
            </p>
          )}
          <Input
            label="Reason"
            value={smsTopUp.reason}
            onChange={(e) => setSmsTopUp({ ...smsTopUp, reason: e.target.value })}
            placeholder="e.g. Q1 2026 parent notice allocation"
          />
        </div>
      </Modal>
    </div>
  );
}

function MiniStat({ label, value, icon }: any) {
  return (
    <div className="bg-card border border-warm-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{label}</p>
        <div className="text-forest-700 opacity-30">{icon}</div>
      </div>
      <p className="text-2xl font-semibold text-charcoal-900">{value}</p>
    </div>
  );
}

function ContactItem({ label, value }: any) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-0.5">{label}</p>
      <p className="text-sm font-bold text-warm-700 break-words">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const styles: any = {
    PENDING: 'bg-warning-100 text-warning-700',
    ACTIVE: 'bg-success-100 text-success-700',
    TRIAL: 'bg-sage-100 text-forest-800',
    SUSPENDED: 'bg-terracotta-100 text-terracotta-700',
    EXPIRED: 'bg-danger-100 text-danger-700',
    MAINTENANCE: 'bg-warning-100 text-warning-700',
    REJECTED: 'bg-danger-100 text-danger-700',
    DEACTIVATED: 'bg-warm-100 text-warm-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tighter ${styles[status] || 'bg-warm-100 text-warm-700'}`}>
      {status}
    </span>
  );
}
