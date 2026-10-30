'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Smartphone, Bell, AlertTriangle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CommunicationConfigPage() {
  const { user } = useAuth();
  const activeSchoolId = localStorage.getItem('schoolId');
  const roles = user ? collectUserRoles(user, activeSchoolId || undefined) : [];
  const canManage = roles.some((r) => ['SCHOOL_ADMIN', 'ADMIN'].includes(r));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [smsBalance, setSmsBalance] = useState<any>(null);

  useEffect(() => {
    apiFetch('/school/sms/balance').catch(() => null).then((d) => {
      if (d) setSmsBalance(d);
      setLoading(false);
    });
  }, []);

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
          <h2 className="text-lg font-bold text-danger-800 mb-2">Unable to load communication settings</h2>
          <p className="text-danger-700 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-charcoal-900">
            Communication Settings
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Configure SMS and email preferences, notification settings, and message templates.
          </p>
        </div>
        {canManage && (
          <Link href="/dashboard/sms/purchase">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Purchase SMS Credits</Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      {/* SMS Credit Balance */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            <CardTitle>SMS Credit Balance</CardTitle>
          </div>
          <Badge
            variant={
              smsBalance?.smsCreditBalance < 10 ? 'destructive' : 'default'
            }
            className="text-[10px] font-bold"
          >
            {smsBalance?.status || 'Unknown'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-3xl sm:text-4xl font-bold text-charcoal-900">
              {smsBalance?.smsCreditBalance ?? 0}
            </span>
            <span className="text-warm-500 font-medium">credits</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
              <p className="text-[10px] font-bold uppercase text-warm-500">School</p>
              <p className="text-sm font-medium text-charcoal-900 mt-1">
                {smsBalance?.schoolName || '—'}
              </p>
            </div>
            <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
              <p className="text-[10px] font-bold uppercase text-warm-500">Currency</p>
              <p className="text-sm font-medium text-charcoal-900 mt-1">
                {smsBalance?.currency || 'USD'}
              </p>
            </div>
          </div>
          {smsBalance?.smsCreditBalance !== undefined && smsBalance.smsCreditBalance < 10 && (
            <div className="rounded-lg border border-terracotta-200 bg-terracotta-50/50 p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-terracotta-700 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-terracotta-900 mb-1">
                    Low SMS Credit Balance
                  </p>
                  <p className="text-xs text-terracotta-700">
                    Your SMS credit balance is below 10 credits. Purchase more credits to
                    ensure uninterrupted messaging.
                  </p>
                </div>
              </div>
            </div>
          )}
          {canManage && (
            <Button
              asChild
              href="/dashboard/sms/purchase"
              variant="outline"
              size="sm"
              className="w-full mt-3"
            >
              Purchase SMS Credits
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS & Email */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-4 h-4" /> SMS & Email
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-warm-600">
              Configure school-level SMS and email communication preferences. Global SMS
              provider credentials and API keys are managed by the Platform Super Admin.
            </p>
            <div className="space-y-3">
              <SettingRow
                label="Send SMS & Email"
                description="Compose and send messages to students, parents, and staff."
                icon={<Smartphone />}
                href="/communications"
                canManage={canManage}
              />
              <SettingRow
                label="Message History"
                description="View delivery status and history of all school communications."
                icon={<FileTextIcon />}
                href="/communications/delivery"
                canManage={canManage}
              />
              <SettingRow
                label="Announcements"
                description="Publish school-wide announcements to students, parents, and staff."
                icon={<Bell />}
                href="/dashboard/announcements"
                canManage={canManage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-4 h-4" /> Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-warm-600">
              Manage how your school sends notifications and which channels are enabled.
            </p>
            <div className="space-y-3">
              <SettingRow
                label="Feature Access"
                description="Enable or disable platform features for your school (library, transport, etc.)."
                icon={<Bell />}
                href="/dashboard/settings/features"
                canManage={canManage}
              />
              <SettingRow
                label="Notification Templates"
                description="Configure message templates for common school communications."
                icon={<FileTextIcon />}
                href="/dashboard/settings/features"
                canManage={canManage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-sage-200 bg-sage-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-forest-700" /> Platform-Level SMS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-forest-800 mb-3">
              SMS gateway configuration, provider credentials (Twilio, Arkesel, etc.), and
              SMS package pricing are controlled exclusively by the Platform Super Admin.
              Your school can only purchase credits and send messages within your balance.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-forest-100/50 border border-forest-200/50 text-xs text-forest-800">
                <span className="w-2 h-2 rounded-full bg-forest-500" />
                <span>Platform SMS credentials are NOT accessible from school settings.</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-forest-100/50 border border-forest-200/50 text-xs text-forest-800">
                <span className="w-2 h-2 rounded-full bg-forest-500" />
                <span>SMS credit purchases and deductions are tracked per-school.</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingRow({ label, description, icon: Icon, href, canManage }: {
  label: string;
  description: string;
  Icon: any;
  href: string;
  canManage: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-warm-200 hover:bg-forest-50/50 transition-all cursor-pointer" onClick={() => window.location.href = href}>
      <Icon className="w-4 h-4 text-warm-500" />
      <div className="flex-1">
        <p className="text-sm font-medium text-charcoal-900">{label}</p>
        <p className="text-[10px] text-warm-500">{description}</p>
      </div>
      <span className="text-[10px] font-bold text-warm-400">→</span>
    </div>
  );
}

import { FileTextIcon } from 'lucide-react';
