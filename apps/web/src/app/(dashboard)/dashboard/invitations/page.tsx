'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  UserPlus,
  X,
  Clock as ClockIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const STATUS_STYLES: Record<string, string> = {
  PENDING: 'bg-warm-100 text-warm-700',
  ACCEPTED: 'bg-success-100 text-success-800',
  EXPIRED: 'bg-muted-100 text-muted-500',
  REVOKED: 'bg-danger-100 text-danger-700',
};

type Invitation = {
  id: string;
  email: string;
  status: string;
  expiresAt: string;
  createdAt: string;
  role: { id: string; name: string };
  school: { name: string };
  invitedBy?: { firstName: string; lastName: string };
};

type Role = {
  id: string;
  name: string;
  description?: string;
};

export default function InvitationsPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [
    user,
    activeSchoolId,
  ]);
  const canManage = roles.some((r) =>
    ['SCHOOL_ADMIN', 'PRINCIPAL'].includes(r),
  );

  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [rolesList, setRolesList] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    roleId: '',
    roleName: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [invitesData, rolesData] = await Promise.all([
        apiFetch('/users/invitations'),
        apiFetch('/users/invitations/roles'),
      ]);
      setInvitations(Array.isArray(invitesData) ? invitesData : []);
      setRolesList(Array.isArray(rolesData) ? rolesData : []);
    } catch (err: any) {
      setError(err.message || 'Unable to load invitations');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body: any = {
        email: inviteForm.email.trim(),
      };
      if (inviteForm.roleId) {
        body.roleId = inviteForm.roleId;
      } else if (inviteForm.roleName) {
        body.roleName = inviteForm.roleName;
      }
      await apiFetch('/users/invitations', {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setShowInviteModal(false);
      setInviteForm({ email: '', roleId: '', roleName: '' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to send invitation');
    } finally {
      setSaving(false);
    }
  };

  const handleResend = async (id: string) => {
    setError('');
    try {
      await apiFetch(`/users/invitations/${id}/resend`, { method: 'POST' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to resend invitation');
    }
  };

  const handleRevoke = async (id: string) => {
    if (!window.confirm('Are you sure you want to revoke this invitation?')) return;
    setError('');
    try {
      await apiFetch(`/users/invitations/${id}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to revoke invitation');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory-50">
        <Loader2 className="animate-spin text-forest-700" size={34} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
          <h2 className="text-lg font-bold text-danger-800 mb-2">Unable to load invitations</h2>
          <p className="text-danger-700 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  const pendingInvites = invitations.filter((i) => i.status === 'PENDING');
  const acceptedInvites = invitations.filter((i) => i.status === 'ACCEPTED');

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            Teacher Invitations
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Invite teachers and staff to join your school workspace.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowInviteModal(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
            className="shadow-xs"
          >
            Invite Teacher
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Invitations"
          value={invitations.length}
          icon={<UserPlus className="w-5 h-5" />}
          color="bg-sage-50"
        />
        <StatCard
          title="Pending"
          value={pendingInvites.length}
          icon={<ClockIcon className="w-5 h-5" />}
          color="bg-warm-50"
        />
        <StatCard
          title="Accepted"
          value={acceptedInvites.length}
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="bg-success-50"
        />
      </div>

      <Separator />

      {/* Invitations List */}
      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <table className="min-w-full divide-y divide-warm-200">
          <thead className="bg-ivory-50">
            <tr>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Email</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Role</th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Status</th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Expires</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {invitations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-xs font-semibold text-warm-400">
                  No invitations found.
                </td>
              </tr>
            )}
            {invitations.map((inv) => (
              <tr key={inv.id} className="hover:bg-ivory-50">
                <td className="px-5 py-4">
                  <div className="text-sm font-medium text-charcoal-900">{inv.email}</div>
                  <p className="text-[10px] text-warm-500">
                    Invited by {inv.invitedBy?.firstName || 'Admin'} {inv.invitedBy?.lastName || ''}
                  </p>
                </td>
                <td className="px-5 py-4 text-sm text-charcoal-900">{inv.role.name}</td>
                <td className="px-5 py-4 text-center">
                  <Badge
                    variant={STATUS_STYLES[inv.status] ? 'default' : 'secondary'}
                    className={`text-[10px] font-bold ${STATUS_STYLES[inv.status] || ''}`}
                  >
                    {inv.status}
                  </Badge>
                </td>
                <td className="px-5 py-4 text-center text-xs font-medium text-charcoal-900">
                  {new Date(inv.expiresAt).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right text-[10px]">
                  {inv.status === 'PENDING' && canManage && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResend(inv.id)}
                        disabled={saving}
                      >
                        <ClockIcon className="w-3 h-3" /> Resend
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRevoke(inv.id)}
                        disabled={saving}
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      <Modal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        title="Invite Teacher"
        footerActions={
          <>
            <Button variant="outline" onClick={() => setShowInviteModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} isLoading={saving} leftIcon={<Mail className="w-4 h-4" />}>
              Send Invitation
            </Button>
          </>
        }
      >
        <form onSubmit={handleInvite} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">
              {error}
            </div>
          )}
          <Input
            label="Email Address *"
            type="email"
            value={inviteForm.email}
            onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
            placeholder="teacher@school.edu"
            leftIcon={<Mail className="w-4 h-4" />}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Select Role"
              value={inviteForm.roleId}
              onChange={(e) => {
                setInviteForm({
                  ...inviteForm,
                  roleId: e.target.value,
                  roleName: '',
                });
              }}
              className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none focus:ring-2 focus:ring-forest-700"
            >
              <option value="">Select an existing role...</option>
              {rolesList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </Select>
            <Input
              label="Or Enter Role Name"
              value={inviteForm.roleName}
              onChange={(e) =>
                setInviteForm({ ...inviteForm, roleName: e.target.value, roleId: '' })
              }
              placeholder="e.g. TEACHER"
            />
          </div>
          <p className="text-[10px] text-warm-500">
            The invited teacher will receive an email with a secure link to activate their
            account and set their password. The invitation expires in 7 days.
          </p>
        </form>
      </Modal>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-baseline gap-1">
          <span className="text-3xl sm:text-4xl font-bold text-charcoal-900">
            {value}
          </span>
        </div>
        <p className="mt-2 text-xs font-semibold text-warm-400 uppercase tracking-wider">
          {title}
        </p>
      </CardContent>
    </Card>
  );
}
