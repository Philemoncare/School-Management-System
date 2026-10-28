'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  Clock,
  Edit3,
  Loader2,
  Mail,
  Plus,
  Settings,
  Wrench,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

const emptyForm = {
  title: '',
  description: '',
  affectedServices: 'API, Web App',
  startAt: '',
  endAt: '',
  priority: 'NORMAL',
  status: 'SCHEDULED',
  allSchools: true,
  schoolIds: [] as string[],
};

function toLocalInput(value: string) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function SuperAdminMaintenance() {
  const [windows, setWindows] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    Promise.all([
      loadMaintenance(),
      apiFetch('/super-admin/schools?take=100').then((data) => setSchools(data.items || [])).catch(() => setSchools([])),
    ]);
  }, []);

  async function loadMaintenance() {
    setLoading(true);
    setError('');
    try {
      setWindows(await apiFetch('/super-admin/maintenance'));
    } catch (err: any) {
      setError(err.message || 'Unable to load maintenance windows');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    const end = new Date(Date.now() + 2 * 60 * 60 * 1000);
    setEditing(null);
    setForm({ ...emptyForm, startAt: toLocalInput(start.toISOString()), endAt: toLocalInput(end.toISOString()) });
    setError('');
    setModalOpen(true);
  }

  function openEdit(window: any) {
    setEditing(window);
    setForm({
      title: window.title,
      description: window.description || '',
      affectedServices: window.affectedServices.join(', '),
      startAt: toLocalInput(window.startAt),
      endAt: toLocalInput(window.endAt),
      priority: window.priority,
      status: window.status,
      allSchools: window.allSchools,
      schoolIds: window.schools.map((school: any) => school.id),
    });
    setError('');
    setModalOpen(true);
  }

  async function saveWindow() {
    if (!form.title.trim()) return setError('A maintenance title is required.');
    if (!form.startAt || !form.endAt) return setError('Start and end times are required.');
    const services = form.affectedServices.split(',').map((service) => service.trim()).filter(Boolean);
    if (!services.length) return setError('At least one affected service is required.');
    if (!form.allSchools && form.schoolIds.length === 0) return setError('Select at least one school or target all schools.');

    setSaving(true);
    setError('');
    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        affectedServices: services,
        startAt: new Date(form.startAt).toISOString(),
        endAt: new Date(form.endAt).toISOString(),
        priority: form.priority,
        status: form.status,
        allSchools: form.allSchools,
        schoolIds: form.allSchools ? [] : form.schoolIds,
      };
      if (editing) {
        await apiFetch(`/super-admin/maintenance/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/super-admin/maintenance', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      await loadMaintenance();
    } catch (err: any) {
      setError(err.message || 'Unable to save maintenance window');
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(window: any, status: string) {
    const label = status.toLowerCase().replace('_', ' ');
    if (!window.confirm(`Mark "${window.title}" as ${label}?`)) return;
    const reason = status === 'CANCELLED'
      ? window.prompt('Reason for cancelling this maintenance window:') || undefined
      : undefined;
    setBusy(window.id);
    setError('');
    try {
      const endpoint =
        status === 'ACTIVE'
          ? 'start'
          : status === 'COMPLETED'
            ? 'end'
            : status === 'CANCELLED'
              ? 'cancel'
              : null;
      if (endpoint) {
        await apiFetch(`/super-admin/maintenance/${window.id}/${endpoint}`, {
          method: 'POST',
          body: endpoint === 'cancel' ? JSON.stringify({ reason }) : undefined,
        });
      } else {
        await apiFetch(`/super-admin/maintenance/${window.id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
      }
      await loadMaintenance();
    } catch (err: any) {
      setError(err.message || 'Unable to update status');
    } finally {
      setBusy('');
    }
  }

  async function broadcast(window: any) {
    if (!window.confirm(`Send a real email broadcast for "${window.title}" to the targeted school administrators?`)) return;
    setBusy(`broadcast-${window.id}`);
    setResult(null);
    setError('');
    try {
      const delivery = await apiFetch(`/super-admin/maintenance/${window.id}/broadcast`, { method: 'POST' });
      setResult({ ...delivery, title: window.title });
      await loadMaintenance();
    } catch (err: any) {
      setError(err.message || 'Unable to broadcast maintenance');
    } finally {
      setBusy('');
    }
  }

  function toggleSchool(id: string) {
    setForm((current: any) => ({
      ...current,
      schoolIds: current.schoolIds.includes(id)
        ? current.schoolIds.filter((schoolId: string) => schoolId !== id)
        : [...current.schoolIds, id],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <Wrench className="text-forest-700" /> Platform Maintenance
          </h1>
          <p className="text-warm-500 font-medium mt-1">Schedule service windows and broadcast real downtime alerts.</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={18} />}>Schedule Window</Button>
      </div>

      {error && !modalOpen && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      {result && (
        <div className="rounded-2xl border border-success-200 bg-success-50 p-4 flex items-start gap-3">
          <Mail className="text-success-600 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-success-800">Broadcast complete for {result.title}</p>
            <p className="text-xs font-semibold text-success-700 mt-1">{result.message} Sent: {result.sent} · Failed: {result.failed} · Schools: {result.schools}</p>
          </div>
          <button onClick={() => setResult(null)} className="text-success-600"><XCircle size={18} /></button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center"><Loader2 size={36} className="animate-spin mx-auto text-forest-700" /></div>
      ) : windows.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-warm-200 bg-card p-16 text-center">
          <Calendar className="mx-auto text-warm-200 mb-4" size={64} />
          <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No maintenance scheduled</p>
          <p className="text-warm-400 text-sm mt-1">Create a window to notify school administrators.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {windows.map((window) => (
            <div key={window.id} className="bg-card border border-warm-200 rounded-2xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row justify-between lg:items-center gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <StatusBadge status={window.status} />
                  <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded ${window.priority === 'CRITICAL' ? 'bg-danger-100 text-danger-600' : window.priority === 'HIGH' ? 'bg-warning-100 text-warning-700' : 'bg-sage-100 text-forest-700'}`}>
                    {window.priority} priority
                  </span>
                  <span className="text-[10px] font-bold uppercase text-warm-400">
                    {window.allSchools ? 'All active schools' : `${window.schools.length} school(s)`}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-charcoal-900 mb-1">{window.title}</h3>
                <p className="text-warm-500 font-medium text-sm leading-relaxed max-w-3xl">{window.description || 'No description provided.'}</p>
                <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
                  <InfoItem label="Start" value={new Date(window.startAt).toLocaleString()} icon={<Clock size={14} />} />
                  <InfoItem label="End" value={new Date(window.endAt).toLocaleString()} icon={<Clock size={14} />} />
                  <InfoItem label="Services" value={window.affectedServices.join(', ')} icon={<Settings size={14} />} />
                </div>
                {!window.allSchools && window.schools.length > 0 && (
                  <p className="mt-3 text-[11px] font-semibold text-warm-400">Targets: {window.schools.map((school: any) => school.name).join(', ')}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t lg:border-t-0 pt-5 lg:pt-0">
                <Button variant="outline" size="sm" onClick={() => openEdit(window)} leftIcon={<Edit3 size={14} />}>Edit</Button>
                <Button size="sm" onClick={() => broadcast(window)} isLoading={busy === `broadcast-${window.id}`} leftIcon={<Mail size={14} />}>Broadcast</Button>
                {window.status === 'SCHEDULED' && (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(window, 'ACTIVE')} isLoading={busy === window.id}>Start</Button>
                    <Button variant="ghost" size="sm" onClick={() => updateStatus(window, 'CANCELLED')}>Cancel</Button>
                  </>
                )}
                {window.status === 'ACTIVE' && <Button variant="ghost" size="sm" onClick={() => updateStatus(window, 'COMPLETED')}>Complete</Button>}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Maintenance Window' : 'Schedule Maintenance Window'}
        size="lg"
        footerActions={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={saveWindow} isLoading={saving}>Save window</Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">{error}</div>}
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Scheduled database upgrade" />
          <div>
            <label className="ml-0.5 text-[11px] font-semibold text-warm-600 sm:text-xs">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="mt-1.5 w-full rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/15"
              placeholder="Explain the impact and expected disruption."
            />
          </div>
          <Input label="Affected services (comma separated)" value={form.affectedServices} onChange={(e) => setForm({ ...form, affectedServices: e.target.value })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Start" type="datetime-local" value={form.startAt} onChange={(e) => setForm({ ...form, startAt: e.target.value })} />
            <Input label="End" type="datetime-local" value={form.endAt} onChange={(e) => setForm({ ...form, endAt: e.target.value })} />
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
            {editing && (
              <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="SCHEDULED">Scheduled</option>
                <option value="ACTIVE">Active</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </Select>
            )}
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-warm-200 p-3">
            <input type="checkbox" checked={form.allSchools} onChange={(e) => setForm({ ...form, allSchools: e.target.checked })} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
            <span className="text-sm font-semibold text-charcoal-900">Target all active schools</span>
          </label>

          {!form.allSchools && (
            <div>
              <p className="mb-2 text-xs font-semibold text-warm-600">Select schools ({form.schoolIds.length} selected)</p>
              <div className="max-h-52 overflow-y-auto rounded-xl border border-warm-200 p-2 grid grid-cols-1 sm:grid-cols-2 gap-1">
                {schools.map((school) => (
                  <label key={school.id} className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-ivory-50 cursor-pointer">
                    <input type="checkbox" checked={form.schoolIds.includes(school.id)} onChange={() => toggleSchool(school.id)} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
                    <span className="text-xs font-semibold text-warm-700 truncate">{school.name}</span>
                  </label>
                ))}
                {schools.length === 0 && <p className="p-2 text-xs text-warm-400">No schools available.</p>}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const configs: any = {
    SCHEDULED: { color: 'bg-sage-100 text-forest-800', icon: Calendar },
    ACTIVE: { color: 'bg-terracotta-100 text-terracotta-700', icon: AlertTriangle },
    COMPLETED: { color: 'bg-success-100 text-success-700', icon: CheckCircle },
    CANCELLED: { color: 'bg-warm-100 text-warm-700', icon: XCircle },
  };
  const config = configs[status] || configs.SCHEDULED;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tighter ${config.color}`}>
      <Icon size={12} /> {status}
    </span>
  );
}

function InfoItem({ label, value, icon }: any) {
  return (
    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
      <div className="opacity-50">{icon}</div>
      <span>{label}: <span className="text-charcoal-900">{value}</span></span>
    </div>
  );
}
