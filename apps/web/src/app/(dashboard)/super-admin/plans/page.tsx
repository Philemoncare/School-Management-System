'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Archive,
  CheckCircle,
  Edit3,
  Layers,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

const emptyPlan = {
  name: '',
  code: '',
  description: '',
  status: 'ACTIVE',
  trialDays: 14,
  displayOrder: 0,
  features: '{\n  "students": "unlimited",\n  "staff": "unlimited"\n}',
  pricing: [{ amount: 0, currency: 'GHS', interval: 'MONTHLY', isActive: true }],
};

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(emptyPlan);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);
    setError('');
    try {
      setPlans(await apiFetch('/super-admin/plans'));
    } catch (err: any) {
      setError(err.message || 'Unable to load plans');
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyPlan, pricing: [{ ...emptyPlan.pricing[0] }] });
    setError('');
    setModalOpen(true);
  }

  function openEdit(plan: any) {
    setEditing(plan);
    setForm({
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      status: plan.status,
      trialDays: plan.trialDays,
      displayOrder: plan.displayOrder,
      features: JSON.stringify(plan.features || {}, null, 2),
      pricing: plan.pricing?.length
        ? plan.pricing.map((pricing: any) => ({
            amount: Number(pricing.amount),
            currency: pricing.currency,
            interval: pricing.interval,
            isActive: pricing.isActive,
          }))
        : [{ amount: 0, currency: 'GHS', interval: 'MONTHLY', isActive: true }],
    });
    setError('');
    setModalOpen(true);
  }

  function updatePricing(index: number, patch: any) {
    setForm((current: any) => ({
      ...current,
      pricing: current.pricing.map((pricing: any, itemIndex: number) => itemIndex === index ? { ...pricing, ...patch } : pricing),
    }));
  }

  async function savePlan() {
    setSaving(true);
    setError('');
    let features: any;
    try {
      features = form.features ? JSON.parse(form.features) : {};
    } catch {
      setError('Features must be valid JSON.');
      setSaving(false);
      return;
    }
    try {
      const payload = {
        ...form,
        features,
        trialDays: Number(form.trialDays),
        displayOrder: Number(form.displayOrder),
        pricing: form.pricing.map((pricing: any) => ({ ...pricing, amount: Number(pricing.amount) })),
      };
      if (editing) {
        await apiFetch(`/super-admin/plans/${editing.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await apiFetch('/super-admin/plans', { method: 'POST', body: JSON.stringify(payload) });
      }
      setModalOpen(false);
      await loadPlans();
    } catch (err: any) {
      setError(err.message || 'Unable to save plan');
    } finally {
      setSaving(false);
    }
  }

  async function archivePlan(plan: any) {
    if (!window.confirm(`Archive the ${plan.name} plan? It will no longer be assignable.`)) return;
    setBusy(plan.id);
    setError('');
    try {
      await apiFetch(`/super-admin/plans/${plan.id}/archive`, { method: 'POST' });
      await loadPlans();
    } catch (err: any) {
      setError(err.message || 'Unable to archive plan');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <Layers className="text-forest-700" /> Platform Plans
          </h1>
          <p className="text-warm-500 font-medium mt-1">Configure SaaS tiers, features, and real subscription pricing.</p>
        </div>
        <Button onClick={openCreate} leftIcon={<Plus size={18} />}>Create New Plan</Button>
      </div>

      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      {loading ? (
        <div className="py-20 text-center"><Loader2 size={36} className="animate-spin mx-auto text-forest-700" /></div>
      ) : plans.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-warm-200 bg-card p-16 text-center">
          <Layers className="mx-auto text-warm-200 mb-4" size={56} />
          <p className="font-bold text-warm-500">No subscription plans configured</p>
          <p className="mt-1 text-sm text-warm-400">Create the first plan to make subscriptions assignable.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className={`bg-card border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow relative ${plan.status === 'ARCHIVED' ? 'border-warm-100 opacity-75' : 'border-warm-200'}`}>
              <div className="p-6 border-b border-warm-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2.5 bg-sage-50 rounded-xl text-forest-700"><ShieldCheck size={22} /></div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${plan.status === 'ACTIVE' ? 'bg-success-100 text-success-700' : plan.status === 'DRAFT' ? 'bg-warning-100 text-warning-700' : 'bg-warm-100 text-warm-600'}`}>{plan.status}</span>
                    <span className="text-[10px] font-bold uppercase text-warm-400">{plan._count?.subscriptions || 0} schools</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-charcoal-900">{plan.name}</h3>
                <p className="text-[11px] font-semibold text-forest-500 uppercase tracking-wide mt-1">{plan.code}</p>
                <p className="text-warm-500 text-sm mt-3 font-medium leading-relaxed line-clamp-3">{plan.description || 'No description provided.'}</p>
              </div>

              <div className="p-6 bg-ivory-50/50">
                <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3">Features</p>
                <ul className="space-y-2 min-h-[70px]">
                  {Object.entries(plan.features || {}).slice(0, 5).map(([key, value]: any) => (
                    <li key={key} className="flex items-center gap-2 text-xs font-bold text-warm-700">
                      <CheckCircle size={13} className="text-success-500 shrink-0" />
                      <span className="capitalize">{key.replace(/_/g, ' ')}: {String(value)}</span>
                    </li>
                  ))}
                  {Object.keys(plan.features || {}).length === 0 && <li className="text-xs text-warm-400 italic">No features defined</li>}
                </ul>

                <div className="mt-5 pt-4 border-t border-warm-100">
                  <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3">Pricing</p>
                  {plan.pricing.filter((pricing: any) => pricing.isActive).map((pricing: any) => (
                    <div key={pricing.id} className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-warm-600">{pricing.interval.replace(/_/g, ' ')}</span>
                      <span className="text-sm font-semibold text-charcoal-900">{pricing.currency} {Number(pricing.amount).toLocaleString()}</span>
                    </div>
                  ))}
                  {plan.pricing.filter((pricing: any) => pricing.isActive).length === 0 && <p className="text-xs text-warning-600">No active pricing</p>}
                </div>
              </div>

              <div className="p-3 bg-card border-t border-warm-100 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(plan)} leftIcon={<Edit3 size={14} />}>Edit Plan</Button>
                {plan.status !== 'ARCHIVED' && (
                  <Button variant="ghost" size="sm" onClick={() => archivePlan(plan)} isLoading={busy === plan.id} title="Archive plan">
                    <Archive size={16} />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Create Subscription Plan'}
        size="lg"
        footerActions={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={savePlan} isLoading={saving} disabled={!form.name || !form.code}>Save plan</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Plan name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input label="Plan code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <Input label="Trial days" type="number" min={0} value={form.trialDays} onChange={(e) => setForm({ ...form, trialDays: e.target.value })} />
            <Input label="Display order" type="number" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: e.target.value })} />
            <Select label="Status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </Select>
            <Input label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>

          <div>
            <label className="ml-0.5 text-[11px] font-semibold text-warm-600 sm:text-xs">Features (JSON)</label>
            <textarea
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
              rows={4}
              className="mt-1.5 w-full rounded-lg border border-warm-300 bg-card p-3 font-mono text-xs text-charcoal-900 outline-none focus:border-forest-600 focus:ring-2 focus:ring-forest-600/15"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[11px] font-semibold text-warm-600 sm:text-xs">Pricing tiers</label>
              <Button size="xs" variant="outline" onClick={() => setForm({ ...form, pricing: [...form.pricing, { amount: 0, currency: 'GHS', interval: 'MONTHLY', isActive: true }] })} leftIcon={<Plus size={13} />}>Add tier</Button>
            </div>
            <div className="space-y-2">
              {form.pricing.map((pricing: any, index: number) => (
                <div key={index} className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end rounded-xl border border-warm-100 p-3">
                  <Input label="Amount" type="number" min={0} value={pricing.amount} onChange={(e) => updatePricing(index, { amount: e.target.value })} />
                  <Input label="Currency" value={pricing.currency} onChange={(e) => updatePricing(index, { currency: e.target.value.toUpperCase() })} />
                  <Select label="Interval" value={pricing.interval} onChange={(e) => updatePricing(index, { interval: e.target.value })}>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                    <option value="SEMI_ANNUAL">Semi annual</option>
                    <option value="ANNUAL">Annual</option>
                  </Select>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, pricing: form.pricing.filter((_: any, itemIndex: number) => itemIndex !== index) })}
                    className="flex h-11 items-center justify-center rounded-lg border border-warm-200 text-danger-500 hover:bg-danger-50 disabled:opacity-30"
                    disabled={form.pricing.length === 1}
                    title="Remove tier"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
