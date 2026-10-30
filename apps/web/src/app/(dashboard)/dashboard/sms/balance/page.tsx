'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  Smartphone,
  Wallet,
  CreditCard,
  Activity,
  ArrowRight,
  AlertCircle,
  Badge as BadgeIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function SmsBalancePage() {
  const [balance, setBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [bal, txns] = await Promise.all([
        apiFetch('/school/sms/balance'),
        apiFetch('/school/sms/transactions'),
      ]);
      setBalance(bal);
      setTransactions(txns || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load SMS credit balance');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-ivory-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700"></div>
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

  const bal = balance?.smsCreditBalance ?? 0;
  const isLow = bal < 10;

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
          SMS Credit Balance
        </h1>
        <p className="mt-1 text-warm-500 font-medium">
          Your school's current SMS credit balance and recent transactions.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" /> Current Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-bold text-charcoal-900">{bal}</span>
              <span className="text-warm-500 font-medium">credits</span>
            </div>
            <p className="mt-2 text-xs font-semibold text-warm-400 uppercase tracking-wider">
              {isLow ? 'Low balance — consider purchasing more credits' : 'Healthy balance'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Status
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <Badge
              variant={balance?.status === 'ACTIVE' ? 'success' : 'destructive'}
              className="text-xs font-semibold"
            >
              {balance?.status || 'Unknown'}
            </Badge>
            <p className="mt-3 text-xs text-warm-500 font-medium">
              School: {balance?.schoolName || '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" /> Currency
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <span className="text-lg font-semibold text-charcoal-900">
              {balance?.currency || 'USD'}
            </span>
          </CardContent>
        </Card>
      </div>

      {isLow && (
        <Card className="border-terracotta-200 bg-terracotta-50/50">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-terracotta-700 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-terracotta-900">
                  Low SMS credit balance
                </p>
                <p className="mt-1 text-sm text-terracotta-700">
                  Your SMS credit balance is below 10 credits. Purchase more credits to
                  ensure uninterrupted messaging.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-charcoal-900">Recent Transactions</h2>
          <p className="text-warm-500 text-sm">
            SMS credit purchases and usage history.
          </p>
        </div>
        <Link href="/dashboard/sms/purchase">
          <Button leftIcon={<CreditCard className="w-4 h-4" />}>
            Purchase Credits
          </Button>
        </Link>
      </div>

      <Card>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-xs text-warm-400 text-center py-8">
              No SMS credit transactions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warm-200">
                <thead className="bg-ivory-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Date</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Description</th>
                    <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Type</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Credits</th>
                    <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-ivory-50">
                      <td className="px-5 py-4 text-xs font-medium text-charcoal-900">
                        {new Date(tx.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-charcoal-900 truncate max-w-xs">
                        {tx.description}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-charcoal-900">
                        <Badge variant="neutral" className="text-[10px]">
                          {tx.type}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-charcoal-900 text-right">
                        {tx.type === 'PURCHASE' ? `+${tx.credits}` : `-${tx.credits}`}
                      </td>
                      <td className="px-5 py-4 text-xs font-medium text-charcoal-900 text-right">
                        {tx.currency} {tx.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
