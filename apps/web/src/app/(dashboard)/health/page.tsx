'use client';

import { useEffect, useState } from 'react';
import {
  Heart,
  Activity,
  AlertCircle,
  Users,
  Clock,
  Calendar,
  Clipboard,
  ShieldAlert,
  Search
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format } from 'date-fns';

export default function HealthDashboard() {
  const api = useApi();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/health/dashboard');
        setData(res);
      } catch (error) {
        console.error('Failed to fetch health dashboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [api]);

  if (loading) return <div>Loading dashboard...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Heart className="text-danger-500" /> School Health Dashboard
        </h1>
        <div className="flex gap-2">
          <Link href="/health/clinic/queue">
            <Button variant="outline" className="gap-2">
              <Clock className="w-4 h-4" /> View Queue
            </Button>
          </Link>
          <Link href="/health/visits/new">
            <Button className="gap-2">
              <PlusCircle className="w-4 h-4" /> New Visit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Visits Today</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.visitsToday || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Waiting in Queue</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-forest-700">{data?.waitingInQueue || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Active Incidents</CardTitle>
            <AlertCircle className="w-4 h-4 text-danger-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-danger-600">{data?.recentIncidents?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Supply Alerts</CardTitle>
            <Clipboard className="w-4 h-4 text-warning-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning-600">{data?.lowMedicalSupplies?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="text-danger-500" /> Recent Health Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recentIncidents?.map((incident: any) => (
                <div key={incident.id} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">{incident.profile.student.firstName} {incident.profile.student.lastName}</div>
                    <div className="text-sm text-muted-foreground">{incident.category} - {incident.description}</div>
                    <div className="text-xs text-muted-foreground">{format(new Date(incident.incidentDate), 'MMM d, h:mm a')}</div>
                  </div>
                  <Badge variant={incident.severity === 'CRITICAL' ? 'destructive' : 'outline'}>
                    {incident.severity}
                  </Badge>
                </div>
              ))}
              {(!data?.recentIncidents || data.recentIncidents.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">No active incidents</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="text-forest-500" /> Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.upcomingAppointments?.map((app: any) => (
                <div key={app.id} className="p-3 border rounded-lg">
                  <div className="font-semibold">{app.profile.student.firstName} {app.profile.student.lastName}</div>
                  <div className="text-sm">{app.title}</div>
                  <div className="text-xs text-muted-foreground">{format(new Date(app.startTime), 'h:mm a')}</div>
                </div>
              ))}
              {(!data?.upcomingAppointments || data.upcomingAppointments.length === 0) && (
                <div className="text-center py-4 text-muted-foreground">No appointments scheduled</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clipboard className="text-warning-500" /> Low Medical Supplies
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.lowMedicalSupplies?.map((balance: any) => (
              <div key={balance.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <div className="font-semibold">{balance.item.name}</div>
                  <div className="text-sm text-muted-foreground">{balance.location.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-danger-500">{balance.onHand}</div>
                  <div className="text-xs text-muted-foreground">Left</div>
                </div>
              </div>
            ))}
          </div>
          {(!data?.lowMedicalSupplies || data.lowMedicalSupplies.length === 0) && (
            <div className="text-center py-4 text-muted-foreground">All medical supplies are sufficient</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PlusCircle(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  );
}
