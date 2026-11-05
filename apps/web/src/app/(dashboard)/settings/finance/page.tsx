'use client';

import React from 'react';
import Link from 'next/link';
import {
  SettingRow,
  SettingsPageHeader,
  SettingsSection,
  useSettingsAccess,
} from '@/components/settings/settings-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CreditCard, FileText, PiggyBank, Plus, Wallet } from 'lucide-react';

/**
 * Finance settings.
 *
 * Navigation-only page: fee structures, invoices, payments and receipts are
 * created and edited by the accountant/finance modules, which own that data.
 */
export default function FinanceConfigPage() {
  const { canManage } = useSettingsAccess(['SCHOOL_ADMIN', 'ADMIN', 'ACCOUNTANT']);

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <SettingsPageHeader
        title="Finance Settings"
        description="Fee structures, invoices, payments and receipts for your school."
        actions={
          canManage && (
            <Link href="/accountant/fees/new">
              <Button leftIcon={<Plus className="w-4 h-4" />}>Create Fee Structure</Button>
            </Link>
          )
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <SettingsSection
          title="Fees & Invoicing"
          icon={PiggyBank}
          actions={<Badge variant="default" className="text-[10px]">School-level</Badge>}
        >
          <p className="text-sm text-warm-600">
            Define fee categories, amounts and due dates, then assign them to classes, sections and
            academic years.
          </p>
          <SettingRow
            label="Fee Structures & Categories"
            description="Tuition, lab fees, activity fees and the class/year structures they apply to."
            icon={CreditCard}
            href="/accountant/fees"
            canManage={canManage}
          />
          <SettingRow
            label="Invoices"
            description="Generate and manage student invoices based on fee structures."
            icon={FileText}
            href="/dashboard/finance/invoices"
            canManage={canManage}
          />
        </SettingsSection>

        <SettingsSection
          title="Payments & Receipts"
          icon={Wallet}
          actions={<Badge variant="default" className="text-[10px]">School-level</Badge>}
        >
          <p className="text-sm text-warm-600">
            Record payments, issue receipts and follow up on unpaid balances.
          </p>
          <SettingRow
            label="Payments"
            description="Record and reconcile payments received from parents and students."
            icon={Wallet}
            href="/dashboard/finance/payments"
            canManage={canManage}
          />
          <SettingRow
            label="Receipts"
            description="Issue and manage payment receipts for fee collections."
            icon={FileText}
            href="/accountant/receipts"
            canManage={canManage}
          />
          <SettingRow
            label="Outstanding Balances"
            description="Monitor and manage unpaid student fee balances."
            icon={AlertTriangle}
            href="/accountant/outstanding"
            canManage={canManage}
          />
        </SettingsSection>

        {/* Platform callout */}
        <Card className="border-terracotta-200 bg-terracotta-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-terracotta-700" /> Platform Integrations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <p className="text-sm text-terracotta-700 mb-3">
              Global payment gateway configuration (Stripe, etc.) is managed exclusively by the
              Platform Super Admin. Your school can only view and use the payment methods that have
              been enabled at the platform level.
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
