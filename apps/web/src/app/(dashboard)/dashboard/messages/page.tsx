'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useRealtime, useRealtimeEvent } from '@/hooks/use-realtime';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  Send,
  Search,
  Plus,
  Users,
  Loader2,
  AlertCircle,
  MessageSquare,
  CheckCheck,
} from 'lucide-react';

function participantName(participant: any) {
  const user = participant?.user ?? participant;
  return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
}

function conversationTitle(conversation: any, currentUserId: string) {
  if (conversation?.title) return conversation.title;
  const others = (conversation?.participants ?? [])
    .filter((participant: any) => participant.userId !== currentUserId && participant.user?.id !== currentUserId)
    .map(participantName)
    .filter(Boolean);
  return others.length > 0 ? others.join(', ') : 'Conversation';
}

export default function MessagesPage() {
  const { user } = useAuth();
  const currentUserId = user?.id ?? '';

  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [threadError, setThreadError] = useState('');
  const [search, setSearch] = useState('');
  const [composerOpen, setComposerOpen] = useState(false);
  const { socket } = useRealtime();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (selectedId) {
      loadMessages(selectedId);
    } else {
      setMessages([]);
    }
  }, [selectedId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useRealtimeEvent(socket, 'new_message', (msg: any) => {
    if (msg?.conversationId === selectedId) {
      setMessages((previous) =>
        previous.some((existing) => existing.id === msg.id) ? previous : [...previous, msg],
      );
    }
    loadConversations();
  });

  async function loadConversations() {
    setError('');
    try {
      const data = await apiFetch('/messages/conversations');
      const list = Array.isArray(data) ? data : [];
      setConversations(list);
      setSelectedId((current) => current ?? list[0]?.id ?? null);
    } catch (err: any) {
      setConversations([]);
      setError(err?.message || 'Could not load conversations.');
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(id: string) {
    setThreadLoading(true);
    setThreadError('');
    try {
      const data = await apiFetch(`/messages/conversations/${id}`);
      setMessages(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setMessages([]);
      setThreadError(err?.message || 'Could not load this conversation.');
    } finally {
      setThreadLoading(false);
    }
  }

  async function handleSendMessage(event: React.FormEvent) {
    event.preventDefault();
    if (sending || !newMessage.trim() || !selectedId) return;
    setSending(true);
    try {
      const sent = await apiFetch(`/messages/conversations/${selectedId}/send`, {
        method: 'POST',
        body: JSON.stringify({ content: newMessage.trim() }),
      });
      setMessages((previous) => [...previous, sent]);
      setNewMessage('');
      loadConversations();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not send the message.');
    } finally {
      setSending(false);
    }
  }

  const visibleConversations = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return conversations;
    return conversations.filter((conversation) => {
      const title = conversationTitle(conversation, currentUserId).toLowerCase();
      const last = String(conversation.messages?.[0]?.content ?? '').toLowerCase();
      return title.includes(needle) || last.includes(needle);
    });
  }, [conversations, currentUserId, search]);

  const activeConversation = conversations.find((conversation) => conversation.id === selectedId);
  const activeOthers = (activeConversation?.participants ?? []).filter(
    (participant: any) => participant.userId !== currentUserId && participant.user?.id !== currentUserId,
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-16 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading conversations…
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden md:flex-row">
      <div className="flex w-full shrink-0 flex-col border-b border-warm-200 bg-card md:w-80 md:border-b-0 md:border-r lg:w-96">
        <div className="flex items-center justify-between border-b border-warm-100 bg-ivory-50/50 p-5">
          <h1 className="text-xl font-semibold tracking-tight text-charcoal-900">Messages</h1>
          <Button onClick={() => setComposerOpen(true)} size="icon" aria-label="New conversation">
            <Plus size={18} />
          </Button>
        </div>
        <div className="border-b border-warm-100 bg-card p-4">
          <div className="flex items-center rounded-xl bg-warm-100 px-3 py-2">
            <Search size={16} className="mr-2 shrink-0 text-warm-400" />
            <input
              type="search"
              aria-label="Search conversations"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search conversations…"
              className="w-full border-none bg-transparent text-xs font-medium focus:outline-none"
            />
          </div>
        </div>

        {error && (
          <div role="alert" className="m-3 flex items-start gap-2 rounded-xl bg-danger-50 p-3 text-[11px] font-semibold text-danger-700">
            <AlertCircle size={14} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}

        <div className="flex-1 space-y-1 overflow-y-auto p-2">
          {visibleConversations.map((conversation) => {
            const title = conversationTitle(conversation, currentUserId);
            const lastMessage = conversation.messages?.[0];
            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() => setSelectedId(conversation.id)}
                className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                  selectedId === conversation.id
                    ? 'bg-forest-700 text-white shadow-sm'
                    : 'text-charcoal-900 hover:bg-ivory-50'
                }`}
              >
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border font-semibold ${
                    selectedId === conversation.id
                      ? 'border-white/10 bg-white/20 text-white'
                      : 'border-warm-100 bg-warm-100 text-warm-500'
                  }`}
                >
                  {title[0]?.toUpperCase() ?? 'C'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-0.5 flex items-baseline justify-between gap-2">
                    <p className="truncate text-sm font-semibold leading-tight">{title}</p>
                    {conversation.lastMessageAt && (
                      <span
                        className={`shrink-0 text-[10px] font-bold uppercase ${
                          selectedId === conversation.id ? 'text-white/60' : 'text-warm-400'
                        }`}
                      >
                        {new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    )}
                  </div>
                  <p
                    className={`truncate text-xs ${
                      selectedId === conversation.id ? 'text-white/80' : 'font-medium text-warm-500'
                    }`}
                  >
                    {lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
              </button>
            );
          })}
          {visibleConversations.length === 0 && (
            <div className="px-4 py-16 text-center text-[11px] font-bold uppercase tracking-wide text-warm-400">
              {conversations.length === 0
                ? 'No conversations yet'
                : 'No conversations match your search'}
            </div>
          )}
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col bg-ivory-50">
        {selectedId ? (
          <>
            <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-warm-200 bg-card px-4 sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sage-50 font-semibold text-forest-700">
                  {conversationTitle(activeConversation, currentUserId)[0]?.toUpperCase() ?? 'C'}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold leading-tight text-charcoal-900">
                    {conversationTitle(activeConversation, currentUserId)}
                  </p>
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                    {activeOthers.length > 0
                      ? activeOthers.map(participantName).join(', ')
                      : `${activeConversation?.participants?.length ?? 1} participant${
                          (activeConversation?.participants?.length ?? 1) === 1 ? '' : 's'
                        }`}
                  </p>
                </div>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              {threadLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-xs font-semibold text-warm-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading messages…
                </div>
              ) : threadError ? (
                <div role="alert" className="rounded-xl bg-danger-50 p-4 text-center text-xs font-semibold text-danger-700">
                  {threadError}
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={() => loadMessages(selectedId)}>
                      Try again
                    </Button>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="py-16">
                  <EmptyState
                    icon={<MessageSquare className="h-7 w-7" />}
                    title="No messages yet"
                    description="Send the first message to start this conversation."
                  />
                </div>
              ) : (
                messages.map((message) => {
                  const isMe = message.senderId === currentUserId || message.sender?.id === currentUserId;
                  return (
                    <div key={message.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[85%] sm:max-w-[70%]">
                        {!isMe && (
                          <p className="mb-1 ml-1 text-[11px] font-semibold uppercase tracking-tight text-warm-400">
                            {participantName(message.sender) || 'Member'}
                          </p>
                        )}
                        <div
                          className={`rounded-3xl p-3.5 text-sm font-medium shadow-sm ${
                            isMe
                              ? 'rounded-tr-none bg-forest-700 text-white'
                              : 'rounded-tl-none border border-warm-100 bg-card text-charcoal-800'
                          }`}
                        >
                          {message.content}
                        </div>
                        <div className={`mt-1 flex items-center gap-1.5 ${isMe ? 'justify-end pr-1' : 'pl-1'}`}>
                          <span className="text-[10px] font-bold uppercase tracking-tight text-warm-400">
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && <CheckCheck size={12} className="text-forest-500" />}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t border-warm-200 bg-card p-3 sm:p-5">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  aria-label="Message"
                  placeholder="Type your message…"
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  className="flex-1 rounded-2xl border border-transparent bg-ivory-50 px-4 py-3 text-sm font-medium shadow-inner transition-all focus:border-forest-600 focus:bg-card focus:outline-none"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim()}
                  isLoading={sending}
                  aria-label="Send message"
                >
                  <Send size={18} />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-warm-100 bg-card shadow-sm">
              <Users size={36} className="text-forest-700" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-charcoal-900">Select a conversation</h2>
            <p className="mt-2 max-w-xs text-sm font-medium text-warm-500">
              Choose an existing conversation or start a new one with a colleague.
            </p>
            <Button className="mt-5" onClick={() => setComposerOpen(true)} leftIcon={<Plus size={16} />}>
              New conversation
            </Button>
          </div>
        )}
      </div>

      {composerOpen && (
        <NewConversationModal
          onClose={() => setComposerOpen(false)}
          onCreated={(conversationId) => {
            setComposerOpen(false);
            setSelectedId(conversationId);
            showFeedback('SUCCESS', 'Conversation started.');
            loadConversations();
          }}
        />
      )}
    </div>
  );
}

function NewConversationModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}) {
  const [recipients, setRecipients] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/messages/recipients')
      .then((data) => {
        if (!cancelled) setRecipients(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || 'Could not load recipients.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visible = recipients.filter((recipient) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      `${recipient.firstName ?? ''} ${recipient.lastName ?? ''}`.toLowerCase().includes(needle) ||
      String(recipient.email ?? '').toLowerCase().includes(needle)
    );
  });

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (selected.length === 0) {
      setError('Select at least one person to message.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const conversation = await apiFetch('/messages/conversations', {
        method: 'POST',
        body: JSON.stringify({
          participantIds: selected,
          title: selected.length > 1 ? title.trim() || undefined : undefined,
        }),
      });
      onCreated(conversation.id);
    } catch (err: any) {
      setError(err?.message || 'Could not start the conversation.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="New conversation"
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="new-conversation-form" isLoading={saving} disabled={selected.length === 0}>
            Start conversation
          </Button>
        </>
      }
    >
      <form id="new-conversation-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <div className="flex items-center rounded-xl border border-warm-200 bg-card px-3 py-2">
          <Search size={16} className="mr-2 shrink-0 text-warm-400" />
          <input
            type="search"
            aria-label="Search colleagues"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search colleagues by name or email…"
            className="w-full border-none bg-transparent text-sm font-medium focus:outline-none"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs font-semibold text-warm-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading colleagues…
          </div>
        ) : visible.length === 0 ? (
          <p className="rounded-lg border border-dashed border-warm-200 p-6 text-center text-xs font-semibold uppercase tracking-wide text-warm-400">
            {recipients.length === 0 ? 'No colleagues available to message' : 'No colleagues match your search'}
          </p>
        ) : (
          <div className="max-h-64 space-y-1 overflow-y-auto rounded-xl border border-warm-100 p-2">
            {visible.map((recipient) => (
              <label
                key={recipient.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2.5 hover:bg-ivory-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(recipient.id)}
                  onChange={() => toggle(recipient.id)}
                  className="h-4 w-4 rounded border-warm-300 text-forest-700 focus:ring-forest-600"
                />
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-warm-100 text-xs font-semibold text-warm-500">
                  {recipient.firstName?.[0] ?? '?'}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-charcoal-900">
                    {recipient.firstName} {recipient.lastName}
                  </span>
                  <span className="block truncate text-[11px] text-warm-400">{recipient.email}</span>
                </span>
              </label>
            ))}
          </div>
        )}

        {selected.length > 1 && (
          <div className="space-y-1.5">
            <label htmlFor="conversation-title" className="block text-xs font-semibold text-charcoal-800">
              Group title (optional)
            </label>
            <input
              id="conversation-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. JHS assessment planning"
              className="w-full rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
            />
          </div>
        )}
        <p className="text-[11px] font-medium text-warm-400">
          {selected.length} selected. Participants must belong to this school.
        </p>
      </form>
    </Modal>
  );
}
