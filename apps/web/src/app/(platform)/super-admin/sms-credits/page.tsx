'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  Building2,
  Search,
  Plus,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Phone,
  CreditCard,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchoolSmsCredit {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  status: string;
  currency: string;
  smsCreditBalance: number;
}

interface SmsPackageOption {
  id: string;
  name: string;
  code: string;
  credits: number;
  price: string | number;
  currency: string;
  status: string;
}

interface CreditTransaction {
  id: string;
  schoolName: string;
  schoolCode: string;
  packageCode: string;
  packageName: string;
  credits: number;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  externalReference: string | null;
  purchasedAt: string;
  completedAt: string | null;
}

export default function SuperAdminSmsCredits() {
  const [credits, setCredits] = useState<SchoolSmsCredit[]>([]);
  const [packages, setPackages] = useState<SmsPackageOption[]>([]);
  const [ledger, setLedger] = useState<CreditTransaction[]>([]);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUp, setTopUp] = useState({ schoolId: '', packageId: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState('');
  const [confirmTarget, setConfirmTarget] = useState<CreditTransaction | null>(null);
  const [confirmReference, setConfirmReference] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCredits();
  }, []);

  async function loadCredits() {
    setLoading(true);
    setError('');
    try {
      const [data, pkgs, log] = await Promise.all([
        apiFetch('/super-admin/sms-credits'),
        // A grant must reference a real package, so the catalogue is part of
        // this page's contract. A failure here must not blank the balances.
        apiFetch('/super-admin/sms-packages').catch(() => []),
        apiFetch('/super-admin/sms-credits/transactions?take=50').catch(() => ({ items: [] })),
      ]);
      setCredits(Array.isArray(data) ? data : []);
      setPackages(Array.isArray(pkgs) ? pkgs.filter((p: SmsPackageOption) => p.status === 'ACTIVE') : []);
      setLedger(Array.isArray(log?.items) ? log.items : []);
      setAwaitingConfirmation(Number(log?.awaitingConfirmation) || 0);
    } catch (err: any) {
      setError(err.message || 'Unable to load SMS credits');
    } finally {
      setLoading(false);
    }
  }

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    if (!topUp.schoolId) {
      setError('Choose the school that should receive the credits.');
      return;
    }
    if (!topUp.packageId) {
      setError('Choose an SMS package. Credits are defined by the package, not typed in.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await apiFetch('/super-admin/sms-credits/topup', {
        method: 'POST',
        body: JSON.stringify({
          schoolId: topUp.schoolId,
          packageId: topUp.packageId,
          reason: topUp.reason,
        }),
      });
      setTopUpOpen(false);
      setTopUp({ schoolId: '', packageId: '', reason: '' });
      setNotice(
        `Granted ${result?.creditsAdded ?? 0} credits to ${result?.schoolName || 'the school'}. New balance: ${result?.newBalance ?? 0}.`,
      );
      await loadCredits();
    } catch (err: any) {
      setError(err.message || 'Failed to top up SMS credits');
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    if (!confirmTarget) return;
    const reference = confirmReference.trim();
    if (reference.length < 3) {
      setError('A payment reference is required before credits can be delivered.');
      return;
    }
    const transaction = confirmTarget;
    setConfirming(transaction.id);
    setError('');
    try {
      await apiFetch(`/super-admin/sms-packages/purchases/${transaction.id}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ reference }),
      });
      setNotice(
        `Confirmed payment for ${transaction.schoolName}; ${transaction.credits.toLocaleString()} credits delivered.`,
      );
      setConfirmTarget(null);
      setConfirmReference('');
      await loadCredits();
    } catch (err: any) {
      setError(err.message || 'Unable to confirm this purchase');
    } finally {
      setConfirming('');
    }
  }

  const filtered = credits.filter(
    (c) =>
      c.schoolName.toLowerCase().includes(search.toLowerCase()) ||
      c.schoolCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
          SMS Credit Management
        </h1>
        <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">
          Purchase and allocate SMS tokens for schools. Each SMS sent deducts one credit from the school&rsquo;s balance.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      {notice && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-forest-200 bg-forest-50 px-4 py-3 text-sm font-semibold text-forest-800">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice('')} className="text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {packages.length === 0 && !loading && (
        <div className="rounded-xl border border-terracotta-200 bg-terracotta-50 px-4 py-3 text-sm font-semibold text-terracotta-800">
          No active SMS packages exist, so credits cannot be granted yet.{' '}
          <Link href="/super-admin/sms-packages" className="underline">
            Create a package
          </Link>{' '}
          first — a grant always takes its credit count and price from a real package.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search schools..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          onClick={() => {
            setTopUp({ schoolId: '', packageId: '', reason: '' });
            setTopUpOpen(true);
          }}
          className="bg-forest-800 text-primary-foreground hover:bg-forest-900"
        >
          <Plus size={18} /> Grant SMS Credits
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between px-5 py-3">
          <CardTitle className="text-base">School SMS Balances</CardTitle>
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            {credits.length} schools
          </span>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-ivory-50">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase">
                    School
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase">
                    Code
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase text-right">
                    SMS Credits
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase text-right">
                    Currency
                  </th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase text-right">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      No schools found
                    </td>
                  </tr>
                ) : (
                  filtered.map((credit) => (
                    <tr
                      key={credit.schoolId}
                      className="border-b border-border/50 hover:bg-ivory-50/50 transition-colors"
                    >
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{credit.schoolName}</div>
                      </td>
                      <td className="px-5 py-4 text-xs font-mono text-muted-foreground">
                        {credit.schoolCode}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            credit.status === 'ACTIVE'
                              ? 'bg-forest-50 text-forest-700 border border-forest-100'
                              : credit.status === 'SUSPENDED'
                                ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-100'
                                : 'bg-muted/50 text-muted-foreground border border-border/50'
                          }`}
                        >
                          {credit.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">
                        {credit.smsCreditBalance === 0 && (
                          <AlertTriangle className="mr-2 text-terracotta-500 w-3 h-3" />
                        )}
                        {credit.smsCreditBalance.toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right text-xs text-muted-foreground">
                        {credit.currency}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => {
                            setTopUp({ schoolId: credit.schoolId, packageId: '', reason: '' });
                            setTopUpOpen(true);
                          }}
                          className={`text-xs ${
                            credit.smsCreditBalance === 0
                              ? 'bg-terracotta-500 text-primary-foreground hover:bg-terracotta-600'
                              : 'bg-forest-500 text-primary-foreground hover:bg-forest-600'
                          }`}
                        >
                          {credit.smsCreditBalance === 0 ? 'Purchase Credits' : 'Top Up'}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </div>

      {/* Credit transaction history - every grant and every school request */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between px-5 py-3">
          <CardTitle className="text-base flex items-center gap-2">
            Credit Transaction History
            {awaitingConfirmation > 0 && (
              <span className="rounded-full bg-terracotta-100 px-2 py-0.5 text-[10px] font-bold uppercase text-terracotta-700">
                {awaitingConfirmation} awaiting confirmation
              </span>
            )}
          </CardTitle>
          <Button variant="outline" size="sm" className="text-xs" onClick={loadCredits}>
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/50 bg-ivory-50">
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase">School</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase">Package</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase text-right">Credits</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase text-right">Value</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase">Recorded</th>
                  <th className="px-5 py-3.5 text-[11px] font-bold text-muted-foreground uppercase">Outcome</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </td>
                  </tr>
                ) : ledger.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-muted-foreground">
                      No credits have been granted or purchased yet.
                    </td>
                  </tr>
                ) : (
                  ledger.map((txn) => (
                    <tr key={txn.id} className="border-b border-border/50 hover:bg-ivory-50/50">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-foreground">{txn.schoolName}</div>
                        <div className="text-[11px] font-mono text-muted-foreground">{txn.schoolCode}</div>
                      </td>
                      <td className="px-5 py-4 text-sm">
                        {txn.packageName}
                        <div className="text-[11px] text-muted-foreground">
                          {txn.provider === 'platform' ? 'Platform allocation' : `Provider: ${txn.provider}`}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right font-semibold">{txn.credits.toLocaleString()}</td>
                      <td className="px-5 py-4 text-right text-sm">
                        {txn.currency} {txn.amount.toFixed(2)}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {new Date(txn.purchasedAt).toLocaleString()}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            txn.status === 'COMPLETED'
                              ? 'bg-forest-50 text-forest-700 border border-forest-100'
                              : txn.status === 'PENDING'
                                ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-100'
                                : 'bg-muted/50 text-muted-foreground border border-border/50'
                          }`}
                        >
                          {txn.status}
                        </span>
                        {txn.status === 'PENDING' && (
                          <Button
                            size="sm"
                            className="ml-2 text-xs bg-forest-800 text-primary-foreground hover:bg-forest-900"
                            disabled={confirming === txn.id}
                            onClick={() => setConfirmTarget(txn)}
                          >
                            {confirming === txn.id ? 'Confirming...' : 'Confirm payment'}
                          </Button>
                        )}
                        {txn.externalReference && (
                          <div className="mt-1 text-[11px] font-mono text-muted-foreground">
                            ref {txn.externalReference}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </div>

      <Modal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        title="Grant SMS Credits"
        footerActions={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setTopUpOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="sms-grant-form"
              size="sm"
              disabled={saving || packages.length === 0}
            >
              {saving ? 'Processing...' : 'Confirm Grant'}
            </Button>
          </>
        }
      >
        <form id="sms-grant-form" onSubmit={handleTopUp} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">School</label>
            <select
              value={topUp.schoolId}
              onChange={(e) => setTopUp({ ...topUp, schoolId: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/50"
            >
              <option value="" disabled>
                Select a school
              </option>
              {credits.map((c) => (
                <option key={c.schoolId} value={c.schoolId}>
                  {c.schoolName} ({c.schoolCode}) — {c.smsCreditBalance.toLocaleString()} credits
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Package</label>
            <select
              value={topUp.packageId}
              onChange={(e) => setTopUp({ ...topUp, packageId: e.target.value })}
              className="w-full px-3 py-2 bg-input border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/50"
            >
              <option value="" disabled>
                Select an SMS package
              </option>
              {packages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) — {Number(p.credits).toLocaleString()} credits @{' '}
                  {p.currency} {Number(p.price).toFixed(2)}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              The credit count and price come from the package record, so a grant cannot be
              over- or under-stated here.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">Reason</label>
            <Input
              value={topUp.reason}
              onChange={(e) => setTopUp({ ...topUp, reason: e.target.value })}
              placeholder="e.g. Q1 2026 parent notice allocation"
              required
              minLength={3}
            />
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(confirmTarget)}
        onClose={() => setConfirmTarget(null)}
        title="Confirm payment received"
        size="sm"
        footerActions={
          <>
            <Button type="button" variant="outline" size="sm" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="sms-confirm-form"
              size="sm"
              disabled={Boolean(confirming)}
            >
              {confirming ? 'Confirming...' : 'Deliver credits'}
            </Button>
          </>
        }
      >
        {confirmTarget && (
          <form id="sms-confirm-form" onSubmit={handleConfirm} className="space-y-4">
            <p className="text-sm text-foreground/90">
              {confirmTarget.schoolName} requested <b>{confirmTarget.packageName}</b> (
              {confirmTarget.credits.toLocaleString()} credits) for{' '}
              <b>
                {confirmTarget.currency} {confirmTarget.amount.toFixed(2)}
              </b>
              . Credits are only added once you have verified the payment outside this screen.
            </p>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Payment reference</label>
              <Input
                value={confirmReference}
                onChange={(e) => setConfirmReference(e.target.value)}
                placeholder="e.g. MoMo transaction ID or invoice number"
                required
                minLength={3}
              />
              <p className="text-[11px] text-muted-foreground">
                Stored on the purchase row and in the audit log, so the delivery is attributable.
              </p>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
