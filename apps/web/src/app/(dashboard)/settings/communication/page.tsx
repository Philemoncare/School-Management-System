'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  SettingRow,
  SettingsLoading,
  SettingsNotice,
  SettingsPageHeader,
  SettingsSection,
  useSettingsAccess,
} from '@/components/settings/settings-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, FileText, Mail, Smartphone, Plus, RefreshCw, Zap } from 'lucide-react';

/**
 * Communication settings.
 *
 * Shows the school's real SMS credit balance (`GET /school/sms/balance`) and
 * links into the modules that own sending, history and announcements. Provider
 * credentials stay on the platform side, so nothing here is editable.
 */
export default function CommunicationConfigPage() {
  const { canManage } = useSettingsAccess(['SCHOOL_ADMIN', 'ADMIN']);

  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState<any>(null);
  const [balanceError, setBalanceError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setBalanceError('');
    try {
      setBalance(await apiFetch('/school/sms/balance'));
    } catch (err: any) {
      setBalance(null);
      setBalanceError(err?.message || 'Unable to read the SMS credit balance.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <SettingsLoading label="Loading communication settings…" />;

  const lowBalance = balance && Number(balance.smsCreditBalance) < 10;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <SettingsPageHeader
        title="Communication Settings"
        description="SMS credits, messaging channels and announcement access for your school."
        actions={
          canManage && (
            <Link href="/dashboard/sms/purchase">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Purchase SMS Credits</Button>
            </Link>
          )
        }
      />

      {/* SMS Credit Balance */}
      <SettingsSection
        title="SMS Credit Balance"
        icon={Smartphone}
        actions={
          balance ? (
            <Badge variant={lowBalance ? 'destructive' : 'default'} className="text-[10px] font-bold">
              {balance.status || 'Unknown'}
            </Badge>
          ) : undefined
        }
      >
        {balanceError ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-warm-600">{balanceError}</p>
            <Button variant="outline" size="xs" leftIcon={<RefreshCw size={14} />} onClick={load}>
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-charcoal-900">
                {Number(balance?.smsCreditBalance ?? 0)}
              </span>
              <span className="text-warm-500 font-medium">credits</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
                <p className="text-[10px] font-bold uppercase text-warm-500">School</p>
                <p className="text-sm font-medium text-charcoal-900 mt-1">
                  {balance?.schoolName || '—'}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-warm-200 bg-ivory-50">
                <p className="text-[10px] font-bold uppercase text-warm-500">Currency</p>
                <p className="text-sm font-medium text-charcoal-900 mt-1">
                  {balance?.currency || 'USD'}
                </p>
              </div>
            </div>
            {lowBalance && (
              <SettingsNotice
                kind="error"
                message="Low SMS credit balance (under 10 credits). Purchase more credits to keep messages flowing."
              />
            )}
            {canManage && (
              <Link href="/dashboard/sms/purchase" className="block">
                <Button variant="outline" size="sm">
                  Purchase SMS Credits
                </Button>
              </Link>
            )}
          </>
        )}
      </SettingsSection>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMS & Email */}
        <SettingsSection title="SMS & Email" icon={Mail}>
          <p className="text-sm text-warm-600">
            Configure school-level SMS and email communication preferences. Global SMS provider
            credentials and API keys are managed by the Platform Super Admin.
          </p>
          <SettingRow
            label="Send SMS & Email"
            description="Compose and send messages to students, parents, and staff."
            icon={Smartphone}
            href="/communications"
            canManage={canManage}
          />
          <SettingRow
            label="Message History"
            description="View delivery status and history of all school communications."
            icon={FileText}
            href="/communications/delivery"
            canManage={canManage}
          />
          <SettingRow
            label="Announcements"
            description="Publish school-wide announcements to students, parents, and staff."
            icon={Bell}
            href="/dashboard/announcements"
            canManage={canManage}
          />
        </SettingsSection>

        {/* Feature-gated channels */}
        <SettingsSection title="Channel Availability" icon={Bell}>
          <p className="text-sm text-warm-600">
            Which communication channels your school may use is decided by platform feature flags.
          </p>
          <SettingRow
            label="Feature Access"
            description="See which communication features (messaging, SMS) are enabled for your school."
            icon={Zap}
            href="/settings/features"
            canManage={canManage}
          />
          <SettingRow
            label="SMS Spend"
            description="Review the school's SMS balance and usage."
            icon={Smartphone}
            href="/dashboard/sms/balance"
            canManage={canManage}
          />
        </SettingsSection>

        {/* Platform callout */}
        <Card className="border-sage-200 bg-sage-50/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-forest-700" /> Platform-Level SMS
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-forest-800 mb-3">
              SMS gateway configuration, provider credentials (Twilio, Arkesel, etc.), and SMS
              package pricing are controlled exclusively by the Platform Super Admin. Your school
              can only purchase credits and send messages within its balance.
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
