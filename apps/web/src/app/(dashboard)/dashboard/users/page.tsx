'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  Mail,
  RefreshCw,
  Send,
  Trash2,
  UserPlus,
  Users,
  XCircle,
} from 'lucide-react';

interface Member {
  id: string;
  status: string;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    isActive: boolean;
    userRoles: { id: string; role: { name: string } }[];
  };
}

interface Invitation {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  role: { id: string; name: string };
}

interface Role {
  id: string;
  name: string;
  description?: string | null;
}

export default function SchoolUsersPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [user, activeSchoolId]);
  const canInvite = roles.some((role) => ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(role));
  const canSuspend = roles.includes('SCHOOL_ADMIN');

  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [roleOptions, setRoleOptions] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'members' | 'invitations'>('members');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const results = await Promise.allSettled([
        apiFetch('/memberships'),
        canInvite ? apiFetch('/users/invitations') : Promise.resolve([]),
        canInvite ? apiFetch('/users/invitations/roles') : Promise.resolve([]),
      ]);
      const [memberResult, inviteResult, roleResult] = results;
      if (memberResult.status === 'rejected') {
        throw memberResult.reason;
      }
      setMembers(Array.isArray(memberResult.value) ? memberResult.value : []);
      setInvitations(
        inviteResult.status === 'fulfilled' && Array.isArray(inviteResult.value)
          ? inviteResult.value
          : [],
      );
      setRoleOptions(
        roleResult.status === 'fulfilled' && Array.isArray(roleResult.value)
          ? roleResult.value
          : [],
      );
    } catch (err: any) {
      setError(err?.message || 'Could not load the user directory.');
    } finally {
      setLoading(false);
    }
  }, [canInvite]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleMember(member: Member) {
    if (!canSuspend) return;
    const next = member.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const verb = next === 'ACTIVE' ? 'reactivate' : 'suspend';
    if (!window.confirm(`Are you sure you want to ${verb} ${member.user.email}?`)) return;

    setBusyId(member.id);
    try {
      await apiFetch(`/memberships/${member.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      showFeedback('SUCCESS', `Membership ${verb}d.`);
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || `Could not ${verb} this member.`);
    } finally {
      setBusyId(null);
    }
  }

  async function revokeInvitation(invitation: Invitation) {
    if (!window.confirm(`Revoke the invitation for ${invitation.email}?`)) return;
    setBusyId(invitation.id);
    try {
      await apiFetch(`/users/invitations/${invitation.id}`, { method: 'DELETE' });
      showFeedback('SUCCESS', 'Invitation revoked.');
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not revoke the invitation.');
    } finally {
      setBusyId(null);
    }
  }

  async function resendInvitation(invitation: Invitation) {
    setBusyId(invitation.id);
    try {
      const result = await apiFetch(`/users/invitations/${invitation.id}/resend`, {
        method: 'POST',
      });
      if (result?.inviteLink) {
        await copy(result.inviteLink);
        showFeedback('SUCCESS', 'Invitation renewed. The new link was copied.');
      } else {
        showFeedback('SUCCESS', 'Invitation renewed.');
      }
      await load();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not resend the invitation.');
    } finally {
      setBusyId(null);
    }
  }

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      textarea.remove();
    }
  }

  const filteredMembers = members.filter((member) => {
    const needle = search.trim().toLowerCase();
    if (!needle) return true;
    return (
      `${member.user.firstName} ${member.user.lastName}`.toLowerCase().includes(needle) ||
      member.user.email.toLowerCase().includes(needle)
    );
  });

  const pendingInvitations = invitations.filter((invitation) => invitation.status === 'PENDING');

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Users className="h-6 w-6 text-forest-700 sm:h-7 sm:w-7" /> User Directory
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Manage school staff, teachers, and administrative access.
          </p>
        </div>
        {canInvite && (
          <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus size={18} />} className="w-full sm:w-auto">
            Invite New User
          </Button>
        )}
      </div>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <Button variant="outline" size="sm" onClick={load}>
            Try again
          </Button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
        <div className="flex flex-col gap-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:flex-row sm:items-center sm:p-6">
          <div className="flex flex-1 items-center rounded-xl border border-warm-200 bg-card px-3.5 py-2 shadow-xs">
            <Mail size={16} className="mr-2.5 shrink-0 text-warm-400" />
            <input
              type="search"
              placeholder="Search users by name or email..."
              aria-label="Search users"
              className="w-full border-none bg-transparent text-xs font-semibold outline-none sm:text-sm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          {canInvite && (
            <div className="flex rounded-xl border border-warm-200 bg-card p-1" role="tablist" aria-label="User directory views">
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'members'}
                onClick={() => setTab('members')}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${tab === 'members' ? 'bg-forest-800 text-ivory-50' : 'text-warm-600 hover:bg-warm-50'}`}
              >
                Members ({members.length})
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={tab === 'invitations'}
                onClick={() => setTab('invitations')}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-bold ${tab === 'invitations' ? 'bg-forest-800 text-ivory-50' : 'text-warm-600 hover:bg-warm-50'}`}
              >
                Invitations ({pendingInvitations.length})
              </button>
            </div>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={load}
            disabled={loading}
            leftIcon={<RefreshCw size={14} className={loading ? 'animate-spin' : undefined} />}
          >
            Refresh
          </Button>
        </div>

        {loading && members.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm font-medium text-warm-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading user directory…
          </div>
        ) : tab === 'members' ? (
          filteredMembers.length === 0 ? (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title={search ? 'No matching members' : 'No team members yet'}
              description={
                search
                  ? 'Try a different name or email address.'
                  : 'Invite teachers, administrators, and staff to give them access to this school.'
              }
              actionButton={
                canInvite && !search ? (
                  <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus size={16} />}>
                    Invite New User
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200">
                <thead className="bg-ivory-50">
                  <tr>
                    {['Team Member', 'School Roles', 'Status', 'Joined At', 'Actions'].map((heading) => (
                      <th
                        key={heading}
                        scope="col"
                        className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6 ${
                          heading === 'Actions' ? 'text-right' : 'text-left'
                        }`}
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 bg-card">
                  {filteredMembers.map((member) => (
                    <tr key={member.id} className="transition-colors hover:bg-sage-50/30">
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-warm-100 bg-warm-100 text-xs font-bold text-warm-500">
                            {(member.user.firstName?.[0] || member.user.email[0]).toUpperCase()}
                            {(member.user.lastName?.[0] || '').toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-semibold leading-tight text-charcoal-900 sm:text-sm">
                              {member.user.firstName || member.user.lastName
                                ? `${member.user.firstName} ${member.user.lastName}`.trim()
                                : 'Unnamed user'}
                            </p>
                            <p className="mt-0.5 truncate text-[11px] font-semibold text-warm-500">
                              {member.user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <div className="flex flex-wrap gap-1">
                          {member.user.userRoles.map((userRole) => (
                            <span key={userRole.id} className="rounded bg-sage-50 px-2 py-0.5 text-[10px] font-bold uppercase text-forest-700">
                              {userRole.role.name}
                            </span>
                          ))}
                          {member.user.userRoles.length === 0 && (
                            <span className="text-[11px] font-medium italic text-warm-400">No roles assigned</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-tight ${
                            member.status === 'ACTIVE'
                              ? 'bg-success-100 text-success-700'
                              : 'bg-danger-100 text-danger-700'
                          }`}
                        >
                          {member.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <p className="text-xs font-semibold text-warm-500">
                          {new Date(member.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="px-4 py-4 text-right sm:px-6">
                        {canSuspend ? (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => toggleMember(member)}
                              disabled={busyId === member.id}
                              className="flex h-9 w-9 items-center justify-center rounded-lg text-warm-400 transition-colors hover:bg-warm-50 hover:text-terracotta-600 disabled:opacity-50"
                              title={member.status === 'ACTIVE' ? 'Suspend membership' : 'Reactivate membership'}
                              aria-label={`${member.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'} ${member.user.email}`}
                            >
                              {busyId === member.id ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-warm-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : pendingInvitations.length === 0 ? (
          <EmptyState
            icon={<Send className="h-8 w-8" />}
            title="No pending invitations"
            description="Invitations you send appear here until they are accepted, revoked, or expire."
            actionButton={
              <Button onClick={() => setInviteOpen(true)} leftIcon={<UserPlus size={16} />}>
                Invite New User
              </Button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50">
                <tr>
                  {['Email', 'Role', 'Sent', 'Expires', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className={`px-4 py-3.5 text-[11px] font-bold uppercase tracking-wide text-warm-400 sm:px-6 ${
                        heading === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {pendingInvitations.map((invitation) => {
                  const expired = new Date(invitation.expiresAt) < new Date();
                  return (
                    <tr key={invitation.id}>
                      <td className="px-4 py-4 text-xs font-semibold text-charcoal-900 sm:px-6 sm:text-sm">
                        {invitation.email}
                      </td>
                      <td className="px-4 py-4 sm:px-6">
                        <span className="rounded bg-sage-50 px-2 py-0.5 text-[10px] font-bold uppercase text-forest-700">
                          {invitation.role.name}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-xs text-warm-500 sm:px-6">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-xs sm:px-6">
                        <span className={expired ? 'font-semibold text-danger-600' : 'text-warm-500'}>
                          {new Date(invitation.expiresAt).toLocaleDateString()}
                          {expired ? ' (expired)' : ''}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right sm:px-6">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => resendInvitation(invitation)}
                            disabled={busyId === invitation.id}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-warm-500 hover:bg-warm-50 hover:text-forest-700 disabled:opacity-50"
                            title="Renew and copy invitation link"
                            aria-label={`Resend invitation to ${invitation.email}`}
                          >
                            {busyId === invitation.id ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => revokeInvitation(invitation)}
                            disabled={busyId === invitation.id}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-warm-500 hover:bg-danger-50 hover:text-danger-600 disabled:opacity-50"
                            title="Revoke invitation"
                            aria-label={`Revoke invitation for ${invitation.email}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {inviteOpen && (
        <InviteModal
          roles={roleOptions}
          onClose={() => setInviteOpen(false)}
          onCreated={() => {
            load();
          }}
          onCopy={copy}
        />
      )}
    </div>
  );
}

function InviteModal({
  roles,
  onClose,
  onCreated,
  onCopy,
}: {
  roles: Role[];
  onClose: () => void;
  onCreated: () => void;
  onCopy: (text: string) => Promise<void>;
}) {
  const [email, setEmail] = useState('');
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (sending) return;
    if (!email.trim()) {
      setError('Enter the email address to invite.');
      return;
    }
    if (!roleId) {
      setError('Select a role for the invited user.');
      return;
    }
    setSending(true);
    setError('');
    try {
      const invitation = await apiFetch('/users/invitations', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim(), roleId }),
      });
      setResult(invitation);
      onCreated();
      showFeedback('SUCCESS', 'Invitation created.');
    } catch (err: any) {
      setError(err?.message || 'Could not create the invitation.');
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={result ? 'Invitation created' : 'Invite a new user'}
      footerActions={
        result ? (
          <>
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
            <Button onClick={() => onCopy(result.inviteLink)} leftIcon={<Copy size={16} />}>
              Copy invite link
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={onClose} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" form="invite-form" isLoading={sending} leftIcon={<Send size={16} />}>
              Send invitation
            </Button>
          </>
        )
      }
    >
      {result ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl bg-sage-50 p-4 text-sm text-forest-900">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">Invitation for {result.email}</p>
              <p className="mt-1 text-xs">
                Role: {result.role?.name}. Expires {new Date(result.expiresAt).toLocaleDateString()}.
              </p>
            </div>
          </div>
          {result.delivery && result.delivery.success === false && (
            <div className="flex items-start gap-2 rounded-xl border border-warning-200 bg-warning-50 p-3 text-xs text-warning-800">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                The invitation was saved, but the email could not be sent
                {result.delivery.error ? `: ${result.delivery.error}` : '.'} Copy the link below and
                share it directly.
              </span>
            </div>
          )}
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
              Invitation link
            </p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={result.inviteLink}
                className="min-w-0 flex-1 rounded-lg border border-warm-200 bg-ivory-50 px-3 py-2 font-mono text-xs text-charcoal-800"
                onFocus={(event) => event.currentTarget.select()}
              />
              <Button variant="outline" size="sm" onClick={() => onCopy(result.inviteLink)}>
                Copy
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <form id="invite-form" onSubmit={submit} className="space-y-4">
          {error && <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">{error}</p>}
          <Input
            label="Email address *"
            type="email"
            required
            placeholder="teacher@school.edu.gh"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <Select
            label="Role *"
            value={roleId}
            placeholder={roles.length ? 'Select role' : 'No roles configured for this school'}
            disabled={roles.length === 0}
            options={roles.map((role) => ({ value: role.id, label: role.name }))}
            onChange={(event) => setRoleId(event.target.value)}
          />
          <p className="text-xs text-warm-500">
            The invited person sets their own password and is linked to this school with the selected
            role.
          </p>
        </form>
      )}
    </Modal>
  );
}
