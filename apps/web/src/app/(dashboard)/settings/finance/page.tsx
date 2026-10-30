'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PiggyBank, CreditCard, Wallet, FileText, AlertTriangle, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FinanceConfigPage() {
  const { user } = useAuth();
  const activeSchoolId = localStorage.getItem('schoolId');
  const roles = user ? collectUserRoles(user, activeSchoolId || undefined) : [];
  const canManage = roles.some((r) => ['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT'].includes(r));

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/schools/me/finance-settings').catch(() => null).finally(() => setLoading(false));
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
          <h2 className="text-lg font-bold text-danger-800 mb-2">Unable to load finance settings</h2>
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
            Finance Settings
          </h1>
          <p className="text-warm-500 font-medium mt-1">
            Configure fee structures, payment categories, invoices, and receipts.
          </p>
        </div>
        {canManage && (
          <Link href="/accountant/fees/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create Fee Structure</Button>
          </Link>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 p-4 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fee Structures */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PiggyBank className="w-5 h-5" />
              <CardTitle>Fee Structures</CardTitle>
            </div>
            <Badge variant="default" className="text-[10px]">School-level</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-warm-600">
              Define fee categories, amounts, due dates, and mandatory/optional settings
              for your school's academic programs.
            </p>
            <div className="space-y-3">
              <SettingRow
                label="Fee Categories"
                description="Create and manage fee categories (tuition, lab fees, activity fees, etc.)."
                icon={<FileText />}
                href="/accountant/fees"
                canManage={canManage}
              />
              <SettingRow
                label="Fee Structures"
                description="Assign fees to classes, sections, and academic years."
                icon={<CreditCard />}
                href="/accountant/fees"
                canManage={canManage}
              />
              <SettingRow
                label="Invoices"
                description="Generate and manage student invoices based on fee structures."
                icon={<FileText />}
                href="/dashboard/finance/invoices"
                canManage={canManage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Payments */}
        <Card>
          <CardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              <CardTitle>Payments & Receipts</CardTitle>
            </div>
            <Badge variant="default" className="text-[10px]">School-level</Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-warm-600">
              Configure payment methods, record payments, and issue receipts for student fees.
            </p>
            <div className="space-y-3">
              <SettingRow
                label="Payment Methods"
                description="Configure available payment methods for parents and students."
                icon={<Wallet />}
                href="/dashboard/finance/payments"
                canManage={canManage}
              />
              <SettingRow
                label="Receipts"
                description="Issue and manage payment receipts for fee collections."
                icon={<FileText />}
                href="/accountant/receipts"
                canManage={canManage}
              />
              <SettingRow
                label="Outstanding Balances"
                description="Monitor and manage unpaid student fee balances."
                icon={<AlertTriangle />}
                href="/accountant/outstanding"
                canManage={canManage}
              />
            </div>
          </CardContent>
        </Card>

        {/* Warning */}
        <Card className="border-terracotta-200 bg-terracotta-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-terracotta-700" /> Platform Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-terracotta-700 mb-3">
              Global payment gateway configuration (Stripe, etc.) is managed exclusively by
              the Platform Super Admin. Your school can only view and use the payment methods
              that have been enabled at the platform level.
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-terracotta-100/50 border border-terracotta-200/50 text-xs text-terracotta-700">
                <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                <span>Platform payment credentials are NOT accessible from school settings.</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-terracotta-100/50 border border-terracotta-200/50 text-xs text-terracotta-700">
                <span className="w-2 h-2 rounded-full bg-terracotta-500" />
                <span>School-level payment records remain private to your workspace.</span>
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
