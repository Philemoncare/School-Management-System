'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  Bell,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  History,
  Loader2,
  Plane,
  Settings,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';

type StaffProfile = {
  id: string;
  firstName: string;
  lastName: string;
  employeeId?: string | null;
  designation?: string | null;
  status?: string;
  department?: { name: string } | null;
  position?: { title: string } | null;
};

type LeaveBalance = {
  id: string;
  entitledDays: number;
  usedDays: number;
  pendingDays: number;
  leaveType: { id: string; name: string };
};

type LeaveRequest = {
  id: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
  reason: string;
  leaveType: { name: string };
};

type Schedule = {
  id: string;
  workingDays: number[];
  startTime: string;
  endTime: string;
  location?: string | null;
  shift?: string | null;
};

type Notification = {
  id: string;
  title: string;
  content: string;
  notificationType: string;
  createdAt: string;
  readAt?: string | null;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function StaffSelfServiceDashboard() {
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ leaveTypeId: '', startDate: '', endDate: '', reason: '' });

  useEffect(() => {
    Promise.all([
      apiFetch('/staff/me'),
      apiFetch('/hr/me/leave-balances'),
      apiFetch('/hr/me/leave'),
      apiFetch('/hr/me/schedule'),
      apiFetch('/notifications'),
      apiFetch('/hr/leave/types'),
    ])
      .then(([staff, balanceData, requestData, scheduleData, notificationData, typeData]) => {
        setProfile(staff);
        setBalances(balanceData);
        setRequests(requestData);
        setSchedule(scheduleData[0] || null);
        setNotifications(notificationData);
        setLeaveTypes(typeData);
        if (typeData.length > 0) {
          setForm((current) => ({ ...current, leaveTypeId: typeData[0].id }));
        }
      })
      .catch((err) => setError(err.message || 'Unable to load your staff dashboard.'))
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = useMemo(() => notifications.filter((item) => !item.readAt).length, [notifications]);

  async function submitLeave(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    if (!form.leaveTypeId || !form.startDate || !form.endDate || !form.reason.trim()) {
      setFormError('Leave type, start date, end date and reason are required.');
      return;
    }
    if (form.endDate < form.startDate) {
      setFormError('The end date must be on or after the start date.');
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiFetch('/hr/leave/requests', {
        method: 'POST',
        body: JSON.stringify({
          leaveTypeId: form.leaveTypeId,
          startDate: new Date(form.startDate).toISOString(),
          endDate: new Date(form.endDate).toISOString(),
          reason: form.reason.trim(),
        }),
      });
      setRequests((current) => [created, ...current]);
      setShowLeaveForm(false);
      setForm((current) => ({ ...current, startDate: '', endDate: '', reason: '' }));
    } catch (err: any) {
      setFormError(err.message || 'Your leave request could not be submitted.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-12 sm:p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={40} /></div>;

  if (error) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-5 text-danger-700">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-charcoal-900 rounded-xl p-6 sm:p-8 lg:p-10 text-white gap-4">
        <div className="max-w-xl">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight">Good day, <span className="text-sage-400">{profile.firstName}</span>.</h1>
          <p className="text-warm-400 font-bold mt-1.5 uppercase tracking-wider text-[11px] sm:text-xs">Workforce Self-Service & Employee Portal</p>
        </div>
        <div className="flex gap-2 sm:gap-3 shrink-0">
          <Link href="/communications" className="relative p-2.5 sm:p-3 bg-card/10 border border-white/10 rounded-xl hover:bg-card/20 transition-all text-white" aria-label="Notifications">
            <Bell size={18} />
            {unreadCount > 0 && <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-terracotta-500 text-[10px] font-bold flex items-center justify-center px-1">{unreadCount}</span>}
          </Link>
          <Link href="/settings" className="p-2.5 sm:p-3 bg-card/10 border border-white/10 rounded-xl hover:bg-card/20 transition-all text-white" aria-label="Settings"><Settings size={18} /></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 space-y-6 sm:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Leave Balance</h3>
                <button onClick={() => setShowLeaveForm(true)} className="text-[11px] font-bold text-primary uppercase tracking-wider flex items-center gap-1 hover:underline">
                  Request <Plane size={12} />
                </button>
              </div>
              {balances.length === 0 ? (
                <p className="text-sm font-medium text-muted-foreground">No leave balances have been assigned to you.</p>
              ) : (
                <div className="space-y-4">
                  {balances.slice(0, 3).map((balance) => {
                    const remaining = Math.max(0, balance.entitledDays - balance.usedDays - balance.pendingDays);
                    const percentage = balance.entitledDays > 0 ? Math.min(100, (balance.usedDays / balance.entitledDays) * 100) : 0;
                    return (
                      <div key={balance.id} className="space-y-1.5">
                        <div className="flex justify-between items-end gap-3">
                          <p className="text-xs font-bold text-foreground">{balance.leaveType.name}</p>
                          <p className="text-[11px] font-bold text-muted-foreground">{remaining} / {balance.entitledDays} days left</p>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-forest-700" style={{ width: `${percentage}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Work Schedule</h3>
              </div>
              {!schedule ? (
                <p className="text-sm font-medium text-muted-foreground">No work schedule has been assigned.</p>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Working days</p>
                    <p className="text-sm font-bold text-foreground mt-1">{schedule.workingDays.map((day) => DAYS[day] || day).join(', ')}</p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-muted-foreground">Hours</span>
                    <span className="font-bold text-foreground">{schedule.startTime} - {schedule.endTime}</span>
                  </div>
                  {schedule.location && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Location</span>
                      <span className="font-bold text-foreground">{schedule.location}</span>
                    </div>
                  )}
                </div>
              )}
            </section>
          </div>

          <section className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">Recent Leave Requests</h3>
              <button onClick={() => setShowLeaveForm(true)} className="text-[11px] font-bold text-primary uppercase tracking-wider hover:underline">New request</button>
            </div>
            {requests.length === 0 ? (
              <p className="text-sm font-medium text-muted-foreground">You have not submitted any leave requests.</p>
            ) : (
              <div className="space-y-3">
                {requests.slice(0, 4).map((request) => (
                  <div key={request.id} className="flex items-start gap-3.5 p-3.5 bg-muted/40 rounded-xl border border-border/50">
                    <div className="p-2.5 rounded-xl shrink-0 bg-sage-50 text-forest-700"><History size={18} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{request.leaveType.name}</p>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5">{new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()} ({request.totalDays} days)</p>
                    </div>
                    <StatusBadge status={request.status} />
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight mb-6">Recent Notifications</h3>
            {notifications.length === 0 ? (
              <p className="text-sm font-medium text-muted-foreground">No notifications yet.</p>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 4).map((notification) => (
                  <div key={notification.id} className="flex items-start gap-3.5 p-3.5 bg-muted/40 rounded-xl border border-border/50">
                    <div className="p-2.5 rounded-xl shrink-0 bg-sage-50 text-forest-700"><Bell size={18} /></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground">{notification.title}</p>
                      <p className="text-[11px] text-muted-foreground font-medium mt-0.5 leading-snug line-clamp-2">{notification.content}</p>
                    </div>
                    <p className="text-[10px] font-semibold text-muted-foreground shrink-0">{new Date(notification.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-6 sm:space-y-8">
          <section className="bg-card border border-border rounded-xl p-5 sm:p-6 shadow-sm">
            <h3 className="text-base font-bold text-foreground mb-4 tracking-tight">Employee Quick Links</h3>
            <div className="space-y-2.5">
              <SidebarLink label="My Digital Profile" icon={<User size={18} />} href="/staff/profile" />
              <SidebarLink label="Attendance History" icon={<Clock size={18} />} href="/dashboard/attendance/history" />
              <SidebarLink label="Communication Hub" icon={<FileText size={18} />} href="/communications" />
              <SidebarLink label="Account Settings" icon={<Settings size={18} />} href="/settings" />
            </div>
          </section>

          <div className="bg-forest-700 rounded-xl p-5 sm:p-6 shadow-lg text-white">
            <h3 className="text-base font-bold mb-1.5 flex items-center gap-2"><Briefcase size={18} className="shrink-0" /> Employment Status</h3>
            <p className="text-sage-100 text-xs font-medium leading-relaxed opacity-90">
              {profile.status || 'ACTIVE'} employee{profile.employeeId ? ` - ${profile.employeeId}` : ''}.
              {profile.department?.name ? ` Department: ${profile.department.name}.` : ''}
              {profile.position?.title ? ` Position: ${profile.position.title}.` : ''}
            </p>
          </div>
        </div>
      </div>

      {showLeaveForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-charcoal-900">Request Leave</h2>
              <button type="button" onClick={() => { setShowLeaveForm(false); setFormError(''); }} className="p-2 rounded-lg text-warm-400 hover:bg-ivory-50"><X size={20} /></button>
            </div>
            <form onSubmit={submitLeave} className="space-y-5">
              {formError && (
                <div className="flex items-start gap-2 rounded-lg border border-danger-200 bg-danger-50 p-3 text-danger-700">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold">{formError}</p>
                </div>
              )}
              <div>
                <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Leave type</label>
                <Select value={form.leaveTypeId} onChange={(event) => setForm({ ...form, leaveTypeId: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium">
                  {leaveTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Start date</label>
                  <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">End date</label>
                  <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Reason</label>
                <textarea value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} rows={4} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none resize-none" placeholder="Provide a brief reason for this request" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowLeaveForm(false)} className="px-5 py-2.5 rounded-lg text-sm font-semibold text-warm-600 hover:bg-ivory-50">Cancel</button>
                <button type="submit" disabled={submitting} className="px-5 py-2.5 rounded-lg bg-forest-700 text-white text-sm font-semibold hover:bg-forest-800 disabled:opacity-60 flex items-center gap-2">
                  {submitting ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />} Submit request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    APPROVED: 'bg-success-50 text-success-700',
    PENDING_APPROVAL: 'bg-warning-50 text-warning-700',
    REJECTED: 'bg-danger-50 text-danger-700',
    CANCELLED: 'bg-warm-100 text-warm-600',
  };
  return <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${styles[status] || 'bg-warm-100 text-warm-600'}`}>{status.replace(/_/g, ' ')}</span>;
}

function SidebarLink({ label, icon, href }: { label: string; icon: React.ReactNode; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all group">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-muted-foreground group-hover:text-primary-foreground transition-colors shrink-0">{icon}</div>
        <span className="text-xs font-bold tracking-tight truncate">{label}</span>
      </div>
      <ChevronRight size={14} className="text-muted-foreground group-hover:text-primary-foreground/70 shrink-0 ml-2" />
    </Link>
  );
}
