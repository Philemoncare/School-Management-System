'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  FileText,
  Search,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { EmptyState } from '@/components/ui/empty-state';
import { Modal } from '@/components/ui/modal';

interface LeaveRequest {
  id: string;
  status: string;
  reason: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  comments?: string | null;
  leaveType?: { name: string } | null;
  staff?: { firstName: string; lastName: string; employeeId?: string | null } | null;
  teacher?: { firstName: string; lastName: string; employeeId?: string | null } | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING_APPROVAL: 'bg-warning-100 text-warning-800',
  APPROVED: 'bg-success-100 text-success-800',
  REJECTED: 'bg-danger-100 text-danger-800',
  CANCELLED: 'bg-warm-100 text-warm-700',
  WITHDRAWN: 'bg-warm-100 text-warm-700',
};

export default function LeaveManagement() {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL');
  const [rejecting, setRejecting] = useState<LeaveRequest | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  async function loadRequests() {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch('/hr/leave/requests');
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load leave requests.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const employeeOf = (request: LeaveRequest) => request.staff || request.teacher;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return requests.filter((request) => {
      if (statusFilter !== 'ALL' && request.status !== statusFilter) return false;
      if (!term) return true;
      const employee = employeeOf(request);
      return (
        `${employee?.firstName || ''} ${employee?.lastName || ''}`.toLowerCase().includes(term) ||
        (employee?.employeeId || '').toLowerCase().includes(term) ||
        (request.leaveType?.name || '').toLowerCase().includes(term) ||
        (request.reason || '').toLowerCase().includes(term)
      );
    });
  }, [requests, search, statusFilter]);

  const pending = requests.filter((request) => request.status === 'PENDING_APPROVAL').length;
  const approved = requests.filter((request) => request.status === 'APPROVED').length;
  const today = new Date();
  const activeAbsences = requests.filter(
    (request) =>
      request.status === 'APPROVED' &&
      new Date(request.startDate) <= today &&
      new Date(request.endDate) >= today,
  ).length;

  async function handleApprove(request: LeaveRequest) {
    setProcessing(request.id);
    setFeedback(null);
    try {
      await apiFetch(`/hr/leave/requests/${request.id}/approve`, { method: 'POST' });
      setFeedback({ type: 'success', text: `Leave approved for ${employeeOf(request)?.firstName || 'the employee'}.` });
      await loadRequests();
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Could not approve the request.' });
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject() {
    if (!rejecting) return;
    setProcessing(rejecting.id);
    setFeedback(null);
    try {
      await apiFetch(`/hr/leave/requests/${rejecting.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ comments: rejectComment.trim() || undefined }),
      });
      setFeedback({ type: 'success', text: 'Leave request rejected.' });
      setRejecting(null);
      setRejectComment('');
      await loadRequests();
    } catch (err) {
      setFeedback({ type: 'error', text: err instanceof Error ? err.message : 'Could not reject the request.' });
    } finally {
      setProcessing(null);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Leave Management"
        description="Review, authorise and audit employee absence requests for your school."
        actions={
          <Button variant="outline" size="sm" onClick={loadRequests} isLoading={loading} leftIcon={<RefreshCw size={15} />}>
            Refresh
          </Button>
        }
      />

      {feedback && (
        <div
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'success'
              ? 'border-success-200 bg-success-50 text-success-800'
              : 'border-danger-200 bg-danger-50 text-danger-800'
          }`}
        >
          {feedback.text}
        </div>
      )}

      {loadError && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{loadError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Pending Approval" value={pending} tone="bg-warning-50 text-warning-700" icon={<Clock size={20} />} />
        <StatCard label="Approved" value={approved} tone="bg-success-50 text-success-700" icon={<CheckCircle size={20} />} />
        <StatCard label="Active Absences Today" value={activeAbsences} tone="bg-sage-50 text-forest-700" icon={<Calendar size={20} />} />
      </div>

      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-warm-100 bg-ivory-50/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900">
            {statusFilter === 'ALL' ? 'All Requests' : 'Absence Requests'}
          </h2>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              aria-label="Search leave requests"
              placeholder="Search employee or reason"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search size={15} />}
              className="h-10 min-h-[40px] sm:w-60"
            />
            <Select
              aria-label="Filter by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'PENDING_APPROVAL', label: 'Pending approval' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
                { value: 'ALL', label: 'All statuses' },
              ]}
              className="h-10 min-h-[40px] sm:w-44"
            />
          </div>
        </div>

        <div className="relative min-h-[240px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="No leave requests found"
                description={
                  requests.length === 0
                    ? 'When staff submit leave requests they will appear here for approval.'
                    : 'No requests match your current search or status filter.'
                }
                icon={<FileText className="h-8 w-8" />}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200">
                <thead className="bg-ivory-50/50">
                  <tr>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-500 sm:px-6">Employee</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-500 sm:px-6">Type &amp; Duration</th>
                    <th className="hidden px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-500 lg:table-cell sm:px-6">Reason</th>
                    <th className="px-4 py-3.5 text-left text-[11px] font-semibold uppercase tracking-wide text-warm-500 sm:px-6">Status</th>
                    <th className="px-4 py-3.5 text-right text-[11px] font-semibold uppercase tracking-wide text-warm-500 sm:px-6">Decision</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 bg-card">
                  {filtered.map((request) => {
                    const employee = employeeOf(request);
                    const isProcessing = processing === request.id;
                    return (
                      <tr key={request.id} className="align-top transition-colors hover:bg-ivory-50/50">
                        <td className="px-4 py-4 sm:px-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warm-100 text-[11px] font-semibold text-warm-500">
                              {(employee?.firstName?.[0] || '?')}
                              {(employee?.lastName?.[0] || '')}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-xs font-semibold text-charcoal-900">
                                {employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown employee'}
                              </p>
                              <p className="text-[11px] font-bold uppercase tracking-tight text-warm-400">
                                {employee?.employeeId || 'No staff ID'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <p className="text-xs font-bold text-warm-700">{request.leaveType?.name || 'Leave'}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[11px] font-semibold uppercase text-forest-700">
                            {new Date(request.startDate).toLocaleDateString()}
                            <ArrowRight size={10} />
                            {new Date(request.endDate).toLocaleDateString()} ({request.totalDays} day{request.totalDays === 1 ? '' : 's'})
                          </p>
                        </td>
                        <td className="hidden max-w-[220px] px-4 py-4 lg:table-cell sm:px-6">
                          <p className="line-clamp-2 text-[11px] text-warm-600">{request.reason}</p>
                        </td>
                        <td className="px-4 py-4 sm:px-6">
                          <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase ${STATUS_STYLES[request.status] || 'bg-warm-100 text-warm-500'}`}>
                            {request.status.replace(/_/g, ' ')}
                          </span>
                          {request.comments && request.status === 'REJECTED' && (
                            <p className="mt-1 line-clamp-2 text-[11px] text-warm-500">{request.comments}</p>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right sm:px-6">
                          {request.status === 'PENDING_APPROVAL' ? (
                            <div className="flex flex-col items-end justify-end gap-2 sm:flex-row">
                              <Button
                                size="xs"
                                variant="outline"
                                disabled={!!processing}
                                isLoading={isProcessing}
                                leftIcon={<XCircle size={14} />}
                                onClick={() => {
                                  setRejecting(request);
                                  setRejectComment('');
                                }}
                              >
                                Reject
                              </Button>
                              <Button
                                size="xs"
                                variant="success"
                                disabled={!!processing}
                                isLoading={isProcessing}
                                leftIcon={<CheckCircle size={14} />}
                                onClick={() => handleApprove(request)}
                              >
                                Approve
                              </Button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-warm-400">Closed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={!!rejecting}
        onClose={() => {
          if (!processing) {
            setRejecting(null);
            setRejectComment('');
          }
        }}
        title="Reject leave request"
        size="sm"
        footerActions={
          <>
            <Button variant="ghost" size="sm" onClick={() => setRejecting(null)} disabled={!!processing}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleReject} isLoading={!!processing} leftIcon={<XCircle size={15} />}>
              Reject Request
            </Button>
          </>
        }
      >
        <p className="text-xs text-warm-600">
          {rejecting && employeeOf(rejecting)
            ? `Reject ${employeeOf(rejecting)?.firstName} ${employeeOf(rejecting)?.lastName}'s request. The reserved leave days will be released.`
            : 'Reject this leave request. The reserved leave days will be released.'}
        </p>
        <div className="space-y-1.5">
          <label htmlFor="reject-comment" className="ml-0.5 text-[11px] font-semibold text-warm-600 sm:text-xs">
            Reason (optional)
          </label>
          <Textarea
            id="reject-comment"
            placeholder="Explain why this request cannot be approved"
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            rows={3}
          />
        </div>
      </Modal>
    </div>
  );
}

function StatCard({ label, value, tone, icon }: { label: string; value: number; tone: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-warm-200 bg-card p-5 shadow-sm">
      <div>
        <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-warm-500">{label}</p>
        <p className="text-2xl font-semibold text-charcoal-900">{value}</p>
      </div>
      <div className={`rounded-2xl p-3.5 ${tone}`}>{icon}</div>
    </div>
  );
}
