'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { FileText, Loader2, Activity, User, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SchoolActivityPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      // Try school-level audit/activity endpoint
      const data = await apiFetch('/audit/school-activity');
      setActivities(Array.isArray(data) ? data : data.items || []);
    } catch (err: any) {
      // Fallback: try to get from audit logs
      try {
        const data = await apiFetch('/audit/logs?schoolId=me');
        setActivities(Array.isArray(data) ? data : data.items || []);
      } catch {
        setActivities([]);
      }
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-ivory-50">
        <Loader2 className="animate-spin text-forest-700" size={34} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-ivory-50">
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-6 py-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
          School Activity History
        </h1>
        <p className="mt-1 text-warm-500 font-medium">
          Recent actions and events within your school workspace.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" /> Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-charcoal-900">{activities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" /> Today's Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-charcoal-900">
              {activities.filter((a) => {
                const d = new Date(a.createdAt || a.timestamp || Date.now());
                return d.toDateString() === new Date().toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> School
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-charcoal-900">Current Workspace</div>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activities.length === 0 ? (
            <p className="text-xs text-warm-400 text-center py-8">
              No recent activity recorded.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200">
                <thead className="bg-ivory-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Action</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Module</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Actor</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {activities.slice(0, 20).map((activity) => (
                    <tr key={activity.id} className="hover:bg-ivory-50">
                      <td className="px-5 py-4 text-xs font-medium text-charcoal-900 truncate max-w-xs">
                        {activity.action || 'Unknown action'}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-charcoal-900">
                        <Badge variant="secondary" className="text-[10px]">
                          {activity.module || 'system'}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-warm-500 truncate max-w-xs">
                        {activity.actor || activity.userId || 'System'}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-charcoal-900 text-right">
                        {activity.createdAt ? new Date(activity.createdAt).toLocaleString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
}
