'use client';

import { useEffect, useState } from 'react';
import {
  User,
  Heart,
  Activity,
  ShieldAlert,
  Pill,
  History,
  FileText,
  Plus,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';

export default function StudentHealthProfile({ params }: { params: { id: string } }) {
  const api = useApi();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [breakGlassVisible, setBreakGlassVisible] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get(`/health/students/${params.id}/profile`);
        setProfile(res);
      } catch (error: any) {
        if (error.status === 403) {
            setBreakGlassVisible(true);
        }
        console.error('Failed to fetch profile', error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [api, params.id]);

  const handleBreakGlass = async (reason: string) => {
    try {
        await api.post('/health/break-glass', { studentId: params.id, reason });
        window.location.reload();
    } catch (error) {
        console.error('Break glass failed', error);
    }
  };

  if (loading) return <div className="p-6 text-center">Loading health profile...</div>;

  if (breakGlassVisible) {
    return (
        <div className="p-6 flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
            <ShieldAlert className="w-16 h-16 text-danger-500" />
            <h1 className="text-2xl font-bold text-danger-700">Restricted Medical Record</h1>
            <p className="max-w-md text-muted-foreground">
                You do not have routine access to this student's clinical health records.
                In case of emergency, you may "Break Glass" to gain temporary access.
                All such actions are audited and reported to security.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
                <Button variant="destructive" onClick={() => {
                    const reason = prompt('Please state the emergency reason for access:');
                    if (reason) handleBreakGlass(reason);
                }}>
                    Break Glass Access
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                    Return to Dashboard
                </Button>
            </div>
        </div>
    );
  }

  if (!profile) return <div className="p-6 text-center">Profile not found.</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{profile.student.firstName} {profile.student.lastName}</h1>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{profile.student.studentNumber}</Badge>
              <Badge variant="secondary">Blood Group: {profile.bloodGroup || 'Unknown'}</Badge>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <FileText className="w-4 h-4" /> Export records
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> New Incident
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Critical Warnings */}
          {(profile.allergies?.some((a: any) => a.isCritical) || profile.carePlans?.length > 0) && (
            <Card className="border-danger-200 bg-danger-50">
              <CardHeader className="pb-2">
                <CardTitle className="text-danger-700 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> Critical Health Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profile.allergies?.filter((a: any) => a.isCritical).map((allergy: any) => (
                  <div key={allergy.id} className="flex gap-2 items-start">
                    <Badge variant="destructive">CRITICAL ALLERGY</Badge>
                    <div>
                      <span className="font-bold">{allergy.allergen}</span>: {allergy.reaction}
                    </div>
                  </div>
                ))}
                {profile.carePlans?.map((plan: any) => (
                  <div key={plan.id} className="flex gap-2 items-start">
                    <Badge className="bg-terracotta-500">CARE PLAN ACTIVE</Badge>
                    <div className="font-semibold">{plan.title}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="clinical">Clinical</TabsTrigger>
              <TabsTrigger value="medications">Medications</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-danger-500" /> Medical Conditions & Allergies
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-2">Active Conditions</h3>
                    <div className="space-y-2">
                      {profile.conditions?.map((c: any) => (
                        <div key={c.id} className="p-2 border rounded text-sm">
                          {c.name} <Badge variant="outline" className="ml-2">{c.status}</Badge>
                        </div>
                      ))}
                      {profile.conditions?.length === 0 && <p className="text-sm text-muted-foreground">No records found</p>}
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Allergies</h3>
                    <div className="space-y-2">
                      {profile.allergies?.map((a: any) => (
                        <div key={a.id} className="p-2 border rounded text-sm flex justify-between items-center">
                          <span>{a.allergen} ({a.type})</span>
                          <Badge variant={a.severity === 'SEVERE' ? 'destructive' : 'secondary'}>{a.severity}</Badge>
                        </div>
                      ))}
                      {profile.allergies?.length === 0 && <p className="text-sm text-muted-foreground">No records found</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-forest-500" /> Recent Vitals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {/* Simplified vital list */}
                    <div className="p-3 border rounded-lg min-w-[120px] text-center">
                        <div className="text-xs text-muted-foreground">Weight</div>
                        <div className="text-lg font-bold">--</div>
                    </div>
                    <div className="p-3 border rounded-lg min-w-[120px] text-center">
                        <div className="text-xs text-muted-foreground">Height</div>
                        <div className="text-lg font-bold">--</div>
                    </div>
                    <div className="p-3 border rounded-lg min-w-[120px] text-center">
                        <div className="text-xs text-muted-foreground">Temp</div>
                        <div className="text-lg font-bold">--</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="medications" className="mt-4 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-terracotta-500" /> Active Medications
                  </CardTitle>
                  <Button size="sm" variant="outline" className="gap-1"><Plus className="w-4 h-4" /> Add</Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {profile.medications?.filter((m: any) => m.status === 'ACTIVE').map((med: any) => (
                      <div key={med.id} className="p-4 border rounded-lg flex justify-between items-start">
                        <div>
                          <div className="font-bold text-lg">{med.name}</div>
                          <div className="text-sm">{med.dosage} - {med.frequency}</div>
                          <div className="text-xs text-muted-foreground mt-1">Purpose: {med.purpose}</div>
                        </div>
                        <Button size="sm">Record Administration</Button>
                      </div>
                    ))}
                    {profile.medications?.length === 0 && (
                      <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg">
                        No active medications recorded
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               {/* This would normally come from the student's primary guardian info */}
               <div className="p-3 border rounded-lg bg-ivory-50">
                  <div className="text-sm font-bold">Primary Guardian</div>
                  <div className="text-xs text-muted-foreground">Parent</div>
                  <div className="mt-2 font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-success-500 rounded-full"></span>
                    +1-555-0123
                  </div>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span>Immunizations</span>
                <Badge className="bg-success-100 text-success-800">COMPLETE</Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Health Consent</span>
                <Badge variant={profile.consentStatus ? 'outline' : 'destructive'}>
                    {profile.consentStatus ? 'GRANTED' : 'PENDING'}
                </Badge>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Screening Due</span>
                <span className="font-medium text-forest-700">Vision (Next Month)</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" /> Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.visits?.slice(0, 3).map((visit: any) => (
                  <div key={visit.id} className="text-xs border-l-2 border-forest-500 pl-3 py-1">
                    <div className="font-semibold">Clinic Visit - {visit.visitType}</div>
                    <div className="text-muted-foreground">{format(new Date(visit.checkInAt), 'MMM d, yyyy')}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
