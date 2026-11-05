'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import {
  Activity,
  ClipboardList,
  Loader2,
  Plus,
  RefreshCw,
  Search,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Menu,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-sage-100 text-forest-800',
  MEDIUM: 'bg-warm-100 text-warm-700',
  HIGH: 'bg-terracotta-100 text-terracotta-700',
  URGENT: 'bg-danger-100 text-danger-700',
};

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

const CATEGORY_OPTIONS = [
  'Student Registration',
  'Attendance Management',
  'Examination Preparation',
  'Marks Entry',
  'Lesson Preparation',
  'Class Supervision',
  'Report Submission',
  'Parent Communication',
  'Administrative Duties',
  'Other',
];

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

type TaskStats = {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  overdue: number;
  submittedForReview: number;
  returnedForRevision: number;
  cancelled: number;
};

export default function TeacherTasksPage() {
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [
    user,
    activeSchoolId,
  ]);
  const canManage = roles.some(
    (r) => ['SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER'].includes(r),
  );

  const [tasks, setTasks] = useState<TeacherTask[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editTask, setEditTask] = useState<TeacherTask | null>(null);
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: 'Administrative Duties',
    priority: 'MEDIUM',
    instructions: '',
    assignedToId: '',
    classId: '',
    sectionId: '',
    subjectId: '',
    startDate: '',
    dueDate: '',
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (filterStatus) params.set('status', filterStatus);
      if (filterPriority) params.set('priority', filterPriority);
      if (filterAssignee) params.set('assignedToId', filterAssignee);

      const [tasksData, statsData, teachersData] = await Promise.all([
        apiFetch(`/teacher-tasks?${params.toString()}`),
        apiFetch('/teacher-tasks/stats'),
        apiFetch('/teachers?limit=100'),
      ]);
      setTasks(Array.isArray(tasksData?.items) ? tasksData.items : []);
      setStats(statsData);
      setTeachers(Array.isArray(teachersData?.items) ? teachersData.items : []);
    } catch (err: any) {
      setError(err.message || 'Unable to load tasks');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, filterPriority, filterAssignee]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.assignedTo.firstName.toLowerCase().includes(search.toLowerCase()) ||
        t.assignedTo.lastName.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [tasks, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch('/teacher-tasks', {
        method: 'POST',
        body: JSON.stringify({
          ...createForm,
          classId: createForm.classId || undefined,
          sectionId: createForm.sectionId || undefined,
          subjectId: createForm.subjectId || undefined,
        }),
      });
      setShowCreateModal(false);
      setCreateForm({
        title: '',
        description: '',
        category: 'Administrative Duties',
        priority: 'MEDIUM',
        instructions: '',
        assignedToId: '',
        classId: '',
        sectionId: '',
        subjectId: '',
        startDate: '',
        dueDate: '',
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to create task');
    }
  };

  const handleUpdateStatus = async (
    taskId: string,
    status: string,
  ) => {
    setError('');
    try {
      await apiFetch(`/teacher-tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to update task');
    }
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setError('');
    try {
      await apiFetch(`/teacher-tasks/${taskId}`, { method: 'DELETE' });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to delete task');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory-50">
        <Loader2 className="animate-spin text-forest-700" size={34} />
      </div>
    );
  }

  const isOverdue = (task: TeacherTask) =>
    !['COMPLETED', 'CANCELLED'].includes(task.status) &&
    new Date(task.dueDate) < new Date();

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            Task Management
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Assign and monitor tasks for teachers and staff.
          </p>
        </div>
        {canManage && (
          <Button
            onClick={() => setShowCreateModal(true)}
            leftIcon={<Plus size={16} />}
            className="shadow-xs"
          >
            Create Task
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Tasks"
            value={stats.total}
            icon={<ClipboardList className="w-5 h-5" />}
            color="bg-sage-50"
          />
          <StatCard
            title="Pending"
            value={stats.pending}
            icon={<Clock className="w-5 h-5" />}
            color="bg-warm-50"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={<Activity className="w-5 h-5" />}
            color="bg-terracotta-50"
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="bg-success-50"
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-end">
        <div className="flex-1 sm:w-64">
          <Input
            placeholder="Search tasks by title, description, or assignee..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search size={16} />}
          />
        </div>
        <div className="flex-1 sm:w-48">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none focus:ring-2 focus:ring-forest-700"
          >
            <option value="">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="SUBMITTED_FOR_REVIEW">Submitted for Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="RETURNED_FOR_REVISION">Returned for Revision</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="flex-1 sm:w-48">
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none focus:ring-2 focus:ring-forest-700"
          >
            <option value="">All Assignees</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.firstName} {t.lastName}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={loadData} leftIcon={<RefreshCw size={14} />}>Refresh</Button>
      </div>

      <Separator />

      {/* Tasks List */}
      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <table className="min-w-full divide-y divide-warm-200">
          <thead className="bg-ivory-50">
            <tr>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Task</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Assigned To</th>
              <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Category</th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Priority</th>
              <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Status</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Due Date</th>
              <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-xs font-semibold text-warm-400">
                  No tasks found.
                </td>
              </tr>
            )}
            {filtered.map((task) => {
              const overdue = isOverdue(task);
              return (
                <tr
                  key={task.id}
                  className={`hover:bg-ivory-50 transition-colors ${
                    overdue ? 'bg-danger-50/50' : ''
                  }`}
                >
                  <td className="px-5 py-4">
                    <div className="text-xs font-semibold text-charcoal-900 truncate max-w-xs">
                      {task.title}
                    </div>
                    {task.description && (
                      <p className="text-[10px] text-warm-500 truncate max-w-xs mt-0.5">
                        {task.description}
                      </p>
                    )}
                    <p className="text-[10px] text-warm-400 mt-1">
                      By {task.assignedBy.firstName} {task.assignedBy.lastName}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="text-xs font-medium text-charcoal-900">
                      {task.assignedTo.firstName} {task.assignedTo.lastName}
                    </div>
                    <p className="text-[10px] text-warm-500">
                      {task.assignedTo.email}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-charcoal-800">
                    {task.category}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge
                      variant={
                        PRIORITY_STYLES[task.priority]
                          ? 'default'
                          : 'secondary'
                      }
                      className={`text-[10px] font-bold ${PRIORITY_STYLES[task.priority] || ''}`}
                    >
                      {task.priority}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge
                      variant={
                        STATUS_STYLES[task.status]
                          ? 'default'
                          : 'secondary'
                      }
                      className={`text-[10px] font-bold ${STATUS_STYLES[task.status] || ''}`}
                    >
                      {task.status.replace('_', ' ')}
                    </Badge>
                    {overdue && (
                      <span className="text-[10px] font-bold text-danger-600 mt-1 block">
                        Overdue
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right text-xs font-medium text-charcoal-900">
                    {new Date(task.dueDate).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right text-[10px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        window.location.href = `/dashboard/tasks/${task.id}`
                      }
                    >
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                    {canManage && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(
                            task.id,
                            task.status === 'COMPLETED' ? 'CANCELLED' : 'COMPLETED',
                          )
                        }
                      >
                        {task.status === 'COMPLETED' ? 'Cancel' : 'Complete'}
                      </Button>
                    )}
                    {canManage && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(task.id)}
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </Button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        footerActions={
          <>
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              isLoading={false}
              leftIcon={<Plus size={15} />}
            >
              Create Task
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Task Title *"
              value={createForm.title}
              onChange={(e) =>
                setCreateForm({ ...createForm, title: e.target.value })
              }
              placeholder="e.g. Prepare Term 1 Exam Papers"
            />
            <Select
              label="Priority"
              value={createForm.priority}
              onChange={(e) =>
                setCreateForm({ ...createForm, priority: e.target.value })
              }
              className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none focus:ring-2 focus:ring-forest-700"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Category"
              value={createForm.category}
              onChange={(e) =>
                setCreateForm({ ...createForm, category: e.target.value })
              }
              className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none focus:ring-2 focus:ring-forest-700"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
            <Select
              label="Assign To *"
              value={createForm.assignedToId}
              onChange={(e) =>
                setCreateForm({ ...createForm, assignedToId: e.target.value })
              }
              className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none focus:ring-2 focus:ring-forest-700"
            >
              <option value="">Select a teacher...</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.firstName} {t.lastName} ({t.email})
                </option>
              ))}
            </Select>
          </div>
          <Input
            label="Instructions"
            value={createForm.instructions}
            onChange={(e) =>
              setCreateForm({ ...createForm, instructions: e.target.value })
            }
            rows={3}
            as="textarea"
            placeholder="Detailed instructions for the task..."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              type="date"
              label="Start Date"
              value={createForm.startDate}
              onChange={(e) =>
                setCreateForm({ ...createForm, startDate: e.target.value })
              }
              className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none focus:ring-2 focus:ring-forest-700"
            />
            <Input
              type="date"
              label="Due Date *"
              value={createForm.dueDate}
              onChange={(e) =>
                setCreateForm({ ...createForm, dueDate: e.target.value })
              }
              className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none focus:ring-2 focus:ring-forest-700"
            />
          </div>
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
