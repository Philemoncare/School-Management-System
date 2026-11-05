'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Loader2,
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Mail,
  Calendar,
  Users,
  Settings,
  FileText,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

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

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'bg-sage-100 text-forest-800',
  MEDIUM: 'bg-warm-100 text-warm-700',
  HIGH: 'bg-terracotta-100 text-terracotta-700',
  URGENT: 'bg-danger-100 text-danger-700',
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

export default function TaskDetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const taskId = Array.isArray(rawId) ? rawId[0] : rawId;
  const { user, activeSchoolId } = useAuth();
  const roles = useMemo(() => collectUserRoles(user, activeSchoolId), [
    user,
    activeSchoolId,
  ]);
  const canManage = roles.some(
    (r) => ['SCHOOL_ADMIN', 'PRINCIPAL', 'HR_OFFICER'].includes(r),
  );

  const [task, setTask] = useState<TeacherTask | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);

  const loadTask = useCallback(async () => {
    if (!taskId) return;
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/teacher-tasks/${taskId}`);
      setTask(data);
      setEditForm({
        title: data.title,
        description: data.description || '',
        category: data.category,
        priority: data.priority,
        status: data.status,
        instructions: data.instructions || '',
        classId: data.classId || '',
        sectionId: data.sectionId || '',
        subjectId: data.subjectId || '',
        startDate: data.startDate,
        dueDate: data.dueDate,
        completionNote: data.completionNote || '',
      });
    } catch (err: any) {
      setError(err.message || 'Unable to load task');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    loadTask();
  }, [loadTask]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await apiFetch(`/teacher-tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...editForm,
          classId: editForm.classId || undefined,
          sectionId: editForm.sectionId || undefined,
          subjectId: editForm.subjectId || undefined,
        }),
      });
      setEditMode(false);
      await loadTask();
    } catch (err: any) {
      setError(err.message || 'Unable to update task');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiFetch(`/teacher-tasks/${taskId}`, { method: 'DELETE' });
      window.location.href = '/dashboard/tasks';
    } catch (err: any) {
      setError(err.message || 'Unable to delete task');
    }
  };

  const isOverdue =
    task &&
    !['COMPLETED', 'CANCELLED'].includes(task.status) &&
    new Date(task.dueDate) < new Date();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory-50">
        <Loader2 className="animate-spin text-forest-700" size={34} />
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory-50">
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-6 py-4 text-sm font-semibold text-danger-700">
          {error || 'Task not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/dashboard/tasks">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={14} />}>
            Back to Tasks
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          {canManage && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditMode(!editMode)}
              leftIcon={<Settings className="w-4 h-4" />}
            >
              {editMode ? 'Cancel Edit' : 'Edit Task'}
            </Button>
          )}
          {canManage && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              leftIcon={<AlertTriangle className="w-4 h-4" />}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl font-bold text-charcoal-900">
                    {task.title}
                  </CardTitle>
                  <CardDescription className="mt-1 text-warm-500 text-sm">
                    {task.category}
                  </CardDescription>
                </div>
                <div className="flex items-end gap-2">
                  <Badge
                    variant={STATUS_STYLES[task.status] ? 'default' : 'secondary'}
                    className={`text-xs font-bold ${STATUS_STYLES[task.status] || ''}`}
                  >
                    {task.status.replace('_', ' ')}
                  </Badge>
                  {isOverdue && (
                    <Badge variant="destructive" className="text-xs font-bold">
                      Overdue
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {task.description && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase text-warm-500 mb-2">
                    Description
                  </p>
                  <p className="text-sm text-charcoal-800 whitespace-pre-wrap">
                    {task.description}
                  </p>
                </div>
              )}
              {task.instructions && (
                <div className="mb-6">
                  <p className="text-[10px] font-bold uppercase text-warm-500 mb-2">
                    Instructions
                  </p>
                  <div className="p-3 bg-ivory-50 rounded-lg border border-warm-100">
                    <p className="text-sm text-charcoal-800 whitespace-pre-wrap">
                      {task.instructions}
                    </p>
                  </div>
                </div>
              )}
              {task.completionNote && (
                <div className="mb-6 bg-success-50 border border-success-200 rounded-lg p-4">
                  <p className="text-[10px] font-bold uppercase text-success-700 mb-2">
                    Completion Note
                  </p>
                  <p className="text-sm text-charcoal-800 whitespace-pre-wrap">
                    {task.completionNote}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-warm-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  <span>
                    {task.assignedBy.firstName} {task.assignedBy.lastName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-3 h-3" />
                  <span>
                    Updated {new Date(task.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Class/Subject */}
          {(task.class || task.section || task.subject) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-charcoal-900">
                  Related Academic Context
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {task.class && (
                    <div className="p-3 rounded-lg border border-warm-100 bg-ivory-50/50">
                      <p className="text-[10px] font-bold uppercase text-warm-500">
                        Class
                      </p>
                      <p className="text-sm font-medium text-charcoal-900 mt-1">
                        {task.class.name} ({task.class.code})
                      </p>
                    </div>
                  )}
                  {task.section && (
                    <div className="p-3 rounded-lg border border-warm-100 bg-ivory-50/50">
                      <p className="text-[10px] font-bold uppercase text-warm-500">
                        Section
                      </p>
                      <p className="text-sm font-medium text-charcoal-900 mt-1">
                        {task.section.name} ({task.section.code})
                      </p>
                    </div>
                  )}
                  {task.subject && (
                    <div className="p-3 rounded-lg border border-warm-100 bg-ivory-50/50">
                      <p className="text-[10px] font-bold uppercase text-warm-500">
                        Subject
                      </p>
                      <p className="text-sm font-medium text-charcoal-900 mt-1">
                        {task.subject.name} ({task.subject.code})
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Assignee Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-charcoal-900">
                Assigned To
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-700">
                  <Users className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-charcoal-900">
                    {task.assignedTo.firstName} {task.assignedTo.lastName}
                  </p>
                  <p className="text-[10px] text-warm-500">
                    {task.assignedTo.email}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Status Actions (for admin) */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-charcoal-900">
                  Quick Status Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {[
                  ['ACKNOWLEDGED', 'Mark as Acknowledged'],
                  ['IN_PROGRESS', 'Mark as In Progress'],
                  ['SUBMITTED_FOR_REVIEW', 'Submit for Review'],
                  ['COMPLETED', 'Mark as Completed'],
                  ['RETURNED_FOR_REVISION', 'Return for Revision'],
                  ['CANCELLED', 'Cancel Task'],
                ].map(([status, label]) => (
                  <Button
                    key={status}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Mark this task as ${label.toLowerCase()}?`,
                        )
                      ) {
                        apiFetch(`/teacher-tasks/${taskId}`, {
                          method: 'PATCH',
                          body: JSON.stringify({ status }),
                        }).then(() => loadTask());
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full text-left text-xs"
                  >
                    {label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Edit Form */}
          {editMode && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-charcoal-900">
                  Edit Task
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <form onSubmit={handleUpdate} className="space-y-4">
                  {error && (
                    <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">
                      {error}
                    </div>
                  )}
                  <Input
                    label="Title *"
                    value={editForm.title}
                    onChange={(e) =>
                      setEditForm({ ...editForm, title: e.target.value })
                    }
                  />
                  <Input
                    label="Description"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={2}
                    as="textarea"
                  />
                  <Input
                    label="Instructions"
                    value={editForm.instructions}
                    onChange={(e) =>
                      setEditForm({ ...editForm, instructions: e.target.value })
                    }
                    rows={2}
                    as="textarea"
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <select
                      value={editForm.priority}
                      onChange={(e) =>
                        setEditForm({ ...editForm, priority: e.target.value })
                      }
                      className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="URGENT">Urgent</option>
                    </select>
                    <select
                      value={editForm.status}
                      onChange={(e) =>
                        setEditForm({ ...editForm, status: e.target.value })
                      }
                      className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm outline-none"
                    >
                      <option value="ASSIGNED">Assigned</option>
                      <option value="ACKNOWLEDGED">Acknowledged</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="SUBMITTED_FOR_REVIEW">
                        Submitted for Review
                      </option>
                      <option value="COMPLETED">Completed</option>
                      <option value="RETURNED_FOR_REVISION">
                        Returned for Revision
                      </option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      type="date"
                      label="Start Date"
                      value={editForm.startDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, startDate: e.target.value })
                      }
                    />
                    <Input
                      type="date"
                      label="Due Date"
                      value={editForm.dueDate}
                      onChange={(e) =>
                        setEditForm({ ...editForm, dueDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save Changes</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
