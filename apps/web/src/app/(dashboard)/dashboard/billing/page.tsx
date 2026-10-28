'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { EmptyState } from '@/components/ui/empty-state';
import { showFeedback } from '@/components/layout/global-feedback';
import {
  CreditCard,
  ShieldCheck,
  Clock,
  ArrowUpCircle,
  CheckCircle,
  Loader2,
  AlertCircle,
  XCircle,
  Package,
} from 'lucide-react';
import Link from 'next/link';

const INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: '/mo',
  QUARTERLY: '/quarter',
  ANNUALLY: '/year',
  YEARLY: '/year',
};

function formatAmount(amount: unknown, currency: unknown) {
  const value = Number(amount ?? 0);
  const code = String(currency ?? 'GHS').toUpperCase();
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code,
      minimumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${code} ${value.toFixed(2)}`;
  }
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    const [subResult, plansResult, usageResult] = await Promise.allSettled([
      apiFetch('/subscriptions/my-subscription'),
      apiFetch('/subscriptions/plans'),
      apiFetch('/subscriptions/usage'),
    ]);

    if (subResult.status === 'fulfilled') {
      setSubscription(subResult.value);
    } else {
      const message = String((subResult.reason as any)?.message ?? '');
      if (!/not found/i.test(message)) {
        setError(message || 'Could not load your subscription.');
      }
      setSubscription(null);
    }

    if (plansResult.status === 'fulfilled') {
      setPlans(Array.isArray(plansResult.value) ? plansResult.value : []);
    } else {
      setPlans([]);
      setError((current) => current || 'Could not load available plans.');
    }

    if (usageResult.status === 'fulfilled') {
      setUsage(usageResult.value);
    } else {
      setUsage(null);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const currentPlanId = subscription?.planId ?? subscription?.plan?.id;
  const currentPricingId = subscription?.pricingId ?? subscription?.pricing?.id;
  const currentAmount = Number(subscription?.pricing?.amount ?? 0);

  const planCards = useMemo(
    () =>
      plans.map((plan) => {
        const pricing = Array.isArray(plan.pricing) ? plan.pricing[0] : null;
        return { ...plan, pricing };
      }),
    [plans],
  );

  async function switchPlan(plan: any) {
    if (busyId) return;
    const pricing = plan.pricing;
    if (!pricing) {
      showFeedback('ERROR', 'This plan has no active pricing yet.');
      return;
    }
    if (plan.id === currentPlanId) return;

    if (!subscription) {
      if (!window.confirm(`Subscribe this school to the ${plan.name} plan?`)) return;
      setBusyId(plan.id);
      try {
        await apiFetch(`/subscriptions/subscribe/${plan.id}`, { method: 'POST' });
        showFeedback('SUCCESS', `Subscribed to ${plan.name}.`);
        await loadData();
      } catch (err: any) {
        showFeedback('ERROR', err?.message || 'Could not subscribe to this plan.');
      } finally {
        setBusyId(null);
      }
      return;
    }

    const isUpgrade = Number(pricing.amount) >= currentAmount;
    if (
      !window.confirm(
        `${isUpgrade ? 'Upgrade' : 'Downgrade'} from ${subscription.plan?.name ?? 'your current plan'} to ${plan.name}?`,
      )
    ) {
      return;
    }
    setBusyId(plan.id);
    try {
      await apiFetch(
        `/subscriptions/${isUpgrade ? 'upgrade' : 'downgrade'}/${pricing.id}`,
        { method: 'POST' },
      );
      showFeedback(
        'SUCCESS',
        isUpgrade
          ? `Upgraded to ${plan.name}.`
          : `Downgrade to ${plan.name} scheduled for the next billing period.`,
      );
      await loadData();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not change the plan.');
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-16 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading billing information…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            Billing &amp; Subscription
          </h1>
          <p className="mt-1 text-sm font-medium text-warm-500">
            Manage the platform plan for this school and monitor usage.
          </p>
        </div>
        <Link
          href="/dashboard/billing/history"
          className="inline-flex items-center gap-1 text-sm font-semibold text-forest-700 hover:underline"
        >
          View Billing History <Clock size={16} />
        </Link>
      </div>

      {error && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> {error}
          </span>
          <Button variant="outline" size="sm" onClick={loadData}>
            Try again
          </Button>
        </div>
      )}

      {!subscription ? (
        <div className="rounded-2xl border border-warm-200 bg-card p-6">
          <EmptyState
            icon={<CreditCard className="h-8 w-8" />}
            title="No active subscription"
            description="Choose a plan below to activate billing for this school."
            actionButton={
              planCards.length > 0 ? (
                <Button
                  onClick={() =>
                    document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' })
                  }
                >
                  View plans
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="relative overflow-hidden rounded-3xl border border-warm-200 bg-card p-6 shadow-sm sm:p-8 lg:col-span-2">
            <div className="relative z-10">
              <div className="mb-6 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-forest-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
                  Current Plan
                </span>
                <h2 className="text-2xl font-semibold text-charcoal-900 sm:text-3xl">
                  {subscription.plan?.name ?? 'Plan'}
                </h2>
              </div>

              <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">Status</p>
                  <div className="flex items-center gap-2">
                    {String(subscription.status) === 'ACTIVE' || String(subscription.status) === 'TRIALING' ? (
                      <CheckCircle className="text-success-500" size={18} />
                    ) : (
                      <XCircle className="text-danger-500" size={18} />
                    )}
                    <span className="text-sm font-semibold uppercase tracking-tight text-charcoal-900">
                      {String(subscription.status).replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">Billing amount</p>
                  <p className="font-semibold text-charcoal-900">
                    {formatAmount(subscription.pricing?.amount, subscription.pricing?.currency)}
                    <span className="ml-1 text-xs font-medium uppercase text-warm-400">
                      {INTERVAL_LABELS[String(subscription.pricing?.interval)] ?? ''}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                    {subscription.cancelledAt ? 'Access ends' : 'Next renewal'}
                  </p>
                  <p className="font-semibold text-charcoal-900">
                    {subscription.currentPeriodEnd
                      ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                      : '—'}
                  </p>
                </div>
              </div>

              {subscription.cancelledAt && (
                <p className="mb-4 rounded-xl bg-warning-50 p-3 text-xs font-semibold text-warning-800">
                  This subscription was cancelled
                  {subscription.cancellationReason ? `: ${subscription.cancellationReason}` : '.'}
                </p>
              )}

              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() =>
                    document.getElementById('available-plans')?.scrollIntoView({ behavior: 'smooth' })
                  }
                  leftIcon={<ArrowUpCircle size={18} />}
                >
                  Change Plan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCancelOpen(true)}
                  disabled={Boolean(subscription.cancelledAt)}
                >
                  Cancel Subscription
                </Button>
              </div>
            </div>
            <ShieldCheck size={200} className="absolute -bottom-10 -right-10 -rotate-12 text-ivory-50" />
          </div>

          <div className="rounded-3xl bg-charcoal-900 p-6 text-white shadow-sm sm:p-8">
            <h3 className="mb-6 text-lg font-semibold">Usage Summary</h3>
            <div className="space-y-5">
              <UsageItem label="Students" current={usage?.students ?? 0} limit={subscription.plan?.features?.students} />
              <UsageItem label="Teachers" current={usage?.teachers ?? 0} limit={subscription.plan?.features?.staff} />
              <UsageItem label="Staff accounts" current={usage?.staff ?? 0} limit={subscription.plan?.features?.staff} />
            </div>
          </div>
        </div>
      )}

      <div id="available-plans">
        <h2 className="mb-5 text-xl font-semibold text-charcoal-900">Available Plans</h2>
        {planCards.length === 0 ? (
          <EmptyState
            icon={<Package className="h-8 w-8" />}
            title="No plans available"
            description="A platform administrator needs to publish subscription plans before a school can subscribe."
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {planCards.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isScheduled = subscription?.scheduledPlanId === plan.id;
              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-3xl border-2 p-6 transition-all sm:p-8 ${
                    isCurrent
                      ? 'border-forest-700 bg-sage-50/20 shadow-sm'
                      : 'border-warm-100 bg-card hover:border-warm-200'
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-2">
                    {isCurrent ? (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">
                        Your active plan
                      </span>
                    ) : isScheduled ? (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-warning-700">
                        Scheduled next period
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                        {plan.code}
                      </span>
                    )}
                    {plan.trialDays > 0 && (
                      <span className="rounded-full bg-sage-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-forest-800">
                        {plan.trialDays}-day trial
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-semibold text-charcoal-900">{plan.name}</h3>
                  <p className="mt-4 text-3xl font-semibold text-charcoal-900">
                    {plan.pricing
                      ? formatAmount(plan.pricing.amount, plan.pricing.currency)
                      : 'Contact us'}
                    {plan.pricing && (
                      <span className="ml-1 text-xs font-medium uppercase tracking-wide text-warm-400">
                        {INTERVAL_LABELS[String(plan.pricing.interval)] ?? ''}
                      </span>
                    )}
                  </p>
                  {plan.description && (
                    <p className="mt-3 text-sm font-medium leading-relaxed text-warm-500">{plan.description}</p>
                  )}

                  <ul className="mt-6 flex-grow space-y-2.5">
                    {Object.entries(plan.features ?? {}).map(([key, value]) => (
                      <li key={key} className="flex items-center gap-2 text-xs font-semibold text-warm-600">
                        <CheckCircle className="shrink-0 text-forest-500" size={14} />
                        <span className="capitalize">{key.replace(/_/g, ' ')}: {String(value)}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="mt-8 w-full"
                    variant={isCurrent ? 'outline' : 'primary'}
                    disabled={isCurrent || !plan.pricing || busyId === plan.id}
                    isLoading={busyId === plan.id}
                    onClick={() => switchPlan(plan)}
                  >
                    {isCurrent ? 'Currently active' : `Switch to ${plan.name}`}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {cancelOpen && (
        <CancelSubscriptionModal
          onClose={() => setCancelOpen(false)}
          onCancelled={() => {
            setCancelOpen(false);
            showFeedback('SUCCESS', 'Subscription cancellation scheduled for the end of the billing period.');
            loadData();
          }}
        />
      )}
    </div>
  );
}

function UsageItem({ label, current, limit }: { label: string; current: number; limit?: unknown }) {
  const numericLimit = typeof limit === 'number' ? limit : Number(limit);
  const hasLimit = Number.isFinite(numericLimit) && numericLimit > 0;
  const percentage = hasLimit ? (current / numericLimit) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-warm-400">{label}</span>
        <span className="text-sm font-semibold">
          {current} {hasLimit ? `/ ${numericLimit}` : '/ Unlimited'}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className={`h-full transition-all duration-700 ${
            percentage > 90 ? 'bg-danger-500' : 'bg-forest-500'
          }`}
          style={{ width: `${hasLimit ? Math.min(percentage, 100) : 5}%` }}
        />
      </div>
    </div>
  );
}

function CancelSubscriptionModal({
  onClose,
  onCancelled,
}: {
  onClose: () => void;
  onCancelled: () => void;
}) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (reason.trim().length < 3) {
      setError('Tell us why you are cancelling (at least 3 characters).');
      return;
    }
    if (
      !window.confirm(
        'Cancel this subscription at the end of the current billing period? Access continues until then.',
      )
    ) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      await apiFetch('/subscriptions/cancel?mode=PERIOD_END', {
        method: 'DELETE',
        body: JSON.stringify({ reason: reason.trim() }),
      });
      onCancelled();
    } catch (err: any) {
      setError(err?.message || 'Could not cancel the subscription.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title="Cancel subscription"
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Keep subscription
          </Button>
          <Button type="submit" form="cancel-subscription-form" variant="danger" isLoading={saving}>
            Cancel at period end
          </Button>
        </>
      }
    >
      <form id="cancel-subscription-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <p className="text-sm text-warm-600">
          The school keeps access until the end of the current billing period. You can resubscribe at any time.
        </p>
        <div className="space-y-1.5">
          <label htmlFor="cancel-reason" className="block text-xs font-semibold text-charcoal-800">
            Reason *
          </label>
          <textarea
            id="cancel-reason"
            rows={3}
            required
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
          />
        </div>
      </form>
    </Modal>
  );
}
