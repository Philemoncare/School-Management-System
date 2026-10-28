'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Clock,
  Search,
  ArrowRight,
  MoreVertical,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { formatDistanceToNow } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ClinicQueue() {
  const api = useApi();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const res = await api.get('/health/queue');
        setQueue(res);
      } catch (error) {
        console.error('Failed to fetch queue', error);
      } finally {
        setLoading(false);
      }
    };
    fetchQueue();

    // In a real production app, we would use WebSockets for realtime updates
    // const socket = ...
  }, [api]);

  const handleUpdateStatus = async (visitId: string, status: string) => {
    try {
      await api.patch(`/health/visits/${visitId}`, { status });
      setQueue(prev => prev.map(v => v.id === visitId ? { ...v, status } : v).filter(v => ['CHECKED_IN', 'ASSESSMENT', 'OBSERVATION'].includes(status)));
    } catch (error) {
      console.error('Failed to update status', error);
    }
  };

  if (loading) return <div>Loading queue...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Users className="text-forest-500" /> Clinic Queue
        </h1>
        <Badge variant="outline" className="text-lg py-1 px-3">
          {queue.length} Students Waiting
        </Badge>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Visit Type</TableHead>
                <TableHead>Wait Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((visit) => (
                <TableRow key={visit.id}>
                  <TableCell className="font-medium">
                    <div>{visit.profile.student.firstName} {visit.profile.student.lastName}</div>
                    <div className="text-xs text-muted-foreground">{visit.profile.student.studentNumber}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{visit.visitType}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Clock className="w-3 h-4 text-muted-foreground" />
                      {formatDistanceToNow(new Date(visit.checkInAt))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={
                      visit.status === 'CHECKED_IN' ? 'bg-warning-100 text-warning-800' :
                      visit.status === 'ASSESSMENT' ? 'bg-sage-100 text-forest-900' :
                      'bg-terracotta-100 text-terracotta-800'
                    }>
                      {visit.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {visit.status === 'CHECKED_IN' && (
                        <Button size="sm" onClick={() => handleUpdateStatus(visit.id, 'ASSESSMENT')}>
                          Start Assessment
                        </Button>
                      )}
                      {visit.status === 'ASSESSMENT' && (
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(visit.id, 'OBSERVATION')}>
                          To Observation
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="gap-1">
                        View <ArrowRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {queue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    The queue is currently empty
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

