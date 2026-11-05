'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DollarSign,
  Download,
  Loader2,
  Search,
  TrendingUp,
} from 'lucide-react';
import { Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SuperAdminRevenue() {
  const [summary, setSummary] = useState<any>(null);
  const [tab, setTab] = useState<'invoices' | 'payments'>('invoices');
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const take = 20;

  const invoiceStatuses = ['DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'VOID', 'CANCELLED'];
  const paymentStatuses = ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED'];

  useEffect(() => {
    apiFetch('/super-admin/billing/summary')
      .then(setSummary)
      .catch((err) => setError(err.message || 'Unable to load billing summary'));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadData();
  }, [tab, debouncedSearch, status, page]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams({
        skip: String((page - 1) * take),
        take: String(take),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(status && { status }),
      });
      setData(await apiFetch(`/super-admin/billing/${tab}?${query}`));
    } catch (err: any) {
      setError(err.message || 'Unable to load billing records');
    } finally {
      setLoading(false);
    }
  }

  function exportCsv() {
    const rows = tab === 'invoices'
      ? [['Invoice', 'School', 'Issued', 'Due', 'Total', 'Paid', 'Currency', 'Status']].concat(
          data.items.map((item: any) => [
            item.invoiceNumber,
            item.school?.name || '',
            new Date(item.issueDate).toISOString().slice(0, 10),
            new Date(item.dueDate).toISOString().slice(0, 10),
            item.total,
            item.amountPaid,
            item.currency,
            item.status,
          ]),
        )
      : [['Reference', 'School', 'Provider', 'Invoice', 'Amount', 'Currency', 'Status', 'Date']].concat(
          data.items.map((item: any) => [
            item.paymentReference,
            item.school?.name || '',
            item.provider,
            item.invoice?.invoiceNumber || '',
            item.amount,
            item.currency,
            item.status,
            new Date(item.paymentDate).toISOString().slice(0, 10),
          ]),
        );

    const csv = rows.map((row: any[]) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `schoolma-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function switchTab(next: 'invoices' | 'payments') {
    setTab(next);
    setStatus('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 tracking-tight">Platform Revenue</h1>
          <p className="text-warm-500 font-medium mt-1">Live SaaS invoices, payments, and subscription revenue.</p>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!data.items.length} leftIcon={<Download size={18} />}>Export current page</Button>
      </div>

      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <StatCard title="Total Collected" value={summary ? money(summary.totalPaid, summary.currency) : '...'} detail={`${summary?.paymentCounts?.SUCCESS || 0} successful payments`} icon={<TrendingUp className="text-forest-700" />} />
        <StatCard title="MRR" value={summary ? money(summary.mrr, summary.currency) : '...'} detail={`${money(summary?.arr, summary?.currency)} annualized`} icon={<DollarSign className="text-success-600" />} />
        <StatCard title="Outstanding" value={summary ? money(summary.outstanding, summary.currency) : '...'} detail={`${summary?.invoiceCounts?.OVERDUE || 0} overdue invoices`} icon={<CreditCard className="text-terracotta-600" />} />
        <StatCard title="Active Subscriptions" value={summary?.activeSubscriptions ?? '...'} detail={`${summary?.pastDueSubscriptions || 0} past due`} icon={<ArrowUpRight className="text-forest-700" />} />
      </div>

      <div className="bg-card border border-warm-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-1 border-b border-warm-100 px-4 pt-4">
          <button onClick={() => switchTab('invoices')} className={`rounded-t-xl px-4 py-2.5 text-sm font-bold ${tab === 'invoices' ? 'bg-ivory-50 text-forest-800' : 'text-warm-500 hover:text-charcoal-900'}`}>
            Invoices ({summary?.invoiceCounts ? Object.values(summary.invoiceCounts).reduce<number>((sum, value) => sum + Number(value), 0) : 0})
          </button>
          <button onClick={() => switchTab('payments')} className={`rounded-t-xl px-4 py-2.5 text-sm font-bold ${tab === 'payments' ? 'bg-ivory-50 text-forest-800' : 'text-warm-500 hover:text-charcoal-900'}`}>
            Payments ({summary?.paymentCounts ? Object.values(summary.paymentCounts).reduce<number>((sum, value) => sum + Number(value), 0) : 0})
          </button>
        </div>

        <div className="p-4 sm:p-6 border-b border-warm-100 flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-ivory-50/50">
          <div className="flex-1 bg-card border border-warm-200 px-4 py-2.5 rounded-xl flex items-center shadow-sm">
            <Search size={18} className="text-warm-400 mr-3 shrink-0" />
            <input
              type="text"
              placeholder={tab === 'invoices' ? 'Search invoice number or school...' : 'Search reference, provider, invoice or school...'}
              className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold outline-none"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="bg-card border border-warm-200 rounded-xl px-4 py-2.5 text-sm font-bold">
            <option value="">All statuses</option>
            {(tab === 'invoices' ? invoiceStatuses : paymentStatuses).map((option) => <option key={option} value={option}>{option}</option>)}
          </Select>
          <Button variant="ghost" onClick={loadData}>Refresh</Button>
        </div>

        <div className="relative overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}
          {tab === 'invoices' ? (
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Invoice</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">School</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Plan</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Due</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-warm-400 uppercase">Total</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-warm-400 uppercase">Paid</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {data.items.map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-ivory-50/60">
                    <td className="px-5 py-4 text-xs font-semibold text-charcoal-900">{invoice.invoiceNumber}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-warm-700">{invoice.school?.name}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-warm-500">{invoice.subscription?.plan?.name || '-'}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-warm-500">{new Date(invoice.dueDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right text-xs font-semibold text-charcoal-900">{money(invoice.total, invoice.currency)}</td>
                    <td className="px-5 py-4 text-right text-xs font-semibold text-success-700">{money(invoice.amountPaid, invoice.currency)}</td>
                    <td className="px-5 py-4"><StatusBadge status={invoice.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50">
                <tr>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Reference</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">School</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Provider</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Invoice</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold text-warm-400 uppercase">Amount</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Date</th>
                  <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100 bg-card">
                {data.items.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-ivory-50/60">
                    <td className="px-5 py-4 text-xs font-semibold text-charcoal-900">{payment.paymentReference}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-warm-700">{payment.school?.name}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-warm-500">{payment.provider}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-warm-500">{payment.invoice?.invoiceNumber || '-'}</td>
                    <td className="px-5 py-4 text-right text-xs font-semibold text-charcoal-900">{money(payment.amount, payment.currency)}</td>
                    <td className="px-5 py-4 text-xs font-semibold text-warm-500">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                    <td className="px-5 py-4"><StatusBadge status={payment.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {data.items.length === 0 && !loading && (
            <div className="py-20 text-center">
              <CreditCard className="mx-auto text-warm-200 mb-4" size={64} />
              <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No {tab} found</p>
              <p className="text-warm-400 text-sm mt-1">Billing records created by real subscription activity will appear here.</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 bg-ivory-50/50 border-t border-warm-100 flex items-center justify-between">
          <p className="text-xs font-bold text-warm-400 uppercase">Showing {data.items.length} of {data.total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="p-2 bg-card border border-warm-200 rounded-xl disabled:opacity-30 shadow-sm">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setPage((value) => value + 1)} disabled={page * take >= data.total} className="p-2 bg-card border border-warm-200 rounded-xl disabled:opacity-30 shadow-sm">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function money(value: any, currency = 'GHS') {
  return `${currency} ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function StatCard({ title, value, detail, icon }: any) {
  return (
    <div className="bg-card border border-warm-200 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2.5 bg-ivory-50 rounded-xl">{icon}</div>
      </div>
      <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-semibold text-charcoal-900 mt-1">{value}</p>
      <p className="text-[11px] font-semibold text-warm-400 mt-1">{detail}</p>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const styles: any = {
    PAID: 'bg-success-100 text-success-700',
    SUCCESS: 'bg-success-100 text-success-700',
    ISSUED: 'bg-warning-100 text-warning-700',
    PENDING: 'bg-warning-100 text-warning-700',
    PROCESSING: 'bg-warning-100 text-warning-700',
    OVERDUE: 'bg-danger-100 text-danger-700',
    FAILED: 'bg-danger-100 text-danger-700',
    VOID: 'bg-warm-100 text-warm-600',
    CANCELLED: 'bg-warm-100 text-warm-600',
    REFUNDED: 'bg-terracotta-100 text-terracotta-700',
    DRAFT: 'bg-warm-100 text-warm-600',
  };
  return <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${styles[status] || 'bg-warm-100 text-warm-600'}`}>{status}</span>;
}
