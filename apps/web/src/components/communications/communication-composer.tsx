'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Send,
  Users,
  MessageSquare,
  Mail,
  Smartphone,
  Save,
  Eye,
  X,
  Plus,
  Target,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { showFeedback } from '@/components/layout/global-feedback';

const AUDIENCE_LABELS: Record<string, string> = {
  ALL: 'All community',
  STUDENTS: 'Students',
  PARENTS: 'Guardians',
  TEACHERS: 'Teachers',
  STAFF: 'Staff',
  CLASS: 'Class / grade',
};

export function CommunicationComposer({
  onCancel,
  onSuccess,
}: {
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [step, setStep] = useState(1);
  const [savingDraft, setSavingDraft] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    content: '',
    priority: 'NORMAL',
    channels: ['IN_APP'] as string[],
    audienceConfig: { type: 'ALL' } as { type: string; classId?: string; sectionId?: string },
  });

  const channels = [
    { id: 'IN_APP', label: 'In-App', icon: MessageSquare },
    { id: 'EMAIL', label: 'Email', icon: Mail },
    { id: 'SMS', label: 'SMS', icon: Smartphone },
    { id: 'WEBSOCKET', label: 'Realtime (Push)', icon: Send },
  ];

  useEffect(() => {
    apiFetch('/classes')
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    if (formData.audienceConfig.type !== 'CLASS' || !formData.audienceConfig.classId) {
      setSections([]);
      return;
    }
    apiFetch(`/sections/by-class/${formData.audienceConfig.classId}`)
      .then((data) => setSections(Array.isArray(data) ? data : []))
      .catch(() => setSections([]));
  }, [formData.audienceConfig.type, formData.audienceConfig.classId]);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(async () => {
      setAudienceLoading(true);
      try {
        const params = new URLSearchParams({ type: formData.audienceConfig.type });
        if (formData.audienceConfig.classId) params.set('classId', formData.audienceConfig.classId);
        if (formData.audienceConfig.sectionId) params.set('sectionId', formData.audienceConfig.sectionId);
        const result = await apiFetch(`/communications/audience-preview?${params.toString()}`);
        if (!cancelled) setAudienceCount(typeof result?.count === 'number' ? result.count : null);
      } catch {
        if (!cancelled) setAudienceCount(null);
      } finally {
        if (!cancelled) setAudienceLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [formData.audienceConfig.type, formData.audienceConfig.classId, formData.audienceConfig.sectionId]);

  const audienceReady = useMemo(() => {
    if (formData.audienceConfig.type !== 'CLASS') return true;
    return Boolean(formData.audienceConfig.classId);
  }, [formData.audienceConfig]);

  function handleChannelToggle(channelId: string) {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter((c) => c !== channelId)
        : [...prev.channels, channelId],
    }));
  }

  function validate(): string {
    if (!formData.title.trim()) return 'Enter an internal reference title.';
    if (!formData.content.trim()) return 'Enter the message content.';
    if (formData.channels.length === 0) return 'Select at least one delivery channel.';
    if (!audienceReady) return 'Select the class that should receive this message.';
    return '';
  }

  function buildPayload() {
    return {
      title: formData.title.trim(),
      subject: formData.subject.trim() || undefined,
      content: formData.content.trim(),
      priority: formData.priority,
      channels: formData.channels,
      audienceConfig: {
        type: formData.audienceConfig.type,
        ...(formData.audienceConfig.classId ? { classId: formData.audienceConfig.classId } : {}),
        ...(formData.audienceConfig.sectionId ? { sectionId: formData.audienceConfig.sectionId } : {}),
      },
    };
  }

  async function handleSaveDraft() {
    if (savingDraft || sending) return;
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setSavingDraft(true);
    setError('');
    try {
      await apiFetch('/communications', { method: 'POST', body: JSON.stringify(buildPayload()) });
      showFeedback('SUCCESS', 'Broadcast saved as a draft.');
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'The draft could not be saved.');
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSend() {
    if (sending || savingDraft) return;
    const message = validate();
    if (message) {
      setError(message);
      return;
    }
    setSending(true);
    setError('');
    try {
      const comm = await apiFetch('/communications', {
        method: 'POST',
        body: JSON.stringify(buildPayload()),
      });
      await apiFetch(`/communications/${comm.id}/send`, { method: 'POST' });
      showFeedback('SUCCESS', 'Broadcast queued for delivery. Delivery status will be updated in Message History as messages are sent, delivered, or fail.');
      onSuccess();
    } catch (err: any) {
      if (err?.isServiceUnconfigured?.()) {
        setError('Messaging service is not configured. Please ask your administrator to set up SMS or Email provider credentials.');
      } else if (err?.isPermissionDenied?.()) {
        setError('You do not have permission to send messages.');
      } else if (err?.isServiceUnavailable?.()) {
        setError('Messaging service is temporarily unavailable. Please try again later.');
      } else {
        setError(err?.message || 'The communication could not be sent.');
      }
    } finally {
      setSending(false);
    }
  }

  const busy = sending || savingDraft;

  return (
    <div className="mx-auto flex h-[85vh] max-w-5xl flex-col overflow-hidden rounded-3xl border border-warm-100 bg-card shadow-sm">
      <div className="flex items-center justify-between border-b border-warm-100 bg-ivory-50/50 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-700 text-white shadow-lg shadow-sage-200">
            <Plus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold leading-tight text-charcoal-900">New broadcast</h2>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">
              Step {step} of 3
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close composer"
          className="rounded-full p-2 transition-colors hover:bg-warm-200"
        >
          <X size={20} className="text-warm-400" />
        </button>
      </div>

      <div className="custom-scrollbar flex-1 overflow-y-auto p-5 sm:p-8">
        {error && (
          <p
            role="alert"
            className="mb-6 flex items-center gap-2 rounded-xl bg-danger-50 p-3 text-xs font-semibold text-danger-700"
          >
            <AlertCircle size={15} /> {error}
          </p>
        )}

        {step === 1 && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="space-y-6">
                <div>
                  <label
                    htmlFor="broadcast-title"
                    className="mb-2 ml-1 block text-[11px] font-semibold uppercase tracking-wide text-warm-400"
                  >
                    Internal reference title *
                  </label>
                  <input
                    id="broadcast-title"
                    type="text"
                    placeholder="e.g. June fee reminder"
                    className="w-full rounded-2xl border border-warm-100 bg-ivory-50 px-5 py-3 font-bold text-charcoal-900 outline-none transition-all focus:border-forest-500 focus:ring-4 focus:ring-sage-50"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
                <div>
                  <label
                    htmlFor="broadcast-subject"
                    className="mb-2 ml-1 block text-[11px] font-semibold uppercase tracking-wide text-warm-400"
                  >
                    Email subject (optional)
                  </label>
                  <input
                    id="broadcast-subject"
                    type="text"
                    placeholder="e.g. Important notice: Term 2 fees"
                    className="w-full rounded-2xl border border-warm-100 bg-ivory-50 px-5 py-3 font-bold text-charcoal-900 outline-none transition-all focus:border-forest-500 focus:ring-4 focus:ring-sage-50"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                  Delivery channels
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      type="button"
                      aria-pressed={formData.channels.includes(channel.id)}
                      onClick={() => handleChannelToggle(channel.id)}
                      className={`flex items-center gap-3 rounded-2xl border p-4 transition-all ${
                        formData.channels.includes(channel.id)
                          ? 'border-forest-700 bg-forest-700 text-white shadow-lg shadow-sage-100'
                          : 'border-warm-100 bg-card text-warm-500 hover:border-sage-200'
                      }`}
                    >
                      <channel.icon size={20} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {channel.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label
                htmlFor="broadcast-content"
                className="mb-2 ml-1 block text-[11px] font-semibold uppercase tracking-wide text-warm-400"
              >
                Message content *
              </label>
              <textarea
                id="broadcast-content"
                rows={10}
                placeholder="Type your message here…"
                className="w-full resize-none rounded-xl border border-warm-100 bg-ivory-50 px-6 py-5 font-medium leading-relaxed text-charcoal-900 outline-none transition-all focus:border-forest-500 focus:ring-4 focus:ring-sage-50"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8">
            <div className="flex items-start gap-6 rounded-3xl border border-sage-100 bg-sage-50 p-6 sm:p-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest-700 text-white shadow-lg shadow-sage-200">
                <Target size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-tight text-forest-950">Audience targeting</h3>
                <p className="mt-1 text-sm font-bold text-forest-800/60">
                  Select precisely who should receive this communication.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              <AudienceCard
                title="Students"
                description="All active enrolled students"
                active={formData.audienceConfig.type === 'STUDENTS'}
                onClick={() => setFormData({ ...formData, audienceConfig: { type: 'STUDENTS' } })}
              />
              <AudienceCard
                title="Guardians"
                description="Primary parent/guardian contacts"
                active={formData.audienceConfig.type === 'PARENTS'}
                onClick={() => setFormData({ ...formData, audienceConfig: { type: 'PARENTS' } })}
              />
              <AudienceCard
                title="Teachers"
                description="Active faculty members"
                active={formData.audienceConfig.type === 'TEACHERS'}
                onClick={() => setFormData({ ...formData, audienceConfig: { type: 'TEACHERS' } })}
              />
              <AudienceCard
                title="Staff"
                description="Non-teaching staff members"
                active={formData.audienceConfig.type === 'STAFF'}
                onClick={() => setFormData({ ...formData, audienceConfig: { type: 'STAFF' } })}
              />
              <AudienceCard
                title="All community"
                description="Everyone with an active membership"
                active={formData.audienceConfig.type === 'ALL'}
                onClick={() => setFormData({ ...formData, audienceConfig: { type: 'ALL' } })}
              />
              <AudienceCard
                title="Class / grade"
                description="Students in one class or section"
                active={formData.audienceConfig.type === 'CLASS'}
                onClick={() =>
                  setFormData({
                    ...formData,
                    audienceConfig: { type: 'CLASS', classId: '', sectionId: '' },
                  })
                }
              />
            </div>

            {formData.audienceConfig.type === 'CLASS' && (
              <div className="flex flex-col gap-4 rounded-3xl border border-warm-100 bg-ivory-50 p-5 sm:flex-row sm:items-end sm:p-6">
                <div className="flex-1">
                  <Select
                    label="Class *"
                    value={formData.audienceConfig.classId ?? ''}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        audienceConfig: {
                          type: 'CLASS',
                          classId: event.target.value,
                          sectionId: '',
                        },
                      })
                    }
                    options={[
                      { value: '', label: classes.length ? 'Select class' : 'No classes available' },
                      ...classes.map((clazz) => ({ value: clazz.id, label: clazz.name })),
                    ]}
                  />
                </div>
                <div className="flex-1">
                  <Select
                    label="Section"
                    value={formData.audienceConfig.sectionId ?? ''}
                    disabled={!formData.audienceConfig.classId || sections.length === 0}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        audienceConfig: {
                          ...formData.audienceConfig,
                          sectionId: event.target.value,
                        },
                      })
                    }
                    options={[
                      { value: '', label: sections.length ? 'Whole class' : 'No sections' },
                      ...sections.map((section) => ({ value: section.id, label: section.name })),
                    ]}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-xl bg-ivory-50 p-4 text-xs font-semibold text-warm-600">
              {audienceLoading ? (
                <>
                  <Loader2 size={14} className="animate-spin" /> Resolving recipients…
                </>
              ) : audienceCount === null ? (
                'Recipient count will be resolved when you send.'
              ) : (
                <>
                  <Users size={14} /> {audienceCount} recipient
                  {audienceCount === 1 ? '' : 's'} will receive this broadcast.
                </>
              )}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8">
            <div className="flex items-start gap-6 rounded-3xl border border-sage-100 bg-sage-50 p-6 sm:p-8">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest-600 text-white shadow-lg shadow-sage-200">
                <Eye size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold leading-tight text-forest-900">Review & dispatch</h3>
                <p className="mt-1 text-sm font-bold text-forest-700/60">
                  Verify all details before finalising this broadcast.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              <div className="space-y-6">
                <SummaryItem label="Campaign title" value={formData.title || '—'} />
                <SummaryItem
                  label="Target audience"
                  value={
                    AUDIENCE_LABELS[formData.audienceConfig.type] ?? formData.audienceConfig.type
                  }
                />
                {formData.audienceConfig.type === 'CLASS' && (
                  <SummaryItem
                    label="Class"
                    value={
                      classes.find((clazz) => clazz.id === formData.audienceConfig.classId)?.name ??
                      'Not selected'
                    }
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.channels.map((channel) => (
                    <span
                      key={channel}
                      className="rounded-lg border border-warm-200 bg-warm-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-warm-500"
                    >
                      {channel}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-warm-100 bg-ivory-50 p-6 sm:p-8">
                <p className="mb-4 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                  Live preview
                </p>
                <div className="space-y-4">
                  <h4 className="text-xl font-semibold text-charcoal-900">
                    {formData.subject || formData.title || 'Untitled broadcast'}
                  </h4>
                  <p className="whitespace-pre-wrap text-sm font-medium leading-relaxed text-warm-600">
                    {formData.content || 'No content yet.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-warm-100 bg-ivory-50/50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setStep((prev) => Math.max(1, prev - 1))}
            disabled={step === 1 || busy}
            className="rounded-2xl border border-warm-200 bg-card px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-warm-400 transition-all hover:bg-ivory-50 disabled:opacity-30"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={busy}
            className="flex items-center gap-2 rounded-2xl border border-warm-200 bg-card px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-warm-600 transition-all hover:bg-ivory-50 disabled:opacity-50"
          >
            {savingDraft ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {savingDraft ? 'Saving…' : 'Save draft'}
          </button>
        </div>

        {step < 3 ? (
          <button
            type="button"
            onClick={() => {
              const message = step === 1 ? validate() : !audienceReady ? 'Select the class that should receive this message.' : '';
              if (message) {
                setError(message);
                return;
              }
              setError('');
              setStep((prev) => prev + 1);
            }}
            className="rounded-2xl bg-charcoal-900 px-8 py-3 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-charcoal-950"
          >
            Continue
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSend}
            disabled={busy}
            className="flex items-center justify-center gap-3 rounded-2xl bg-forest-700 px-8 py-4 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-forest-800 disabled:opacity-50"
          >
            {sending ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Send size={18} /> Send broadcast now
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function AudienceCard({ title, description, active, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-3xl border p-5 text-left transition-all ${
        active
          ? 'border-forest-700 bg-sage-50 shadow-sm'
          : 'border-warm-100 bg-card hover:border-sage-200'
      }`}
    >
      <div
        className={`mb-4 flex h-8 w-8 items-center justify-center rounded-lg ${
          active ? 'bg-forest-700 text-white' : 'bg-warm-100 text-warm-400'
        }`}
      >
        <Users size={16} />
      </div>
      <h4
        className={`mb-1 text-sm font-semibold uppercase tracking-wider ${
          active ? 'text-forest-950' : 'text-charcoal-900'
        }`}
      >
        {title}
      </h4>
      <p className={`text-[11px] font-bold leading-tight ${active ? 'text-forest-800/60' : 'text-warm-400'}`}>
        {description}
      </p>
    </button>
  );
}

function SummaryItem({ label, value }: any) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</p>
      <p className="text-base font-semibold text-charcoal-900">{value}</p>
    </div>
  );
}
