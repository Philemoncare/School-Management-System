'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Activity,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  Lock,
  Save,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

type Tab = 'overview' | 'incidents' | 'events' | 'policies';

export default function SecurityPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [overview, setOverview] = useState<any>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [error, setError] = useState('');

  async function loadOverview() {
    setOverviewLoading(true);
    setError('');
    try {
      setOverview(await apiFetch('/super-admin/security/overview'));
    } catch (err: any) {
      setError(err.message || 'Unable to load security overview');
    } finally {
      setOverviewLoading(false);
    }
  }

  useEffect(() => {
    loadOverview();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
          <Shield className="text-forest-700" /> Security Operations
        </h1>
        <p className="mt-1 font-medium text-warm-500">Live platform security posture, incidents, events, and policy enforcement.</p>
      </div>

      {error && tab === 'overview' && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      <div className="flex flex-wrap gap-1 rounded-2xl border border-warm-200 bg-card p-1.5 shadow-sm">
        {(['overview', 'incidents', 'events', 'policies'] as Tab[]).map((item) => (
          <button
            key={item}
            onClick={() => setTab(item)}
            className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wide transition ${tab === item ? 'bg-forest-700 text-white' : 'text-warm-500 hover:bg-ivory-50'}`}
          >
            {item === 'policies' ? 'Platform Policies' : item}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview overview={overview} loading={overviewLoading} reload={loadOverview} />}
      {tab === 'incidents' && <Incidents />}
      {tab === 'events' && <Events />}
      {tab === 'policies' && <Policy />}
    </div>
  );
}

function Overview({ overview, loading, reload }: any) {
  if (loading && !overview) return <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-forest-700" size={36} /></div>;
  if (!overview) return null;

  const riskStyles: any = {
    HEALTHY: 'bg-success-50 border-success-200 text-success-800',
    GUARDED: 'bg-warning-50 border-warning-200 text-warning-800',
    ELEVATED: 'bg-terracotta-50 border-terracotta-200 text-terracotta-800',
    CRITICAL: 'bg-danger-50 border-danger-200 text-danger-800',
  };

  return (
    <div className="space-y-5">
      <div className={`rounded-2xl border p-5 ${riskStyles[overview.riskStatus] || riskStyles.HEALTHY}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {overview.riskStatus === 'HEALTHY' ? <ShieldCheck size={24} /> : <ShieldAlert size={24} />}
            <div>
              <p className="text-sm font-semibold">Platform risk status: {overview.riskStatus}</p>
              <p className="text-xs font-semibold opacity-80">Generated {new Date(overview.generatedAt).toLocaleString()}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={reload}>Refresh</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <SecurityMetric label="Active Sessions" value={overview.activeSessions} icon={<Users />} />
        <SecurityMetric label="Open Incidents" value={overview.openIncidents} icon={<AlertTriangle />} danger={overview.openIncidents > 0} />
        <SecurityMetric label="High-risk events (24h)" value={overview.highRiskEvents24h} icon={<Activity />} danger={overview.highRiskEvents24h > 0} />
        <SecurityMetric label="MFA Adoption" value={`${overview.mfaAdoption}%`} detail={`${overview.mfaUsers}/${overview.activeUsers} active users`} icon={<Lock />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-warm-200 bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-charcoal-900">Open incidents by severity</h3>
          <div className="space-y-2">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => (
              <div key={severity} className="flex items-center justify-between text-xs font-semibold">
                <span className="text-warm-600">{severity}</span>
                <span className="text-charcoal-900">{overview.incidentCounts?.[severity] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="xl:col-span-2 rounded-2xl border border-warm-200 bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-charcoal-900">Recent security events</h3>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {overview.recentEvents?.map((event: any) => (
              <div key={event.id} className="flex items-start justify-between gap-3 rounded-xl border border-warm-100 p-3">
                <div>
                  <p className="text-xs font-semibold text-charcoal-900">{event.eventType}</p>
                  <p className="mt-1 text-[11px] text-warm-500">{event.user?.email || event.ipAddress || 'Unknown actor'}</p>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-bold uppercase ${event.severity === 'CRITICAL' || event.severity === 'HIGH' ? 'text-danger-600' : 'text-warm-400'}`}>{event.severity}</span>
                  <p className="mt-1 text-[10px] text-warm-400">{new Date(event.createdAt).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {!overview.recentEvents?.length && <p className="py-8 text-center text-xs font-semibold text-warm-400">No security events recorded.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

function Incidents() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [updateForm, setUpdateForm] = useState({ status: 'INVESTIGATING', note: '' });
  const [saving, setSaving] = useState(false);
  const take = 20;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    load();
  }, [debouncedSearch, status, severity, page]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        skip: String((page - 1) * take),
        take: String(take),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status && { status }),
        ...(severity && { severity }),
      });
      setData(await apiFetch(`/super-admin/security/incidents?${query}`));
    } catch (err: any) {
      setError(err.message || 'Unable to load incidents');
    } finally {
      setLoading(false);
    }
  }

  function openUpdate(incident: any) {
    setSelected(incident);
    setUpdateForm({ status: incident.status, note: '' });
    setError('');
  }

  async function saveIncident() {
    setSaving(true);
    setError('');
    try {
      await apiFetch(`/super-admin/security/incidents/${selected.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: updateForm.status, note: updateForm.note || undefined }),
      });
      setSelected(null);
      await load();
    } catch (err: any) {
      setError(err.message || 'Unable to update incident');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex flex-1 items-center rounded-xl border border-warm-200 bg-card px-4 py-2.5 shadow-sm">
          <Search size={17} className="mr-3 text-warm-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search incident title or description..." className="w-full bg-transparent text-sm font-bold outline-none" />
        </div>
        <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">All statuses</option>
          {['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'].map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
        <Select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}>
          <option value="">All severities</option>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
        <div className="relative overflow-x-auto">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75"><Loader2 className="animate-spin text-forest-700" size={30} /></div>}
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>{['Incident', 'School', 'Severity', 'Status', 'Detected', ''].map((label) => <th key={label} className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {data.items.map((incident: any) => (
                <tr key={incident.id} className="hover:bg-ivory-50">
                  <td className="px-5 py-4 max-w-xs">
                    <p className="text-xs font-semibold text-charcoal-900">{incident.title}</p>
                    <p className="mt-1 line-clamp-2 text-[11px] text-warm-500">{incident.description}</p>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-warm-600">{incident.school?.name || 'Platform'}</td>
                  <td className="px-5 py-4"><span className={`text-[10px] font-bold uppercase ${incident.severity === 'CRITICAL' || incident.severity === 'HIGH' ? 'text-danger-600' : 'text-warm-500'}`}>{incident.severity}</span></td>
                  <td className="px-5 py-4"><span className="rounded-full bg-warm-100 px-2 py-0.5 text-[10px] font-bold text-warm-600">{incident.status}</span></td>
                  <td className="px-5 py-4 text-[11px] font-semibold text-warm-500">{new Date(incident.detectedAt).toLocaleString()}</td>
                  <td className="px-5 py-4 text-right"><Button variant="ghost" size="sm" onClick={() => openUpdate(incident)}><Eye size={16} /></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.items.length && !loading && <p className="p-12 text-center text-xs font-semibold text-warm-400">No incidents match these filters.</p>}
        </div>
        <Pager page={page} take={take} total={data.total} setPage={setPage} />
      </div>

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Update incident'}
        footerActions={<><Button variant="outline" onClick={() => setSelected(null)}>Cancel</Button><Button onClick={saveIncident} isLoading={saving}>Update incident</Button></>}
      >
        {selected && (
          <div className="space-y-4">
            <p className="text-sm text-warm-600">{selected.description}</p>
            <Select label="Status" value={updateForm.status} onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}>
              {['OPEN', 'INVESTIGATING', 'CONTAINED', 'RESOLVED', 'CLOSED'].map((value) => <option key={value} value={value}>{value}</option>)}
            </Select>
            <div>
              <label className="ml-0.5 text-[11px] font-semibold text-warm-600 sm:text-xs">Resolution note</label>
              <textarea value={updateForm.note} onChange={(e) => setUpdateForm({ ...updateForm, note: e.target.value })} rows={3} className="mt-1.5 w-full rounded-lg border border-warm-300 bg-card p-3 text-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/15" />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Events() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [severity, setSeverity] = useState('');
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);
  const take = 50;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    load();
  }, [debouncedSearch, severity, eventType, page]);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        skip: String((page - 1) * take),
        take: String(take),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(severity && { severity }),
        ...(eventType && { eventType }),
      });
      setData(await apiFetch(`/super-admin/security/events?${query}`));
    } catch (err: any) {
      setError(err.message || 'Unable to load security events');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex flex-1 items-center rounded-xl border border-warm-200 bg-card px-4 py-2.5 shadow-sm">
          <Search size={17} className="mr-3 text-warm-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search user, name, email or IP address..." className="w-full bg-transparent text-sm font-bold outline-none" />
        </div>
        <Input value={eventType} onChange={(e) => { setEventType(e.target.value.toUpperCase()); setPage(1); }} placeholder="Event type e.g. LOGIN_FAILED" />
        <Select value={severity} onChange={(e) => { setSeverity(e.target.value); setPage(1); }}>
          <option value="">All severities</option>
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((value) => <option key={value} value={value}>{value}</option>)}
        </Select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
        <div className="relative overflow-x-auto">
          {loading && <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75"><Loader2 className="animate-spin text-forest-700" size={30} /></div>}
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>{['Event', 'Actor', 'School', 'IP address', 'Severity', 'Occurred'].map((label) => <th key={label} className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">{label}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {data.items.map((event: any) => (
                <tr key={event.id} className="hover:bg-ivory-50">
                  <td className="px-5 py-3 text-xs font-semibold text-charcoal-900">{event.eventType}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-warm-600">{event.user?.email || '-'}</td>
                  <td className="px-5 py-3 text-xs font-semibold text-warm-600">{event.school?.name || 'Platform'}</td>
                  <td className="px-5 py-3 font-mono text-[11px] text-warm-500">{event.ipAddress || '-'}</td>
                  <td className="px-5 py-3"><span className={`text-[10px] font-bold uppercase ${event.severity === 'CRITICAL' || event.severity === 'HIGH' ? 'text-danger-600' : 'text-warm-500'}`}>{event.severity}</span></td>
                  <td className="px-5 py-3 text-[11px] font-semibold text-warm-500">{new Date(event.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.items.length && !loading && <p className="p-12 text-center text-xs font-semibold text-warm-400">No security events match these filters.</p>}
        </div>
        <Pager page={page} take={take} total={data.total} setPage={setPage} />
      </div>
    </div>
  );
}

function Policy() {
  const [policy, setPolicy] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiFetch('/super-admin/security/policy')
      .then(setPolicy)
      .catch((err) => setError(err.message || 'Unable to load security policy'))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      setPolicy(await apiFetch('/super-admin/security/policy', {
        method: 'PATCH',
        body: JSON.stringify({
          passwordMinLength: Number(policy.passwordMinLength),
          passwordRequireUpper: policy.passwordRequireUpper,
          passwordRequireNumber: policy.passwordRequireNumber,
          passwordRequireSymbol: policy.passwordRequireSymbol,
          mfaEnforcement: policy.mfaEnforcement,
          sessionTimeoutMinutes: Number(policy.sessionTimeoutMinutes),
          idleTimeoutMinutes: Number(policy.idleTimeoutMinutes),
          maxConcurrentSessions: Number(policy.maxConcurrentSessions),
          lockoutThreshold: Number(policy.lockoutThreshold),
          lockoutDurationMinutes: Number(policy.lockoutDurationMinutes),
        }),
      }));
      setSaved(true);
    } catch (err: any) {
      setError(err.message || 'Unable to update security policy');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !policy) return <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-forest-700" size={34} /></div>;

  return (
    <div className="max-w-4xl space-y-4">
      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}
      {saved && <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-semibold text-success-700">Platform security policy updated and audited.</div>}

      <div className="rounded-2xl border border-warm-200 bg-card p-6 shadow-sm space-y-5">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-charcoal-900"><Clock size={18} className="text-forest-700" /> Password policy</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Minimum password length" type="number" min={6} value={policy.passwordMinLength} onChange={(e) => setPolicy({ ...policy, passwordMinLength: e.target.value })} />
          <Select label="MFA enforcement" value={policy.mfaEnforcement} onChange={(e) => setPolicy({ ...policy, mfaEnforcement: e.target.value })}>
            <option value="OPTIONAL">Optional</option>
            <option value="REQUIRED_ADMINS">Required for administrators</option>
            <option value="REQUIRED_ALL">Required for all users</option>
          </Select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            ['passwordRequireUpper', 'Require uppercase letter'],
            ['passwordRequireNumber', 'Require number'],
            ['passwordRequireSymbol', 'Require symbol'],
          ].map(([key, label]) => (
            <label key={key} className="flex cursor-pointer items-center gap-2 rounded-xl border border-warm-200 p-3">
              <input type="checkbox" checked={!!policy[key]} onChange={(e) => setPolicy({ ...policy, [key]: e.target.checked })} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
              <span className="text-xs font-semibold text-warm-700">{label}</span>
            </label>
          ))}
        </div>

        <h3 className="flex items-center gap-2 border-t border-warm-100 pt-5 text-sm font-semibold text-charcoal-900"><Lock size={18} className="text-forest-700" /> Session & lockout</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input label="Session timeout (minutes)" type="number" min={5} value={policy.sessionTimeoutMinutes} onChange={(e) => setPolicy({ ...policy, sessionTimeoutMinutes: e.target.value })} />
          <Input label="Idle timeout (minutes)" type="number" min={1} value={policy.idleTimeoutMinutes} onChange={(e) => setPolicy({ ...policy, idleTimeoutMinutes: e.target.value })} />
          <Input label="Max concurrent sessions" type="number" min={1} value={policy.maxConcurrentSessions} onChange={(e) => setPolicy({ ...policy, maxConcurrentSessions: e.target.value })} />
          <Input label="Lockout threshold" type="number" min={3} value={policy.lockoutThreshold} onChange={(e) => setPolicy({ ...policy, lockoutThreshold: e.target.value })} />
          <Input label="Lockout duration (minutes)" type="number" min={1} value={policy.lockoutDurationMinutes} onChange={(e) => setPolicy({ ...policy, lockoutDurationMinutes: e.target.value })} />
        </div>

        <div className="flex justify-end border-t border-warm-100 pt-5">
          <Button onClick={save} isLoading={saving} leftIcon={<Save size={16} />}>Save policy</Button>
        </div>
      </div>
    </div>
  );
}

function SecurityMetric({ label, value, detail, icon, danger }: any) {
  return (
    <div className="rounded-2xl border border-warm-200 bg-card p-5 shadow-sm">
      <div className={`mb-3 inline-flex rounded-xl p-2.5 ${danger ? 'bg-danger-50 text-danger-600' : 'bg-sage-50 text-forest-700'}`}>{React.cloneElement(icon, { size: 20 })}</div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-warm-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${danger ? 'text-danger-700' : 'text-charcoal-900'}`}>{value}</p>
      {detail && <p className="mt-1 text-[11px] font-semibold text-warm-400">{detail}</p>}
    </div>
  );
}

function Pager({ page, take, total, setPage }: any) {
  return (
    <div className="flex items-center justify-between border-t border-warm-100 bg-ivory-50/50 p-4">
      <p className="text-[11px] font-bold uppercase text-warm-400">Page {page} · {total} total</p>
      <div className="flex gap-2">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-lg border border-warm-200 bg-card p-1.5 disabled:opacity-30"><ChevronLeft size={16} /></button>
        <button onClick={() => setPage(page + 1)} disabled={page * take >= total} className="rounded-lg border border-warm-200 bg-card p-1.5 disabled:opacity-30"><ChevronRight size={16} /></button>
      </div>
    </div>
  );
}
