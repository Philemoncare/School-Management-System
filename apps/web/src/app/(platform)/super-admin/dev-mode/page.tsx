'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Activity,
  School,
  ShieldAlert,
  Database,
  Mail,
  Smartphone,
  Bell,
  Bug,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardList,
  FileText,
  User,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

export default function DevModePage() {
  const [status, setStatus] = useState<any>(null);
  const [schools, setSchools] = useState<any[]>([]);
  const [features, setFeatures] = useState<any[]>([]);
  const [diagnostics, setDiagnostics] = useState<any>(null);
  const [jobs, setJobs] = useState<any>(null);
  const [safeOps, setSafeOps] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [smsTestOpen, setSmsTestOpen] = useState(false);
  const [smsTestTo, setSmsTestTo] = useState('');
  const [smsTestMessage, setSmsTestMessage] = useState('');
  const [emailTestOpen, setEmailTestOpen] = useState(false);
  const [featureToggleOpen, setFeatureToggleOpen] = useState(false);
  const [toggleFeatureId, setToggleFeatureId] = useState<string | null>(null);
  const [toggleFeatureEnabled, setToggleFeatureEnabled] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setError('');
    try {
      const [st, sch, fe, di, jo, so] = await Promise.all([
        apiFetch('/dev-mode/status'),
        apiFetch('/dev-mode/schools'),
        apiFetch('/dev-mode/features'),
        apiFetch('/dev-mode/diagnostics'),
        apiFetch('/dev-mode/jobs'),
        apiFetch('/dev-mode/safe-operations'),
      ]);
      setStatus(st);
      setSchools(sch || []);
      setFeatures(fe || []);
      setDiagnostics(di);
      setJobs(jo);
      setSafeOps(so);
    } catch (err: any) {
      setError(err.message || 'Unable to load Developer Mode data');
    } finally {
      setLoading(false);
    }
  }

  async function toggleFeature(flagId: string, isEnabled: boolean) {
    try {
      await apiFetch(`/dev-mode/features/${flagId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ isEnabled }),
      });
      setFeatures((curr) =>
        curr.map((f) => (f.id === flagId ? { ...f, isEnabled } : f)),
      );
      setFeatureToggleOpen(false);
      setToggleFeatureId(null);
    } catch (err: any) {
      setError(err.message || 'Unable to toggle feature');
    }
  }

  async function runDiagnostics() {
    try {
      const di = await apiFetch('/dev-mode/diagnostics');
      setDiagnostics(di);
    } catch (err: any) {
      setError(err.message || 'Diagnostics failed');
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

  if (!status) return null;

  const isProduction = status.isProduction;
  const overall = diagnostics?.overall || 'unknown';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Dev Mode Warning Banner */}
      <div className="rounded-xl border border-terracotta-200 bg-terracotta-50 p-6">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-terracotta-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-terracotta-900">Developer Mode — Protected Testing Environment</h3>
            <p className="mt-1 text-sm text-terracotta-700">
              This mode provides operational access for development, testing, debugging,
              and system maintenance. Tenant isolation, security controls, and financial
              verification remain fully enforced. Real financial transactions and
              communications are never triggered from this mode.
              {isProduction && (
                <span className="ml-2 text-xs font-bold bg-terracotta-100 text-terracotta-800 px-2 py-0.5 rounded">
                  PRODUCTION ENVIRONMENT
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
            Developer Mode
          </h1>
          <p className="mt-1 text-warm-500 font-medium">
            Platform owner operational and testing access.
          </p>
        </div>
        <div className="flex gap-2">
          <Badge variant={overall === 'HEALTHY' ? 'success' : 'destructive'} className="text-xs font-semibold">
            System: {overall}
          </Badge>
          <Badge variant="secondary" className="text-xs font-semibold">
            {isProduction ? 'Production' : 'Development'}
          </Badge>
        </div>
      </div>

      {/* Overview Section */}
      <section>
        <h2 className="text-lg font-semibold text-charcoal-900 flex items-center gap-2">
          <Activity size={18} /> Platform Overview
        </h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-charcoal-900">
                  {status.health?.status === 'ok' ? 'Healthy' : status.health?.status === 'degraded' ? 'Degraded' : 'Offline'}
                </span>
              </div>
              <p className="text-xs text-warm-500 mt-1">Platform health</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-charcoal-900">{schools.length}</span>
              </div>
              <p className="text-xs text-warm-500 mt-1">Registered schools</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-charcoal-900">{jobs?.failed ?? 0}</span>
              </div>
              <p className="text-xs text-warm-500 mt-1">Failed background jobs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-charcoal-900">{features.length}</span>
              </div>
              <p className="text-xs text-warm-500 mt-1">Feature flags</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Schools Section */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-charcoal-900 flex items-center gap-2">
          <School size={18} /> School Workspaces
        </h2>
        <div className="mt-4 overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">School</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Status</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Students</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Teachers</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {schools.map((s) => (
                <tr key={s.id} className="hover:bg-ivory-50">
                  <td className="px-5 py-4">
                    <div className="text-xs font-semibold text-charcoal-900">{s.name}</div>
                    <div className="text-[10px] text-warm-500 font-mono">{s.code}</div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge variant={s.status === 'ACTIVE' ? 'success' : 'secondary'} className="text-[10px]">
                      {s.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-charcoal-900 text-center">
                    {s._count?.students || 0}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-charcoal-900 text-center">
                    {s._count?.teachers || 0}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-charcoal-900 text-right">
                    {Number(s.smsCreditBalance || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Features Section */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-charcoal-900 flex items-center gap-2">
          <Activity size={18} /> Feature Entitlements (Dev Testing)
        </h2>
        <div className="mt-4 p-4 bg-card border border-warm-100 rounded-xl">
          <p className="text-[11px] text-warm-500 font-medium mb-4">
            Toggle features for testing. Changes propagate immediately to all schools.
          </p>
          <div className="grid grid-cols-1 gap-3">
            {features.map((f) => (
              <div key={f.id} className="p-4 border border-warm-100 rounded-xl flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-charcoal-800">{f.name}</h3>
                    <Badge variant={f.allSchools ? 'neutral' : 'secondary'} className="text-[10px]">
                      {f.allSchools ? 'All schools' : `${f.schoolIds?.length ?? 0} targeted`}
                    </Badge>
                  </div>
                  <p className="text-[10px] text-warm-500 mt-1">{f.description || ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold ${f.isEnabled ? 'text-forest-700' : 'text-warm-500'}`}>
                    {f.isEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setToggleFeatureId(f.id);
                      setToggleFeatureEnabled(f.isEnabled);
                      setFeatureToggleOpen(true);
                    }}
                  >
                    Toggle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Diagnostics Section */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-charcoal-900 flex items-center gap-2">
          <Bug size={18} /> System Diagnostics
        </h2>
        <div className="mt-4 flex gap-4">
          <Button onClick={runDiagnostics} leftIcon={<Loader2 className="w-4 h-4" />}>
            Run Diagnostics
          </Button>
        </div>
        {diagnostics && (
          <Card className="mt-4">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {diagnostics.checks.map((check: any) => (
                  <div key={check.name} className="p-3 rounded-lg border bg-ivory-50">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-semibold text-charcoal-800">{check.name}</span>
                      <Badge
                        variant={check.status === 'PASS' || check.status === 'CONFIGURED' ? 'success' : 'destructive'}
                        className="text-[10px]"
                      >
                        {check.status}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-warm-500">{check.detail}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[10px] text-warm-500">
                Overall: {diagnostics.overall} &bull; Run at: {diagnostics.runAt}
              </p>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Safe Operations */}
      <section className="mt-8">
        <h2 className="text-lg font-semibold text-charcoal-900 flex items-center gap-2">
          <Lock size={18} /> Safe Operations Boundary
        </h2>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Allowed Operations</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="text-xs text-warm-600 space-y-2">
                {safeOps?.allowed.map((op: string) => (
                  <li key={op} className="flex items-center gap-2">
                    <CheckCircle2 className="w-3 h-3 text-forest-600" />
                    {op.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Restricted Operations</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <ul className="text-xs text-terracotta-600 space-y-2">
                {safeOps?.restricted.map((op: string) => (
                  <li key={op} className="flex items-center gap-2">
                    <AlertCircle className="w-3 h-3 text-terracotta-600" />
                    {op.replace(/_/g, ' ')}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-[10px] text-terracotta-500 font-medium">
                {safeOps?.warning}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SMS Test Modal */}
      <Modal
        isOpen={smsTestOpen}
        onClose={() => setSmsTestOpen(false)}
        title="Test SMS Integration (Dev)"
        footerActions={
          <>
            <Button variant="outline" onClick={() => setSmsTestOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              apiFetch('/dev-mode/test/sms', {
                method: 'POST',
                body: JSON.stringify({ to: smsTestTo, message: smsTestMessage }),
              }).then(() => {
                setSmsTestOpen(false);
                setSmsTestTo('');
                setSmsTestMessage('');
              }).catch((e: any) => setError(e.message));
            }}>
              Send Test SMS
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[11px] text-warm-500 font-medium">
            Test SMS delivery without deducting credits. No real message is sent.
          </p>
          <Input label="Recipient" value={smsTestTo} onChange={(e) => setSmsTestTo(e.target.value)} placeholder="+1234567890" />
          <div className="w-full flex flex-col gap-1.5">
            <label htmlFor="smsMessage" className="ml-0.5 text-[11px] font-semibold text-warm-600 sm:text-xs">Message</label>
            <textarea
              id="smsMessage"
              value={smsTestMessage}
              onChange={(e) => setSmsTestMessage(e.target.value)}
              placeholder="This is a test message"
              rows={3}
              className="w-full rounded-lg border border-warm-300 bg-card p-3 outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/15 text-sm"
            />
          </div>
        </div>
      </Modal>

      {/* Feature Toggle Modal */}
      <Modal
        isOpen={featureToggleOpen}
        onClose={() => setFeatureToggleOpen(false)}
        title={`Toggle Feature: ${toggleFeatureId}`}
        footerActions={
          <>
            <Button variant="outline" onClick={() => setFeatureToggleOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (toggleFeatureId) toggleFeature(toggleFeatureId, !toggleFeatureEnabled);
            }}>
              {toggleFeatureEnabled ? 'Disable for Testing' : 'Enable for Testing'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-[11px] text-warm-500 font-medium">
            This changes the feature flag for all schools. Use for testing only.
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-charcoal-800">Current state:</span>
            <Badge variant={toggleFeatureEnabled ? 'success' : 'neutral'} className="text-xs">
              {toggleFeatureEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>
      </Modal>
    </div>
  );
}
