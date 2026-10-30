'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import {
  ClipboardList,
  Loader2,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Menu,
  Mail,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Modal } from '@/components/ui/modal';

const STATUS_STYLES: Record<string, string> = {
  ASSIGNED: 'bg-sage-100 text-forest-800',
  ACKNOWLEDGED: 'bg-warm-100 text-warm-700',
  IN_PROGRESS: 'bg-terracotta-100 text-terracotta-700',
  SUBMITTED_FOR_REVIEW: 'bg-purple-100 text-purple-700',
  COMPLETED: 'bg-success-100 text-success-800',
  RETURNED_FOR_REVISION: 'bg-warning-100 text-warning-700',
  OVERDUE: 'bg-danger-100 text-danger-700',
  CANCELLED: 'bg-muted-100 text-muted-500',
};

const STATUS_TRANSITIONS: Record<string, string[]> = {
  ASSIGNED: ['ACKNOWLEDGED', 'IN_PROGRESS'],
  ACKNOWLEDGED: ['IN_PROGRESS'],
  IN_PROGRESS: ['SUBMITTED_FOR_REVIEW'],
  SUBMITTED_FOR_REVIEW: [],
  RETURNED_FOR_REVISION: ['IN_PROGRESS'],
  COMPLETED: [],
  OVERDUE: ['IN_PROGRESS', 'COMPLETED'],
  CANCELLED: [],
};

type TeacherTask = {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  priority: string;
  status: string;
  instructions?: string | null;
  assignedById: string;
  assignedToId: string;
  classId?: string | null;
  sectionId?: string | null;
  subjectId?: string | null;
  startDate: string;
  dueDate: string;
  completedAt?: string | null;
  completionNote?: string | null;
  createdAt: string;
  updatedAt: string;
  assignedBy: { id: string; firstName: string; lastName: string; email: string };
  assignedTo: { id: string; firstName: string; lastName: string; email: string };
  class?: { id: string; name: string; code: string } | null;
  section?: { id: string; name: string; code: string } | null;
  subject?: { id: string; name: string; code: string } | null;
};

export default function TeacherTasksPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [
    user,
    activeSchoolId,
  ]);

  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<{
    taskId: string | null;
    status: string;
    completionNote: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/teacher-tasks?assignedToId=me');
      const items = Array.isArray(data?.items) ? data.items : [];
      setTasks(items);
    } catch (err: any) {
      // If assignedToId=me isn't supported, try without filter
      try {
        const data = await apiFetch('/teacher-tasks');
        const items = Array.isArray(data?.items) ? data.items : [];
        setTasks(items.filter((t: any) => t.assignedToId === user?.id));
      } catch (err2: any) {
        setError(err2.message || 'Unable to load tasks');
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isOverdue = (task: TeacherTask) =>
    !['COMPLETED', 'CANCELLED'].includes(task.status) &&
    new Date(task.dueDate) < new Date();

  const canTransition = (currentStatus: string, newStatus: string) =>
    STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;

  const handleStatusChange = async (taskId: string, status: string) => {
    setError('');
    try {
      await apiFetch(`/teacher-tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadData();
      setUpdateStatus(null);
    } catch (err: any) {
      setError(err.message || 'Unable to update task status');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory-50">
        <Loader2 className="animate-spin text-forest-700" size={34} />
      </div>
    );
  }

  const pendingTasks = tasks.filter(
    (t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED',
  );
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
  const overdueTasks = tasks.filter(isOverdue);

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            My Tasks
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Tasks assigned to you by school administration.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Assigned"
          value={tasks.length}
          icon={<ClipboardList className="w-5 h-5" />}
          color="bg-sage-50"
        />
        <StatCard
          title="Pending"
          value={pendingTasks.length}
          icon={<Clock className="w-5 h-5" />}
          color="bg-warm-50"
        />
        <StatCard
          title="Overdue"
          value={overdueTasks.length}
          icon={<AlertTriangle className="w-5 h-5" />}
          color="bg-danger-50"
        />
      </div>

      <Separator />

      {/* Pending Tasks */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-charcoal-900 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Pending & Active Tasks
        </h2>
        {pendingTasks.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="mx-auto text-warm-200 mb-4" size={48} />
              <p className="text-warm-400 font-semibold">All caught up!</p>
              <p className="text-xs text-warm-500 mt-1">
                No pending tasks. Great work staying on top of your responsibilities.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingTasks.map((task) => {
              const overdue = isOverdue(task);
              const transitions = STATUS_TRANSITIONS[task.status] ?? [];
              return (
                <TaskCard
                  key={task.id}
                  task={task}
                  overdue={overdue}
                  transitions={transitions}
                  onStatusChange={handleStatusChange}
                  onView={() => setOpenTaskId(task.id)}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Completed Tasks */}
      {completedTasks.length > 0 && (
        <div className="mt-8 space-y-4">
          <h2 className="text-lg font-semibold text-charcoal-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success-600" /> Completed
          </h2>
          <div className="space-y-3">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                overdue={false}
                transitions={[]}
                onStatusChange={handleStatusChange}
                onView={() => setOpenTaskId(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Task Detail Modal */}
      {openTaskId && (
        <TaskDetailModal
          task={tasks.find((t) => t.id === openTaskId)!}
          onClose={() => setOpenTaskId(null)}
        />
      )}
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

function TaskCard({
  task,
  overdue,
  transitions,
  onStatusChange,
  onView,
}: {
  task: TeacherTask;
  overdue: boolean;
  transitions: string[];
  onStatusChange: (taskId: string, status: string) => void;
  onView: () => void;
}) {
  const [statusDropdown, setStatusDropdown] = useState(false);
  const [completionNote, setCompletionNote] = useState('');

  const nextStatus = transitions.length > 0 ? transitions[0] : null;

  return (
    <Card className={`hover:shadow-md transition-all ${
      overdue ? 'border-danger-200 bg-danger-50/50' : ''
    }`}>
      <CardHeader className="flex flex-row items-center justify-between p-4">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-forest-100 flex items-center justify-center text-forest-700 shrink-0 mt-0.5">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-charcoal-900">
                {task.title}
              </h3>
              <p className="text-[10px] text-warm-500 mt-0.5">
                {task.category} &bull; Priority: {task.priority}
              </p>
              {task.description && (
                <p className="text-[10px] text-warm-400 line-clamp-2 mt-1 max-w-md">
                  {task.description}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <Badge
            variant={STATUS_STYLES[task.status] ? 'default' : 'secondary'}
            className={`text-[10px] font-bold ${STATUS_STYLES[task.status] || ''}`}
          >
            {task.status.replace('_', ' ')}
          </Badge>
          {overdue && (
            <Badge variant="destructive" className="text-[10px] font-bold">
              Overdue
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {task.instructions && (
          <div className="mb-4 p-3 bg-ivory-50 rounded-lg border border-warm-100">
            <p className="text-[10px] font-bold uppercase text-warm-500 mb-1">
              Instructions
            </p>
            <p className="text-sm text-charcoal-800">{task.instructions}</p>
          </div>
        )}
        <div className="flex items-center justify-between gap-4">
          <div className="text-xs text-warm-500">
            <div className="flex items-center gap-1 mb-1">
              <Mail className="w-3 h-3" />
              <span>{task.assignedBy.firstName} {task.assignedBy.lastName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                Due {new Date(task.dueDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onView}
              disabled={statusDropdown}
            >
              <ArrowRight className="w-3 h-3" /> View Details
            </Button>
            {nextStatus && !statusDropdown && (
              <Button
                size="sm"
                onClick={() => setStatusDropdown(true)}
                className="flex items-center gap-1"
              >
                {nextStatus.replace('_', ' ')}
                <Menu className="w-3 h-3 ml-1" />
              </Button>
            )}
          </div>
        </div>
        {statusDropdown && (
          <div className="mt-3 p-3 bg-ivory-50 rounded-lg border border-warm-200">
            <p className="text-[10px] font-bold uppercase text-warm-500 mb-2">
              Update Status
            </p>
            <div className="space-y-2">
              {transitions.map((status) => (
                <Button
                  key={status}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (status === 'SUBMITTED_FOR_REVIEW' || status === 'COMPLETED') {
                      setCompletionNote('');
                    }
                    handleStatusChange(task.id, status);
                  }}
                  className="w-full text-left text-xs"
                >
                  {status.replace('_', ' ')}
                </Button>
              ))}
              {completionNote && (
                <p className="text-[10px] text-success-700 mt-1">
                  Note saved for submission.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TaskDetailModal({
  task,
  onClose,
}: {
  task: TeacherTask;
  onClose: () => void;
}) {
  const [status, setStatus] = useState(task.status);
  const [completionNote, setCompletionNote] = useState(
    task.completionNote || '',
  );

  const transitions = STATUS_TRANSITIONS[task.status] ?? [];
  const isOverdue =
    !['COMPLETED', 'CANCELLED'].includes(task.status) &&
    new Date(task.dueDate) < new Date();

  const handleSubmit = async () => {
    try {
      await apiFetch(`/teacher-tasks/${task.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...(status !== task.status ? { status } : {}),
          ...(completionNote ? { completionNote } : {}),
        }),
      });
      onClose();
    } catch (err: any) {
      alert(err.message || 'Unable to update task');
    }
  };

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={`Task: ${task.title}`}
      size="lg"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {transitions.length > 0 && (
            <Button onClick={handleSubmit}>
              Update Task
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase text-warm-500">Task Title</p>
            <p className="text-lg font-semibold text-charcoal-900 mt-1">
              {task.title}
            </p>
          </div>
          <div className="flex items-end gap-2">
            <Badge
              variant={STATUS_STYLES[task.status] ? 'default' : 'secondary'}
              className={`text-[10px] font-bold ${STATUS_STYLES[task.status] || ''}`}
            >
              {task.status.replace('_', ' ')}
            </Badge>
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px] font-bold">
                Overdue
              </Badge>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase text-warm-500">Category</p>
            <p className="text-sm text-charcoal-800 mt-1">{task.category}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-warm-500">Priority</p>
            <p className="text-sm text-charcoal-800 mt-1">{task.priority}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-warm-500">Assigned By</p>
            <p className="text-sm text-charcoal-800 mt-1">
              {task.assignedBy.firstName} {task.assignedBy.lastName}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-warm-500">Due Date</p>
            <p className="text-sm text-charcoal-800 mt-1">
              {new Date(task.dueDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        {task.class && (
          <div className="bg-sage-50 border border-sage-100 rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase text-warm-500 mb-2">Related Class</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-charcoal-800">
                {task.class.name} ({task.class.code})
              </span>
              {task.section && (
                <span className="text-xs text-warm-500">• Section {task.section.name}</span>
              )}
              {task.subject && (
                <span className="text-xs text-warm-500">• {task.subject.name}</span>
              )}
            </div>
          </div>
        )}

        {task.instructions && (
          <div className="bg-ivory-50 border border-warm-100 rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase text-warm-500 mb-2">Instructions</p>
            <p className="text-sm text-charcoal-800 mt-1">{task.instructions}</p>
          </div>
        )}

        {task.completionNote && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase text-success-700 mb-2">Completion Note</p>
            <p className="text-sm text-charcoal-800 mt-1">{task.completionNote}</p>
          </div>
        )}

        {transitions.length > 0 && (
          <div className="bg-card border border-warm-200 rounded-lg p-4">
            <p className="text-[10px] font-bold uppercase text-warm-500 mb-3">Update Status</p>
            <div className="space-y-2">
              {transitions.map((nextStatus) => (
                <div key={nextStatus} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="taskStatus"
                    checked={status === nextStatus}
                    onChange={() => setStatus(nextStatus)}
                    className="w-4 h-4 text-forest-700"
                  />
                  <label className="text-sm text-charcoal-800 cursor-pointer">
                    {nextStatus.replace('_', ' ')}
                  </label>
                </div>
              ))}
              {status === 'SUBMITTED_FOR_REVIEW' || status === 'COMPLETED' ? (
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase text-warm-500 mb-1">Completion Note</p>
                  <textarea
                    value={completionNote}
                    onChange={(e) => setCompletionNote(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none focus:ring-2 focus:ring-forest-700"
                    placeholder="Add notes about your work on this task..."
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}

        <div className="text-xs text-warm-500 mt-4">
          <p className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Created: {new Date(task.createdAt).toLocaleString()}
          </p>
          <p className="flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Updated: {new Date(task.updatedAt).toLocaleString()}
          </p>
        </div>
      </div>
    </Modal>
  );
}
