'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Bell, Plus, Search, Megaphone, AlertCircle, RefreshCw, Send, Trash2, XCircle,
  CalendarClock, CheckCircle2, Users, Inbox, Clock,
} from 'lucide-react';
import { Select } from '@/components/ui/input';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Everyone' },
  { value: 'TEACHERS', label: 'Teachers' },
  { value: 'STUDENTS', label: 'Students' },
  { value: 'PARENTS', label: 'Parents' },
  { value: 'STAFF', label: 'Staff' },
];

const STATUS_STYLES: Record<string, string> = {
  PUBLISHED: 'border-success-100 bg-success-50 text-success-700',
  DRAFT: 'border-warm-200 bg-ivory-50 text-warm-600',
  SCHEDULED: 'border-warning-100 bg-warning-50 text-warning-700',
  CANCELLED: 'border-danger-100 bg-danger-50 text-danger-700',
  EXPIRED: 'border-warm-200 bg-warm-50 text-warm-500',
};

const DEFAULT_FORM = {
  title: '',
  content: '',
  priority: 'NORMAL',
  audienceTypes: ['ALL'] as string[],
  mode: 'PUBLISH' as 'DRAFT' | 'PUBLISH' | 'SCHEDULE',
  publishAt: '',
};

export default function AnnouncementsPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = collectUserRoles(user, activeSchoolId);
  const canManage = roles.includes('SCHOOL_ADMIN') || roles.includes('PRINCIPAL') || roles.includes('ADMIN');

  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [audienceFilter, setAudienceFilter] = useState('ALL');
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [pendingDelete, setPendingDelete] = useState<any>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch('/announcements');
      setAnnouncements(Array.isArray(data) ? data : []);
    } catch (err) {
      setAnnouncements([]);
      setError(err instanceof ApiError ? err.message : 'Could not load announcements.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!activeSchoolId) return;
    load();
  }, [activeSchoolId]);

  const stats = useMemo(() => {
    const counts = { total: announcements.length, published: 0, scheduled: 0, drafts: 0 };
    for (const item of announcements) {
      if (item.status === 'PUBLISHED') counts.published += 1;
      else if (item.status === 'SCHEDULED') counts.scheduled += 1;
      else if (item.status === 'DRAFT') counts.drafts += 1;
    }
    return counts;
  }, [announcements]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return announcements.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      if (audienceFilter !== 'ALL') {
        const types = (item.audiences || []).map((audience: any) => audience.audienceType);
        if (!types.includes(audienceFilter)) return false;
      }
      if (term) {
        const haystack = `${item.title || ''} ${item.content || ''}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [announcements, search, statusFilter, audienceFilter]);

  function resetForm() {
    setForm(DEFAULT_FORM);
  }

  async function createAnnouncement(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      if (!form.title.trim()) throw new Error('Enter an announcement title.');
      if (!form.content.trim()) throw new Error('Write the announcement content.');
      if (form.audienceTypes.length === 0) throw new Error('Select at least one audience.');
      if (form.mode === 'SCHEDULE') {
        if (!form.publishAt) throw new Error('Choose the date and time to publish.');
        if (new Date(form.publishAt) <= new Date()) throw new Error('The scheduled time must be in the future.');
      }

      await apiFetch('/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: form.title.trim(),
          content: form.content.trim(),
          priority: form.priority,
          status: form.mode === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
          publishAt: form.mode === 'SCHEDULE' ? new Date(form.publishAt).toISOString() : null,
          audienceTypes: form.audienceTypes,
        }),
      });

      setSuccess(
        form.mode === 'DRAFT'
          ? 'Draft saved. Publish it when you are ready.'
          : form.mode === 'SCHEDULE'
            ? 'Announcement scheduled. Notifications will be sent at the chosen time.'
            : 'Announcement published and in-app notifications sent.',
      );
      setCreateOpen(false);
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : 'Could not save the announcement.');
    } finally {
      setSaving(false);
    }
  }

  async function act(id: string, action: 'publish' | 'cancel') {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/announcements/${id}/${action}`, { method: 'PATCH' });
      setSuccess(action === 'publish' ? 'Announcement published and notifications sent.' : 'Announcement cancelled.');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Could not ${action} this announcement.`);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError(null);
    setSuccess(null);
    try {
      await apiFetch(`/announcements/${id}`, { method: 'DELETE' });
      setSuccess('Announcement deleted.');
      setPendingDelete(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete this announcement.');
    } finally {
      setBusyId(null);
    }
  }

  function toggleAudience(value: string) {
    setForm((current) => {
      const exists = current.audienceTypes.includes(value);
      const next = exists
        ? current.audienceTypes.filter((item) => item !== value)
        : [...current.audienceTypes, value];
      return { ...current, audienceTypes: next };
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">
            <Megaphone className="text-forest-700" size={24} /> Announcements
          </h1>
          <p className="mt-1 text-xs font-medium text-warm-500 sm:text-sm">
            {canManage
              ? 'Broadcast news to your school community and track delivery.'
              : 'Official announcements published by your school.'}
          </p>
        </div>
        {canManage && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => { resetForm(); setCreateOpen(true); }}
            leftIcon={<Plus size={16} />}
          >
            New Announcement
          </Button>
        )}
      </div>

      {(error || success) && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${
            error
              ? 'border-danger-200 bg-danger-50 text-danger-800'
              : 'border-success-200 bg-success-50 text-success-800'
          }`}
        >
          {error ? <AlertCircle size={18} className="mt-0.5 shrink-0" /> : <CheckCircle2 size={18} className="mt-0.5 shrink-0" />}
          <span className="flex-1">{error || success}</span>
          <button
            type="button"
            onClick={() => { setError(null); setSuccess(null); }}
            className="shrink-0 rounded p-1 hover:bg-black/5"
            aria-label="Dismiss message"
          >
            <XCircle size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total', value: stats.total, icon: Bell },
          { label: 'Published', value: stats.published, icon: CheckCircle2 },
          { label: 'Scheduled', value: stats.scheduled, icon: CalendarClock },
          { label: 'Drafts', value: stats.drafts, icon: Clock },
        ].map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-warm-200 bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">{stat.label}</p>
              <stat.icon size={16} className="text-warm-400" />
            </div>
            <p className="mt-1 text-xl font-semibold text-charcoal-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search announcements…"
            aria-label="Search announcements"
            className="h-9 w-full rounded-lg border border-warm-300 bg-card pl-9 pr-3 text-sm text-charcoal-800 placeholder:text-warm-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30"
          />
        </div>
        <Select
          aria-label="Filter by status"
          value={statusFilter}
          placeholder="All statuses"
          options={[{ value: "ALL", label: "All statuses" }, { value: "PUBLISHED", label: "Published" }, { value: "SCHEDULED", label: "Scheduled" }, { value: "DRAFT", label: "Drafts" }, { value: "CANCELLED", label: "Cancelled" }]}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="w-auto min-w-[140px]"
        />
        <Select
          aria-label="Filter by audience"
          value={audienceFilter}
          placeholder="All audiences"
          options={AUDIENCE_OPTIONS}
          onChange={(event) => setAudienceFilter(event.target.value)}
          className="w-auto min-w-[140px]"
        />
        <Button variant="outline" size="sm" onClick={load} isLoading={loading} leftIcon={<RefreshCw size={15} />}>
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
          <RefreshCw size={16} className="animate-spin" /> Loading announcements…
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={announcements.length === 0 ? 'No announcements yet' : 'No announcements match your filters'}
          description={
            announcements.length === 0
              ? canManage
                ? 'Create your first announcement to reach teachers, students, parents, or the whole school.'
                : 'Your school has not published any announcements yet.'
              : 'Try a different search term, status, or audience.'
          }
          icon={<Inbox className="h-8 w-8" />}
          actionButton={
            canManage && announcements.length === 0 ? (
              <Button size="sm" onClick={() => { resetForm(); setCreateOpen(true); }} leftIcon={<Plus size={15} />}>
                New Announcement
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((item) => (
            <article key={item.id} className="rounded-2xl border border-warm-200 bg-card p-5 shadow-xs sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLES[item.status] || STATUS_STYLES.DRAFT}`}>
                      {item.status}
                    </span>
                    <span className="rounded-md border border-warm-200 bg-ivory-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-warm-500">
                      {item.priority}
                    </span>
                  </div>
                  <h2 className="text-base font-bold text-charcoal-900 sm:text-lg">{item.title}</h2>
                  <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-warm-600">{item.content}</p>
                </div>
                {canManage && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    {(item.status === 'DRAFT' || item.status === 'SCHEDULED') && (
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => act(item.id, 'publish')}
                        isLoading={busyId === item.id}
                        leftIcon={<Send size={13} />}
                      >
                        Publish
                      </Button>
                    )}
                    {item.status !== 'CANCELLED' && item.status !== 'EXPIRED' && (
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => act(item.id, 'cancel')}
                        disabled={busyId === item.id}
                        leftIcon={<XCircle size={13} />}
                      >
                        Cancel
                      </Button>
                    )}
                    {item.status !== 'PUBLISHED' && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setPendingDelete(item)}
                        disabled={busyId === item.id}
                        leftIcon={<Trash2 size={13} />}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-warm-100 pt-3 text-[11px] font-medium text-warm-500">
                <span className="flex items-center gap-1.5">
                  <Users size={13} />
                  {(item.audiences || []).map((audience: any) => audience.audienceType).join(', ') || 'No audience'}
                </span>
                <span>By {item.author ? `${item.author.firstName} ${item.author.lastName}` : 'School office'}</span>
                <span>
                  {item.status === 'SCHEDULED' && item.publishAt
                    ? `Scheduled for ${new Date(item.publishAt).toLocaleString()}`
                    : item.publishAt
                      ? `Published ${new Date(item.publishAt).toLocaleDateString()}`
                      : `Created ${new Date(item.createdAt).toLocaleDateString()}`}
                </span>
                {canManage && item._count?.notifications > 0 && (
                  <span>{item._count.notifications} notifications</span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        isOpen={createOpen}
        onClose={() => { if (!saving) setCreateOpen(false); }}
        title="New Announcement"
        size="lg"
        footerActions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
            <Button variant="primary" size="sm" onClick={createAnnouncement} isLoading={saving} leftIcon={<Send size={15} />}>
              {form.mode === 'DRAFT' ? 'Save Draft' : form.mode === 'SCHEDULE' ? 'Schedule' : 'Publish'}
            </Button>
          </>
        }
      >
        <form onSubmit={createAnnouncement} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Mid-term break dates"
            maxLength={160}
            required
          />

          <div>
            <label htmlFor="announcement-content" className="mb-1.5 block text-[11px] font-semibold text-warm-600 sm:text-xs">
              Content
            </label>
            <textarea
              id="announcement-content"
              value={form.content}
              onChange={(event) => setForm({ ...form, content: event.target.value })}
              rows={5}
              required
              placeholder="Write the message your school community will receive…"
              className="w-full rounded-xl border border-warm-300 bg-card px-3 py-2 text-sm text-charcoal-800 placeholder:text-warm-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="announcement-priority" className="mb-1.5 block text-[11px] font-semibold text-warm-600 sm:text-xs">
                Priority
              </label>
              <Select
                id="announcement-priority"
                value={form.priority}
                placeholder="Select priority"
                options={[
                    { value: "LOW", label: "Low" },
                    { value: "NORMAL", label: "Normal" },
                    { value: "HIGH", label: "High" },
                    { value: "CRITICAL", label: "Critical" },
                ]}
              />
            </div>
            <div>
              <label htmlFor="announcement-mode" className="mb-1.5 block text-[11px] font-semibold text-warm-600 sm:text-xs">
                Delivery
              </label>
              <Select
                id="announcement-mode"
                value={form.mode}
                placeholder="Select delivery mode"
                options={[
                    { value: "PUBLISH", label: "Publish now" },
                    { value: "SCHEDULE", label: "Schedule for later" },
                    { value: "DRAFT", label: "Save as draft" },
                ]}
              />
            </div>
          </div>

          {form.mode === 'SCHEDULE' && (
            <Input
              label="Publish at"
              type="datetime-local"
              value={form.publishAt}
              onChange={(event) => setForm({ ...form, publishAt: event.target.value })}
              required
            />
          )}

          <fieldset>
            <legend className="mb-1.5 text-[11px] font-semibold text-warm-600 sm:text-xs">Audience</legend>
            <div className="flex flex-wrap gap-2">
              {AUDIENCE_OPTIONS.map((option) => {
                const selected = form.audienceTypes.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleAudience(option.value)}
                    aria-pressed={selected}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      selected
                        ? 'border-forest-700 bg-forest-700 text-white'
                        : 'border-warm-300 bg-card text-warm-600 hover:border-warm-400'
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        </form>
      </Modal>

      <Modal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        title="Delete announcement"
        size="sm"
        footerActions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setPendingDelete(null)}>Keep it</Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => pendingDelete && remove(pendingDelete.id)}
              isLoading={!!pendingDelete && busyId === pendingDelete.id}
              leftIcon={<Trash2 size={15} />}
            >
              Delete
            </Button>
          </>
        }
      >
        <p className="text-sm text-warm-600">
          Delete &ldquo;{pendingDelete?.title}&rdquo;? This cannot be undone. Published announcements must be cancelled instead.
        </p>
      </Modal>
    </div>
  );
}
