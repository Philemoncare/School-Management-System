'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  ChevronRight,
  CircleSlash,
  Clock,
  Inbox,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

const STATUSES = ['OPEN', 'IN_PROGRESS', 'AWAITING_SCHOOL', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const CATEGORIES = ['ACCESS', 'BILLING', 'SMS', 'DATA', 'FEATURE', 'BUG', 'OTHER'];

const STATUS_TONE: Record<string, string> = {
  OPEN: 'bg-danger-50 text-danger-700 border-danger-200',
  IN_PROGRESS: 'bg-warning-50 text-warning-700 border-warning-200',
  AWAITING_SCHOOL: 'bg-sage-50 text-forest-800 border-sage-200',
  RESOLVED: 'bg-success-50 text-success-700 border-success-200',
  CLOSED: 'bg-warm-100 text-warm-600 border-warm-200',
};

const PRIORITY_TONE: Record<string, string> = {
  LOW: 'text-warm-500',
  MEDIUM: 'text-forest-700',
  HIGH: 'text-warning-700',
  CRITICAL: 'text-danger-700',
};

const PLATFORM_ROLE_NAMES = [
  'PLATFORM_SUPER_ADMIN',
  'PLATFORM_OPERATIONS_ADMIN',
  'PLATFORM_SUPPORT_ADMIN',
  'SUPER_ADMIN',
];

function tone(map: Record<string, string>, value: string | undefined, fallback: string) {
  return map[value || ''] || fallback;
}

export default function SuperAdminSupportTickets() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [metrics, setMetrics] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [category, setCategory] = useState('');
  const [unassigned, setUnassigned] = useState(false);
  const [page, setPage] = useState(1);
  const take = 25;

  const [openTicket, setOpenTicket] = useState<any>(null);
  const [thread, setThread] = useState<any>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [reply, setReply] = useState('');
  const [replyInternal, setReplyInternal] = useState(false);
  const [statusDraft, setStatusDraft] = useState('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [assigneeDraft, setAssigneeDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [create, setCreate] = useState<any>({
    schoolId: '',
    subject: '',
    description: '',
    category: 'OTHER',
    priority: 'MEDIUM',
    notifySchoolAdmins: true,
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const loadList = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        skip: String((page - 1) * take),
        take: String(take),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(category && { category }),
        ...(unassigned && { unassigned: 'true' }),
      });
      setData(await apiFetch(`/super-admin/tickets?${query}`));
    } catch (err: any) {
      setError(err.message || 'Unable to load the support queue');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, priority, category, unassigned]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    apiFetch('/super-admin/tickets/metrics').then(setMetrics).catch(console.error);
    apiFetch('/super-admin/schools?take=100')
      .then((result) => setSchools(result?.items || []))
      .catch(console.error);
    apiFetch('/super-admin/users?take=100')
      .then((result) =>
        setAgents(
          (result?.items || []).filter((user: any) =>
            (user.userRoles || []).some((ur: any) => PLATFORM_ROLE_NAMES.includes(ur.role?.name)),
          ),
        ),
      )
      .catch(console.error);
  }, []);

  async function loadThread(ticketId: string) {
    setThreadLoading(true);
    try {
      setThread(await apiFetch(`/super-admin/tickets/${ticketId}`));
    } catch (err: any) {
      setError(err.message || 'Unable to load this ticket');
    } finally {
      setThreadLoading(false);
    }
  }

  function openDetail(ticket: any) {
    setOpenTicket(ticket);
    setStatusDraft(ticket.status);
    setAssigneeDraft(ticket.assignedTo?.id || '');
    setResolutionNote('');
    setReply('');
    setReplyInternal(false);
    loadThread(ticket.id);
  }

  async function act(fn: () => Promise<any>, success: string) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(success);
      if (openTicket) await loadThread(openTicket.id);
      await loadList();
      apiFetch('/super-admin/tickets/metrics').then(setMetrics).catch(console.error);
    } catch (err: any) {
      setError(err.message || 'That action did not complete');
    } finally {
      setBusy(false);
    }
  }

  function submitReply() {
    if (!reply.trim() || !openTicket) return;
    act(
      () =>
        apiFetch(`/super-admin/tickets/${openTicket.id}/messages`, {
          method: 'POST',
          body: JSON.stringify({ body: reply.trim(), internal: replyInternal }),
        }),
      replyInternal ? 'Internal note added to the thread.' : 'Reply sent and the school notified.',
    );
    setReply('');
  }

  function submitStatus() {
    if (!openTicket || !statusDraft) return;
    act(
      () =>
        apiFetch(`/super-admin/tickets/${openTicket.id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({
            status: statusDraft,
            resolutionNote: statusDraft === 'RESOLVED' ? resolutionNote : undefined,
          }),
        }),
      `Ticket moved to ${statusDraft}.`,
    );
    setResolutionNote('');
  }

  function submitAssign() {
    if (!openTicket || !assigneeDraft) return;
    act(
      () =>
        apiFetch(`/super-admin/tickets/${openTicket.id}/assign`, {
          method: 'PATCH',
          body: JSON.stringify({ assigneeId: assigneeDraft }),
        }),
      'Ticket assigned.',
    );
  }

  async function createTicket() {
    setBusy(true);
    setError('');
    try {
      const ticket = await apiFetch('/super-admin/tickets', {
        method: 'POST',
        body: JSON.stringify({
          schoolId: create.schoolId,
          subject: create.subject,
          description: create.description,
          category: create.category,
          priority: create.priority,
          notifySchoolAdmins: create.notifySchoolAdmins,
        }),
      });
      setCreateOpen(false);
      setCreate({ schoolId: '', subject: '', description: '', category: 'OTHER', priority: 'MEDIUM', notifySchoolAdmins: true });
      setNotice(`Ticket ${ticket.reference} created.`);
      await loadList();
      apiFetch('/super-admin/tickets/metrics').then(setMetrics).catch(console.error);
    } catch (err: any) {
      setError(err.message || 'Unable to create the ticket');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <Inbox className="text-forest-700" /> Support Queue
          </h1>
          <p className="text-warm-500 font-medium mt-1">Platform-side handling of school support requests.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} leftIcon={<Plus size={18} />} disabled={!schools.length}>
          New Ticket
        </Button>
      </div>

      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Stat label="Open" value={metrics.open} />
          <Stat label="In progress" value={metrics.inProgress} />
          <Stat label="Awaiting school" value={metrics.awaitingSchool} />
          <Stat label="Unassigned" value={metrics.unassigned} tone={metrics.unassigned ? 'text-danger-700' : 'text-warm-500'} />
          <Stat label="Resolved (7d)" value={metrics.resolvedLast7Days} />
          <Stat
            label="Critical / high open"
            value={`${metrics.openByPriority?.critical ?? 0} / ${metrics.openByPriority?.high ?? 0}`}
            tone={(metrics.openByPriority?.critical || 0) > 0 ? 'text-danger-700' : 'text-warm-500'}
          />
        </div>
      )}

      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}
      {notice && <div className="rounded-xl border border-success-200 bg-success-50 px-4 py-3 text-sm font-semibold text-success-700">{notice}</div>}

      <div className="bg-card border border-warm-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-warm-100 space-y-4 bg-ivory-50/50">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 bg-card border border-warm-200 px-4 py-2.5 rounded-xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search reference, subject or description..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold outline-none"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-full sm:w-40">
              <option value="">All statuses</option>
              {STATUSES.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
            </Select>
            <Select value={priority} onChange={(e) => { setPriority(e.target.value); setPage(1); }} className="w-full sm:w-36">
              <option value="">All priorities</option>
              {PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }} className="w-full sm:w-36">
              <option value="">All categories</option>
              {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Button variant={unassigned ? 'primary' : 'outline'} onClick={() => { setUnassigned((v) => !v); setPage(1); }} leftIcon={<UserCheck size={16} />}>
              Unassigned
            </Button>
          </div>
        </div>

        <div className="relative overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Reference</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Subject</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">School</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Priority</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Status</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Assignee</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Last activity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {data.items.map((ticket: any) => (
                <tr key={ticket.id} onClick={() => openDetail(ticket)} className="hover:bg-ivory-50 transition-colors cursor-pointer">
                  <td className="px-5 py-3 text-[11px] font-mono font-bold text-forest-700 whitespace-nowrap">{ticket.reference}</td>
                  <td className="px-5 py-3">
                    <p className="text-xs font-semibold text-charcoal-900 truncate max-w-[260px]">{ticket.subject}</p>
                    <p className="text-[10px] text-warm-400 uppercase font-bold">{ticket.category} · {ticket._count?.messages ?? 0} messages</p>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-warm-600">{ticket.school?.name || '-'}</td>
                  <td className={`px-5 py-3 text-[11px] font-bold uppercase ${tone(PRIORITY_TONE, ticket.priority, 'text-warm-500')}`}>{ticket.priority}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${tone(STATUS_TONE, ticket.status, 'bg-warm-100 text-warm-600 border-warm-200')}`}>
                      {String(ticket.status).replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-warm-600">
                    {ticket.assignedTo ? `${ticket.assignedTo.firstName} ${ticket.assignedTo.lastName}` : <span className="text-warm-400">Unassigned</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-warm-500">
                      <Clock size={13} />
                      <span className="text-[11px] font-bold whitespace-nowrap">{new Date(ticket.lastActivityAt).toLocaleString()}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {!loading && data.items.length === 0 && (
            <div className="py-20 text-center px-6">
              <CircleSlash className="mx-auto text-warm-200 mb-4" size={64} />
              <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No tickets match these filters</p>
              <p className="text-warm-400 text-sm mt-2">
                Tickets are raised by school administrators or opened here on a school's behalf.
              </p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 bg-ivory-50/50 border-t border-warm-100 flex items-center justify-between">
          <p className="text-xs font-bold text-warm-400 uppercase">Showing {data.items.length} of {data.total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={page === 1} className="p-2 bg-card border border-warm-200 rounded-xl disabled:opacity-30 shadow-sm">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setPage((v) => v + 1)} disabled={page * take >= data.total} className="p-2 bg-card border border-warm-200 rounded-xl disabled:opacity-30 shadow-sm">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={Boolean(openTicket)} onClose={() => setOpenTicket(null)} title={openTicket ? `${openTicket.reference} — ${openTicket.subject}` : ''} size="xl">
        {threadLoading && !thread ? (
          <div className="py-16 flex items-center justify-center"><Loader2 className="animate-spin text-forest-700" size={28} /></div>
        ) : thread ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <Field label="School">
                <Link href={`/super-admin/schools/${thread.school?.id}`} className="font-semibold text-forest-700 hover:underline">
                  {thread.school?.name || '-'}
                </Link>
              </Field>
              <Field label="Category"><span className="font-semibold uppercase">{thread.category}</span></Field>
              <Field label="Priority"><span className={`font-semibold uppercase ${tone(PRIORITY_TONE, thread.priority, 'text-warm-500')}`}>{thread.priority}</span></Field>
              <Field label="Status"><span className={`font-semibold uppercase ${tone(PRIORITY_TONE, thread.status, 'text-warm-500')}`}>{String(thread.status).replace(/_/g, ' ')}</span></Field>
            </div>

            <div className="rounded-xl border border-warm-200 bg-ivory-50 p-4">
              <p className="text-[10px] font-bold uppercase text-warm-400 mb-1">Description</p>
              <p className="text-sm font-medium text-charcoal-900 whitespace-pre-wrap">{thread.description}</p>
              <p className="text-[11px] text-warm-400 mt-2">
                Raised by {thread.openedBy?.firstName || ''} {thread.openedBy?.lastName || ''} on {new Date(thread.createdAt).toLocaleString()}
              </p>
            </div>

            <div className="space-y-3">
              <p className="text-[11px] font-bold uppercase text-warm-400">Thread</p>
              {thread.messages.map((message: any) => (
                <div
                  key={message.id}
                  className={`rounded-xl border p-3 ${message.internal ? 'border-warning-200 bg-warning-50' : 'border-warm-200 bg-card'}`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-xs font-semibold text-charcoal-900">
                      {message.author ? `${message.author.firstName} ${message.author.lastName}` : 'Unknown'}
                      {message.internal && <span className="ml-2 text-[10px] font-bold uppercase text-warning-700">internal note</span>}
                      {message.statusChange && <span className="ml-2 text-[10px] font-bold uppercase text-warm-500">→ {String(message.statusChange).replace(/_/g, ' ')}</span>}
                    </p>
                    <p className="text-[10px] text-warm-400 whitespace-nowrap">{new Date(message.createdAt).toLocaleString()}</p>
                  </div>
                  <p className="text-sm text-warm-700 whitespace-pre-wrap">{message.body}</p>
                </div>
              ))}
              {!thread.messages.length && <p className="text-sm text-warm-400">No replies yet.</p>}
            </div>

            <div className="space-y-2">
              <Input
                as="textarea"
                label="Reply to the school"
                rows={3}
                value={reply}
                onChange={(e: any) => setReply(e.target.value)}
                placeholder="Write the response the school administrator will see."
              />
              <label className="flex items-center gap-2 text-xs font-semibold text-warm-600">
                <input type="checkbox" checked={replyInternal} onChange={(e) => setReplyInternal(e.target.checked)} className="rounded border-warm-300" />
                Keep as an internal note (not sent to the school)
              </label>
              <Button onClick={submitReply} disabled={busy || !reply.trim()} leftIcon={<Send size={16} />}>Post message</Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-warm-100">
              <div className="space-y-2">
                <Select label="Change status" value={statusDraft} onChange={(e: any) => setStatusDraft(e.target.value)}>
                  {STATUSES.map((item) => <option key={item} value={item}>{item.replace(/_/g, ' ')}</option>)}
                </Select>
                {statusDraft === 'RESOLVED' && (
                  <Input as="textarea" label="Resolution note (required)" rows={2} value={resolutionNote} onChange={(e: any) => setResolutionNote(e.target.value)} />
                )}
                <Button variant="outline" onClick={submitStatus} disabled={busy || statusDraft === thread.status || (statusDraft === 'RESOLVED' && resolutionNote.trim().length < 5)}>
                  Apply status
                </Button>
              </div>
              <div className="space-y-2">
                <Select label="Assign to" value={assigneeDraft} onChange={(e: any) => setAssigneeDraft(e.target.value)}>
                  <option value="">Select a platform teammate</option>
                  {agents.map((agent: any) => (
                    <option key={agent.id} value={agent.id}>{agent.firstName} {agent.lastName} ({agent.email})</option>
                  ))}
                </Select>
                <Button variant="outline" onClick={submitAssign} disabled={busy || !assigneeDraft || assigneeDraft === thread.assignedTo?.id} leftIcon={<UserCheck size={16} />}>
                  Assign
                </Button>
              </div>
              <div className="text-[11px] text-warm-500 font-medium space-y-1">
                <p className="flex items-center gap-2"><MessageSquare size={14} /> {thread.messages.length} entries in this thread.</p>
                {thread.resolvedAt && <p>Resolved {new Date(thread.resolvedAt).toLocaleString()}</p>}
                {thread.resolutionNote && <p className="text-warm-600">{thread.resolutionNote}</p>}
                <p className="text-warm-400">Status changes and replies are written to the platform audit trail.</p>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Open a ticket for a school"
        size="md"
        footerActions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={createTicket} disabled={busy || !create.schoolId || create.subject.trim().length < 10 || create.description.trim().length < 20}>
              Create ticket
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-warm-500 font-medium">
            Use this when a school contacts the platform directly. A ticket raised by a school through its own dashboard is recorded the same way.
          </p>
          <Select label="School" value={create.schoolId} onChange={(e: any) => setCreate({ ...create, schoolId: e.target.value })}>
            <option value="">Select a school</option>
            {schools.map((school: any) => <option key={school.id} value={school.id}>{school.name} ({school.code})</option>)}
          </Select>
          <Input label="Subject" value={create.subject} onChange={(e: any) => setCreate({ ...create, subject: e.target.value })} placeholder="Short summary of the problem" />
          <Input as="textarea" label="Description" rows={4} value={create.description} onChange={(e: any) => setCreate({ ...create, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-3">
            <Select label="Category" value={create.category} onChange={(e: any) => setCreate({ ...create, category: e.target.value })}>
              {CATEGORIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
            <Select label="Priority" value={create.priority} onChange={(e: any) => setCreate({ ...create, priority: e.target.value })}>
              {PRIORITIES.map((item) => <option key={item} value={item}>{item}</option>)}
            </Select>
          </div>
          <label className="flex items-center gap-2 text-xs font-semibold text-warm-600">
            <input
              type="checkbox"
              checked={create.notifySchoolAdmins}
              onChange={(e) => setCreate({ ...create, notifySchoolAdmins: e.target.checked })}
              className="rounded border-warm-300"
            />
            Notify the school's administrators that a ticket was logged
          </label>
        </div>
      </Modal>
    </div>
  );
}

function Stat({ label, value, tone: textTone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className="bg-card border border-warm-200 rounded-2xl px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase text-warm-400">{label}</p>
      <p className={`text-2xl font-semibold mt-1 ${textTone || 'text-charcoal-900'}`}>{value ?? 0}</p>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase text-warm-400">{label}</p>
      <div className="mt-1 text-warm-700">{children}</div>
    </div>
  );
}
