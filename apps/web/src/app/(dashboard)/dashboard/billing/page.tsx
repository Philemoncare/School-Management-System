'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  CreditCard,
  ShieldCheck,
  Clock,
  ArrowUpCircle,
  CheckCircle,
  XCircle,
  Package
} from 'lucide-react';
import Link from 'next/link';

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<any[]>([]);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [subData, plansData, usageData] = await Promise.all([
        apiFetch('/subscriptions/my-subscription'),
        apiFetch('/subscriptions/plans'),
        apiFetch('/subscriptions/usage'),
      ]);
      setSubscription(subData);
      setPlans(plansData);
      setUsage(usageData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-center text-warm-500">Loading Billing Information...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-charcoal-900 tracking-tight">Billing & Subscription</h1>
          <p className="text-warm-500 mt-1">Manage your platform plan and monitor usage.</p>
        </div>
        <Link href="/dashboard/billing/history" className="text-sm font-bold text-forest-700 hover:underline flex items-center gap-1">
          View Billing History <Clock size={16}/>
        </Link>
      </div>

      {/* Current Plan Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-card border border-warm-200 rounded-3xl p-8 shadow-sm relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-forest-700 text-white text-[11px] font-semibold uppercase tracking-wide px-3 py-1 rounded-full">Current Plan</span>
              <h2 className="text-3xl font-semibold text-charcoal-900">{subscription?.plan.name}</h2>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <p className="text-xs font-bold text-warm-400 uppercase tracking-wide mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-success-500" size={18} />
                  <span className="font-bold text-charcoal-900 uppercase text-sm tracking-tight">{subscription?.status}</span>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-warm-400 uppercase tracking-wide mb-1">Next Renewal</p>
                <p className="font-bold text-charcoal-900">{new Date(subscription?.endDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-bold hover:bg-forest-800 transition-all flex items-center gap-2 shadow-lg shadow-sage-100">
                <ArrowUpCircle size={20}/> Upgrade Plan
              </button>
              <button className="bg-card border border-warm-200 text-warm-700 px-6 py-3 rounded-2xl font-bold hover:bg-ivory-50 transition-all">
                Cancel Subscription
              </button>
            </div>
          </div>
          <ShieldCheck size={200} className="absolute -bottom-10 -right-10 text-ivory-50 -rotate-12" />
        </div>

        <div className="bg-charcoal-900 rounded-3xl p-8 shadow-xs text-white">
          <h3 className="font-bold text-xl mb-6">Usage Summary</h3>
          <div className="space-y-6">
            <UsageItem
              label="Students"
              current={usage?.students}
              limit={subscription?.plan.features?.students || 'Unlimited'}
            />
            <UsageItem
              label="Teachers"
              current={usage?.teachers}
              limit={subscription?.plan.features?.staff || 'Unlimited'}
            />
            <UsageItem
              label="Storage"
              current="1.2 GB"
              limit={subscription?.plan.features?.storage || 'Unlimited'}
            />
          </div>
        </div>
      </div>

      {/* Available Plans */}
      <div>
        <h3 className="text-2xl font-bold text-charcoal-900 mb-8">Available Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div key={plan.id} className={`p-8 rounded-3xl border-2 flex flex-col transition-all ${plan.id === subscription?.planId ? 'border-forest-700 bg-sage-50/20 shadow-xs' : 'border-warm-100 bg-card hover:border-warm-200'}`}>
              {plan.id === subscription?.planId && (
                <span className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide mb-2 block">Your Active Plan</span>
              )}
              <h4 className="text-xl font-semibold text-charcoal-900">{plan.name}</h4>
              <p className="mt-4 text-4xl font-semibold text-charcoal-900">
                ${parseFloat(plan.price).toFixed(2)}
                <span className="text-sm font-bold text-warm-400 uppercase tracking-wide ml-1">/mo</span>
              </p>
              <p className="mt-4 text-sm text-warm-500 leading-relaxed font-medium">{plan.description}</p>

              <ul className="mt-8 space-y-3 flex-grow">
                 {Object.entries(plan.features || {}).map(([key, value]) => (
                   <li key={key} className="flex items-center gap-3 text-xs font-bold text-warm-600">
                     <CheckCircle className="text-forest-500" size={14} />
                     <span className="uppercase tracking-tight">{key}: {String(value)}</span>
                   </li>
                 ))}
              </ul>

              <button
                disabled={plan.id === subscription?.planId}
                className={`mt-10 w-full py-4 rounded-2xl font-semibold text-sm uppercase tracking-wide transition-all ${
                  plan.id === subscription?.planId
                    ? 'bg-warm-100 text-warm-400 cursor-default'
                    : 'bg-charcoal-900 text-white hover:bg-charcoal-950 shadow-lg shadow-warm-200'
                }`}
              >
                {plan.id === subscription?.planId ? 'Currently Active' : 'Switch to ' + plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UsageItem({ label, current, limit }: any) {
  const isUnlimited = limit === 'Unlimited';
  const percentage = isUnlimited ? 0 : (current / parseInt(limit)) * 100;

  return (
    <div>
      <div className="flex justify-between items-end mb-2">
        <span className="text-xs font-bold text-warm-400 uppercase tracking-wide">{label}</span>
        <span className="text-sm font-semibold">{current} / {limit}</span>
      </div>
      <div className="h-1.5 bg-card/10 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ${percentage > 90 ? 'bg-danger-500' : 'bg-forest-500'}`}
          style={{ width: `${isUnlimited ? 5 : Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

