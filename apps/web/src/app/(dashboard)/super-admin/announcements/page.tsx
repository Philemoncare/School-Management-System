'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Bell,
  Calendar,
  CheckCircle,
  Loader2,
  Mail,
  Megaphone,
  Plus,
  Send,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { SearchableChecklist } from '@/components/ui/checklist';
import { Modal } from '@/components/ui/modal';

const emptyForm = {
  title: '',
  content: '',
  priority: 'NORMAL',
  publishImmediately: false,
  expiresAt: '',
  allSchools: true,
  schoolIds: [] as string[],
  sendEmail: false,
};

export default function AnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<any>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState<any>(null);
  const [publishForm, setPublishForm] = useState({ allSchools: true, schoolIds: [] as string[], sendEmail: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [announcements, schoolData] = await Promise.all([
        apiFetch('/super-admin/announcements'),
        apiFetch('/super-admin/schools?take=100&sort=name'),
      ]);
      setItems(announcements);
      setSchools(schoolData.items || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load announcements');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm({ ...emptyForm });
    setError('');
    setCreateOpen(true);
  }

  async function createAnnouncement() {
    if (!form.title.trim() || !form.content.trim()) return setError('Title and content are required.');
    if (!form.allSchools && form.schoolIds.length === 0) return setError('Select at least one school or target all schools.');
    setSaving(true);
    setError('');
    try {
      const created = await apiFetch('/super-admin/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          priority: form.priority,
          publishImmediately: form.publishImmediately,
          expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
          allSchools: form.allSchools,
          schoolIds: form.allSchools ? [] : form.schoolIds,
          sendEmail: form.sendEmail,
        }),
      });
      setCreateOpen(false);
      if (created.delivery) setResult({ ...created.delivery, title: created.title, action: 'published' });
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Unable to create announcement');
    } finally {
      setSaving(false);
    }
  }

  function openPublish(item: any) {
    setPublishing(item);
    setPublishForm({ allSchools: true, schoolIds: [], sendEmail: false });
    setError('');
  }

  async function publish() {
    if (!publishForm.allSchools && publishForm.schoolIds.length === 0) return setError('Select at least one school or target all schools.');
    setBusy(true);
    setError('');
    try {
      const published = await apiFetch(`/super-admin/announcements/${publishing.id}/publish`, {
        method: 'POST',
        body: JSON.stringify({
          allSchools: publishForm.allSchools,
          schoolIds: publishForm.allSchools ? [] : publishForm.schoolIds,
          sendEmail: publishForm.sendEmail,
        }),
      });
      setPublishing(null);
      if (published.delivery) setResult({ ...published.delivery, title: published.title, action: published.delivery.alreadyDelivered ? 'already published' : 'published' });
      await loadAll();
    } catch (err: any) {
      setError(err.message || 'Unable to publish announcement');
    } finally {
      setBusy(false);
    }
  }

  function toggleFormSchool(id: string) {
    setForm((current: any) => ({
      ...current,
      schoolIds: current.schoolIds.includes(id) ? current.schoolIds.filter((schoolId: string) => schoolId !== id) : [...current.schoolIds, id],
    }));
  }

  function togglePublishSchool(id: string) {
    setPublishForm((current) => ({
      ...current,
      schoolIds: current.schoolIds.includes(id) ? current.schoolIds.filter((schoolId) => schoolId !== id) : [...current.schoolIds, id],
    }));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
            <Megaphone className="text-forest-700" /> Platform Announcements
          </h1>
          <p className="mt-1 font-medium text-warm-500">Create drafts and publish real in-app notifications to school administrators.</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={18} />}>New announcement</Button>
      </div>

      {error && !createOpen && !publishing && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      {result && (
        <div className="rounded-2xl border border-success-200 bg-success-50 p-4 flex items-start gap-3">
          <CheckCircle className="mt-0.5 text-success-600" size={20} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-success-800">“{result.title}” {result.action}</p>
            <p className="mt-1 text-xs font-semibold text-success-700">Recipients: {result.recipients ?? 0} · Emails sent: {result.sent ?? 0} · Email failures: {result.failed ?? 0} · Schools: {result.schools ?? 0}</p>
          </div>
          <button onClick={() => setResult(null)} className="text-success-600 text-xs font-bold uppercase">Dismiss</button>
        </div>
      )}

      {loading ? (
        <div className="py-20 text-center"><Loader2 className="mx-auto animate-spin text-forest-700" size={34} /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-warm-200 bg-card p-16 text-center">
          <Bell className="mx-auto mb-4 text-warm-200" size={56} />
          <p className="text-sm font-bold uppercase tracking-wide text-warm-400">No platform announcements</p>
          <p className="mt-1 text-sm text-warm-400">Create a draft or publish your first real announcement.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-warm-200 bg-card p-5 sm:p-6 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${item.priority === 'CRITICAL' || item.priority === 'HIGH' ? 'bg-danger-100 text-danger-700' : 'bg-warm-100 text-warm-600'}`}>{item.priority}</span>
                    <span className="text-[10px] font-bold uppercase text-warm-400">{item._count?.notifications || 0} notifications</span>
                  </div>
                  <h3 className="mt-2 text-lg font-semibold text-charcoal-900">{item.title}</h3>
                  <p className="mt-1 whitespace-pre-line text-sm font-medium text-warm-500 leading-relaxed">{item.content}</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-[11px] font-semibold text-warm-400">
                    <span>By {item.author ? `${item.author.firstName} ${item.author.lastName}` : 'System'}</span>
                    <span className="flex items-center gap-1"><Calendar size={11} /> Created {new Date(item.createdAt).toLocaleString()}</span>
                    {item.publishAt && <span>Publish {new Date(item.publishAt).toLocaleString()}</span>}
                    {item.expiresAt && <span>Expires {new Date(item.expiresAt).toLocaleString()}</span>}
                  </div>
                </div>
                {item.status === 'DRAFT' && (
                  <Button onClick={() => openPublish(item)} leftIcon={<Send size={15} />}>Publish</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Platform Announcement"
        size="lg"
        footerActions={<><Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button><Button onClick={createAnnouncement} isLoading={saving}>{form.publishImmediately ? 'Publish now' : 'Save draft'}</Button></>}
      >
        <div className="space-y-4">
          {error && <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">{error}</div>}
          <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <div>
            <label className="ml-0.5 text-[11px] font-semibold text-warm-600 sm:text-xs">Content</label>
            <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={5} className="mt-1.5 w-full rounded-lg border border-warm-300 bg-card p-3 text-sm outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/15" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="LOW">Low</option>
              <option value="NORMAL">Normal</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </Select>
            <Input label="Expires at (optional)" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center gap-2 rounded-xl border border-warm-200 p-3">
              <input type="checkbox" checked={form.publishImmediately} onChange={(e) => setForm({ ...form, publishImmediately: e.target.checked })} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
              <span className="text-xs font-semibold text-warm-700">Publish immediately</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-warm-200 p-3">
              <input type="checkbox" checked={form.sendEmail} onChange={(e) => setForm({ ...form, sendEmail: e.target.checked })} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
              <span className="flex items-center gap-1 text-xs font-semibold text-warm-700"><Mail size={13} /> Also send email</span>
            </label>
          </div>
          <label className="flex items-center gap-2 rounded-xl border border-warm-200 p-3">
            <input type="checkbox" checked={form.allSchools} onChange={(e) => setForm({ ...form, allSchools: e.target.checked })} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
            <span className="text-xs font-semibold text-warm-700">Target all active schools</span>
          </label>
          {!form.allSchools && (
            <SearchableChecklist
              items={schools.map((school) => ({
                id: school.id,
                label: school.name,
                description: school.code,
              }))}
              selectedIds={form.schoolIds}
              onToggle={toggleFormSchool}
              searchPlaceholder="Search schools…"
              emptyMessage="No schools match this search."
              label="Select schools"
            />
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!publishing}
        onClose={() => setPublishing(null)}
        title={`Publish “${publishing?.title || ''}”`}
        footerActions={<><Button variant="outline" onClick={() => setPublishing(null)}>Cancel</Button><Button onClick={publish} isLoading={busy} leftIcon={<Send size={15} />}>Publish</Button></>}
      >
        <div className="space-y-4">
          {error && <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">{error}</div>}
          <p className="text-sm text-warm-600">Publishing creates real in-app notifications for every targeted school administrator.</p>
          <label className="flex items-center gap-2 rounded-xl border border-warm-200 p-3">
            <input type="checkbox" checked={publishForm.allSchools} onChange={(e) => setPublishForm({ ...publishForm, allSchools: e.target.checked })} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
            <span className="text-xs font-semibold text-warm-700">All active schools</span>
          </label>
          {!publishForm.allSchools && (
            <SearchableChecklist
              items={schools.map((school) => ({
                id: school.id,
                label: school.name,
                description: school.code,
              }))}
              selectedIds={publishForm.schoolIds}
              onToggle={togglePublishSchool}
              searchPlaceholder="Search schools…"
              emptyMessage="No schools match this search."
              label="Select schools"
            />
          )}
          <label className="flex items-center gap-2 rounded-xl border border-warm-200 p-3">
            <input type="checkbox" checked={publishForm.sendEmail} onChange={(e) => setPublishForm({ ...publishForm, sendEmail: e.target.checked })} className="h-4 w-4 rounded border-warm-300 text-forest-700" />
            <span className="flex items-center gap-1 text-xs font-semibold text-warm-700"><Mail size={13} /> Also send email</span>
          </label>
        </div>
      </Modal>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const styles: any = {
    DRAFT: 'bg-warm-100 text-warm-600',
    SCHEDULED: 'bg-warning-100 text-warning-700',
    PUBLISHED: 'bg-success-100 text-success-700',
    CANCELLED: 'bg-danger-100 text-danger-700',
    ARCHIVED: 'bg-warm-100 text-warm-500',
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles[status] || 'bg-warm-100 text-warm-600'}`}>{status}</span>;
}
