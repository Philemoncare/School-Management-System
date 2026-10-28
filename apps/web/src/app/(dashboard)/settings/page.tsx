'use client';

import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Save, Building2, Mail, Phone, MapPin, Globe, ShieldCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-state';

export default function BasicInfoSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [school, setSchool] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/schools/me`)
      .then(setSchool)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/schools/me`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: school.name,
          phone: school.phone,
          email: school.email,
          address: school.address,
        })
      });
      // In a real app, I'd use a toast notification here
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner label="Retrieving institution details..." />;

  return (
    <div className="max-w-4xl space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Institution Profile</h1>
          <p className="text-muted-foreground font-medium mt-1">Manage your school's public identity and contact information.</p>
        </div>
        <Button
          onClick={handleSubmit}
          isLoading={saving}
          leftIcon={<Save className="w-4 h-4" />}
          className="shadow-lg shadow-primary/20"
        >
          Push Changes
        </Button>
      </div>

      {error && (
        <Alert type="error" title="Configuration Error">
          {error}
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Core Identity</CardTitle>
              <CardDescription>Fundamental identifiers for your school node.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="School Name"
                  placeholder="e.g. Greenwood Academy"
                  leftIcon={<Building2 className="w-4 h-4" />}
                  value={school?.name || ''}
                  onChange={e => setSchool({...school, name: e.target.value})}
                />
                <Input
                  label="Registration Code"
                  disabled
                  helperText="Unique platform identifier"
                  leftIcon={<ShieldCheck className="w-4 h-4" />}
                  value={school?.code || ''}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Communication Stream</CardTitle>
              <CardDescription>Primary contact methods for parents and regulators.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Input
                  label="Public Email"
                  type="email"
                  placeholder="admin@school.edu"
                  leftIcon={<Mail className="w-4 h-4" />}
                  value={school?.email || ''}
                  onChange={e => setSchool({...school, email: e.target.value})}
                />
                <Input
                  label="Primary Phone"
                  placeholder="+1 (555) 000-0000"
                  leftIcon={<Phone className="w-4 h-4" />}
                  value={school?.phone || ''}
                  onChange={setSchool ? (e) => setSchool({...school, phone: e.target.value}) : undefined}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Physical Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground" />
                  <textarea
                    rows={4}
                    className="w-full rounded-2xl border border-input bg-background pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all outline-none shadow-sm"
                    placeholder="Full physical address of the campus"
                    value={school?.address || ''}
                    onChange={e => setSchool({...school, address: e.target.value})}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-primary text-primary-foreground border-none overflow-hidden shadow-xs">
            <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
              <Building2 className="w-32 h-32" />
            </div>
            <CardHeader>
              <CardTitle className="text-white">Tenant Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">Domain Active</span>
                <span className="text-sm font-bold flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  {school?.slug || 'institution'}.edusphere.io
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[11px] font-bold uppercase tracking-wide opacity-60">Provisioned Since</span>
                <span className="text-sm font-bold">January 12, 2024</span>
              </div>
              <div className="pt-4">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/10 border border-white/20 text-xs font-bold">
                  <div className="w-2 h-2 rounded-full bg-sage-400 animate-pulse" />
                  Operational Enterprise Node
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-dashed bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm">Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button variant="ghost" size="sm" className="justify-start text-xs font-bold">Manage Branding</Button>
              <Button variant="ghost" size="sm" className="justify-start text-xs font-bold">Update Localization</Button>
              <Button variant="ghost" size="sm" className="justify-start text-xs font-bold text-destructive hover:bg-destructive/10">Archive Tenant</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
