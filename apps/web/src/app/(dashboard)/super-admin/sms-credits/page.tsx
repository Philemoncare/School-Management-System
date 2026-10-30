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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SchoolSmsCredit {
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  status: string;
  currency: string;
  smsCreditBalance: number;
}

export default function SuperAdminSmsCredits() {
  const [credits, setCredits] = useState<SchoolSmsCredit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUp, setTopUp] = useState({ schoolId: '', amount: '', reason: '' });
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadCredits();
  }, []);

  async function loadCredits() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/super-admin/sms-credits');
      setCredits(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Unable to load SMS credits');
    } finally {
      setLoading(false);
    }
  }

  async function handleTopUp(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/super-admin/sms-credits/topup', {
        method: 'POST',
        body: JSON.stringify({
          schoolId: topUp.schoolId,
          amount: parseFloat(topUp.amount),
          reason: topUp.reason,
        }),
      });
      setTopUpOpen(false);
      setTopUp({ schoolId: '', amount: '', reason: '' });
      loadCredits();
    } catch (err: any) {
      setError(err.message || 'Failed to top up SMS credits');
    } finally {
      setSaving(false);
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
          onClick={() => setTopUpOpen(true)}
          className="bg-forest-800 text-primary-foreground hover:bg-forest-900"
        >
          <Plus size={18} /> Top Up SMS Credits
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
                            setTopUp({ schoolId: credit.schoolId, amount: '', reason: '' });
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

      {/* Top Up Modal */}
      {topUpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setTopUpOpen(false)} />
          <div className="relative bg-card w-full max-w-md p-6 shadow-xl rounded-xl border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Top Up SMS Credits</h3>
              <Button
                size="sm"
                className="text-xs"
                onClick={() => setTopUpOpen(false)}
              >
                ✕
              </Button>
            </div>
            <form onSubmit={handleTopUp} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">School</label>
                <SelectPlaceholder
                  value={topUp.schoolId}
                  onChange={(e) => setTopUp({ ...topUp, schoolId: e.target.value })}
                >
                  {credits.map((c) => (
                    <option key={c.schoolId} value={c.schoolId}>
                      {c.schoolName} ({c.schoolCode})
                    </option>
                  ))}
                </SelectPlaceholder>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Amount (credits)</label>
                <Input
                  type="number"
                  min="1"
                  value={topUp.amount}
                  onChange={(e) => setTopUp({ ...topUp, amount: e.target.value })}
                  placeholder="e.g. 100"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">Reason</label>
                <Input
                  value={topUp.reason}
                  onChange={(e) => setTopUp({ ...topUp, reason: e.target.value })}
                  placeholder="e.g. SMS token purchase Q1 2026"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setTopUpOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={saving}>
                  {saving ? 'Processing...' : 'Confirm Top Up'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SelectPlaceholder({ children, value, onChange }: any) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="w-full px-3 py-2 bg-input border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/50"
    >
      <option value="" disabled>
        Select a school
      </option>
      {children}
    </select>
  );
}
