'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Wallet, CreditCard, Receipt, FileText, CheckCircle, AlertCircle, Lock, Inbox, RefreshCw } from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { useChild } from '@/context/child-context';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

const money = (value: unknown) =>
  `GH₵ ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function ParentFees() {
  const { activeChild, loading: childLoading } = useChild();
  const { activeSchoolId } = useAuth();
  const [finance, setFinance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);

  async function load() {
    if (!activeChild || !activeSchoolId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setDenied(false);
    try {
      const data = await apiFetch(`/parent/children/${activeChild.id}/finance`);
      setFinance(data || { invoices: [], payments: [], receipts: [] });
    } catch (err) {
      setFinance(null);
      if (err instanceof ApiError && err.isPermissionDenied()) setDenied(true);
      else setError(err instanceof Error ? err.message : 'Could not load fee records.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChild?.id, activeSchoolId]);

  const totals = useMemo(() => {
    const invoices: any[] = Array.isArray(finance?.invoices) ? finance.invoices : [];
    const billed = invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);
    const paid = invoices.reduce((sum, invoice) => sum + Number(invoice.amountPaid || 0), 0);
    const outstanding = invoices.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0);
    return { billed, paid, outstanding };
  }, [finance]);

  if (childLoading || (loading && !!activeChild)) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-xs font-semibold text-warm-500">
        <RefreshCw size={16} className="animate-spin" /> Loading fee records…
      </div>
    );
  }

  if (!activeChild) {
    return (
      <EmptyState
        title="No child linked yet"
        description="Your school has not linked a student record to this guardian account. Contact the school office to complete the link."
        icon={<Inbox className="h-8 w-8" />}
        actionButton={<Link href="/parent/children"><Button variant="outline" size="sm">Family Overview</Button></Link>}
      />
    );
  }

  if (denied) {
    return (
      <EmptyState
        title="Fee records are not available"
        description="Your account does not have permission to view this child's financial records."
        icon={<Lock className="h-8 w-8" />}
      />
    );
  }

  const invoices: any[] = Array.isArray(finance?.invoices) ? finance.invoices : [];
  const payments: any[] = Array.isArray(finance?.payments) ? finance.payments : [];
  const receipts: any[] = Array.isArray(finance?.receipts) ? finance.receipts : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-charcoal-900 sm:text-2xl">Fees & Finance</h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Balances and payment history for {activeChild.firstName} {activeChild.lastName}.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} isLoading={loading} leftIcon={<RefreshCw size={15} />}>
          Refresh
        </Button>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-medium text-danger-800">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Metric icon={<FileText size={18} className="text-forest-700" />} label="Total billed" value={money(totals.billed)} />
        <Metric icon={<CheckCircle size={18} className="text-success-600" />} label="Total paid" value={money(totals.paid)} />
        <Metric
          icon={<Wallet size={18} className="text-danger-600" />}
          label="Outstanding balance"
          value={money(totals.outstanding)}
          tone={totals.outstanding > 0 ? 'danger' : 'success'}
        />
      </div>

      <p className="rounded-xl border border-warm-200 bg-ivory-50 px-4 py-3 text-xs font-medium text-warm-600">
        <CreditCard size={14} className="mr-1.5 inline-block align-text-bottom" />
        Online card payments are not enabled for this school. Pay at the school office or contact the bursar to settle a balance and receive a receipt.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
          <div className="flex items-center gap-2 border-b border-warm-100 p-5 sm:p-6">
            <FileText size={20} className="text-forest-700" />
            <h2 className="font-bold text-charcoal-900">Invoice Statements</h2>
          </div>
          <div className="max-h-[500px] divide-y divide-warm-100 overflow-y-auto">
            {invoices.length === 0 ? (
              <p className="p-6 text-center text-sm text-warm-500">No invoice history available.</p>
            ) : (
              invoices.map((invoice: any) => (
                <div key={invoice.id} className="flex flex-col gap-2 p-4 transition-colors hover:bg-ivory-50/60 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-charcoal-900">{invoice.invoiceNumber}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase text-warm-400">
                      Due {new Date(invoice.dueDate).toLocaleDateString()}
                    </p>
                    <div className="mt-2 space-y-1">
                      {(invoice.items || []).map((item: any) => (
                        <p key={item.id} className="text-xs font-medium text-warm-500">• {item.description}</p>
                      ))}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-start gap-3 sm:flex-col sm:items-end">
                    <p className="text-sm font-semibold text-charcoal-900">{money(invoice.totalAmount)}</p>
                    <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                      invoice.status === 'PAID'
                        ? 'border-success-100 bg-success-50 text-success-700'
                        : invoice.status === 'VOID' || invoice.status === 'CANCELLED'
                          ? 'border-warm-200 bg-ivory-50 text-warm-500'
                          : 'border-warning-100 bg-warning-50 text-warning-700'
                    }`}>
                      {invoice.status}
                    </span>
                    {Number(invoice.balance) > 0 && (
                      <span className="text-[11px] font-bold text-danger-600">Balance {money(invoice.balance)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-xs">
          <div className="flex items-center gap-2 border-b border-warm-100 p-5 sm:p-6">
            <Receipt size={20} className="text-success-600" />
            <h2 className="font-bold text-charcoal-900">Payments & Receipts</h2>
          </div>
          <div className="max-h-[500px] divide-y divide-warm-100 overflow-y-auto">
            {payments.length === 0 ? (
              <p className="p-6 text-center text-sm text-warm-500">No payment transactions found.</p>
            ) : (
              payments.map((payment: any) => (
                <div key={payment.id} className="flex items-start justify-between gap-3 p-4 transition-colors hover:bg-ivory-50/60">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-charcoal-900">{payment.paymentReference || payment.reference || 'Payment'}</p>
                    <p className="mt-0.5 text-[11px] font-semibold uppercase text-warm-400">
                      {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : '—'} via {payment.paymentMethod || '—'}
                    </p>
                    {(payment.receipts || []).map((receipt: any) => (
                      <p key={receipt.id} className="mt-1 text-[11px] font-medium text-warm-500">
                        Receipt {receipt.receiptNumber || receipt.id}
                      </p>
                    ))}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <p className="text-sm font-semibold text-success-600">{money(payment.amount)}</p>
                    <span className="flex items-center gap-1 rounded-md border border-success-100 bg-success-50 px-2 py-0.5 text-[11px] font-bold text-success-700">
                      <CheckCircle size={10} /> {payment.status}
                    </span>
                  </div>
                </div>
              ))
            )}
            {receipts.length > 0 && (
              <div className="p-4">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-warm-400">Issued receipts</p>
                <div className="space-y-1">
                  {receipts.map((receipt: any) => (
                    <div key={receipt.id} className="flex justify-between text-xs font-medium text-warm-600">
                      <span>{receipt.receiptNumber || receipt.id}</span>
                      <span>{money(receipt.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Metric({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: string; tone?: 'danger' | 'success' }) {
  return (
    <div className={`rounded-2xl border bg-card p-4 shadow-xs sm:p-5 ${tone === 'danger' ? 'border-danger-200' : tone === 'success' ? 'border-success-200' : 'border-warm-200'}`}>
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">{label}</p>
        {icon}
      </div>
      <p className={`mt-2 text-xl font-semibold ${tone === 'danger' ? 'text-danger-600' : tone === 'success' ? 'text-success-600' : 'text-charcoal-900'}`}>
        {value}
      </p>
    </div>
  );
}
