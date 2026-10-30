'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Building2, Mail, Phone, MapPin, Globe, Save, Globe as GlobeIcon } from 'lucide-react';

export default function SchoolProfilePage() {
  const { user } = useAuth();
  const activeSchoolId = localStorage.getItem('schoolId');
  const roles = user ? collectUserRoles(user, activeSchoolId || undefined) : [];
  const canEdit = roles.some((r) => ['SCHOOL_ADMIN', 'ADMIN', 'PRINCIPAL'].includes(r));

  const [school, setSchool] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    apiFetch(`/schools/me`)
      .then(setSchool)
      .catch((err) => setError(err.message || 'Unable to load school profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);
    try {
      const updated = await apiFetch(`/schools/me`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: school.name,
          phone: school.phone,
          email: school.email,
          address: school.address,
          timezone: school.timezone,
          currency: school.currency,
        }),
      });
      setSchool(updated);
      setMessage('School profile saved successfully.');
    } catch (err: any) {
      setError(err.message || 'Unable to save school profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ivory-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-6 text-center">
          <h2 className="text-lg font-bold text-danger-800 mb-2">Unable to load profile</h2>
          <p className="text-danger-700 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            School Profile
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Manage your school's public identity and contact information.
          </p>
        </div>
        {canEdit && (
          <Button onClick={handleSubmit} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-success-200 bg-success-50 p-4 text-sm font-semibold text-success-700">
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Core Identity
            </CardTitle>
            <p className="text-xs text-warm-500">Fundamental identifiers for your school.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="School Name *"
                value={school?.name || ''}
                disabled={!canEdit}
                onChange={(e) => setSchool({ ...school, name: e.target.value })}
              />
              <Input
                label="Registration Code"
                value={school?.code || ''}
                disabled
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="School Type"
                value={school?.schoolType || ''}
                disabled={!canEdit}
                onChange={(e) => setSchool({ ...school, schoolType: e.target.value })}
                placeholder="e.g. Private, Public, Charter"
              />
              <Input
                label="School Category"
                value={school?.schoolCategory || ''}
                disabled={!canEdit}
                onChange={(e) => setSchool({ ...school, schoolCategory: e.target.value })}
                placeholder="e.g. K-12, Higher Education"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Headteacher / Principal"
                value={school?.headteacherName || ''}
                disabled={!canEdit}
                onChange={(e) => setSchool({ ...school, headteacherName: e.target.value })}
              />
              <Input
                label="School Website"
                type="url"
                value={school?.website || ''}
                disabled={!canEdit}
                onChange={(e) => setSchool({ ...school, website: e.target.value })}
                placeholder="https://www.example.edu"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" /> Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Public Email *"
                type="email"
                value={school?.email || ''}
                disabled={!canEdit}
                onChange={(e) => setSchool({ ...school, email: e.target.value })}
              />
              <Input
                label="Primary Phone *"
                value={school?.phone || ''}
                disabled={!canEdit}
                onChange={(e) => setSchool({ ...school, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-warm-500">Physical Address</label>
              <Input
                as="textarea"
                rows={3}
                value={school?.address || ''}
                disabled={!canEdit}
                onChange={(e) => setSchool({ ...school, address: e.target.value })}
                placeholder="Full physical address of the campus"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Timezone"
                value={school?.timezone || 'UTC'}
                disabled={!canEdit}
                onChange={(e) => setSchool({ ...school, timezone: e.target.value })}
              />
              <Input
                label="Currency"
                value={school?.currency || 'USD'}
                disabled={!canEdit}
                onChange={(e) => setSchool({ ...school, currency: e.target.value })}
              />
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="bg-sage-50 border border-sage-100 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <GlobeIcon className="w-5 h-5 text-forest-700 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-charcoal-900">Tenant Status</h3>
              <p className="text-xs text-warm-500">
                Your school workspace: {school?.slug || 'institution'}.edusphere.io
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-card/50 border border-warm-200 text-xs font-bold">
            <div className="w-2 h-2 rounded-full bg-sage-400 animate-pulse" />
            <span>Operational — All modules active</span>
          </div>
        </div>
      </form>
    </div>
  );
}
