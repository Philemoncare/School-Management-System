'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Smartphone,
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
  Package,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';

type Tab = 'packages' | 'balances';

interface SmsPackage {
  id: string;
  name: string;
  code: string;
  description?: string;
  credits: number;
  price: number;
  currency: string;
  status: string;
  isFeatured: boolean;
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  _count?: { purchases: number };
}

interface SchoolBalance {
  id: string;
  name: string;
  code: string;
  status: string;
  currency: string;
  smsCreditBalance: number;
}

export default function SmsPackagesPage() {
  const [tab, setTab] = useState<Tab>('packages');
  const [packages, setPackages] = useState<SmsPackage[]>([]);
  const [balances, setBalances] = useState<SchoolBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<SmsPackage | null>(null);
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    credits: 0,
    price: 0,
    currency: 'USD',
    status: 'ACTIVE' as const,
    isFeatured: false,
    displayOrder: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [pkgs, bals] = await Promise.all([
        apiFetch('/super-admin/sms-packages'),
        apiFetch('/super-admin/sms-packages/balances'),
      ]);
      setPackages(pkgs || []);
      setBalances(bals || []);
    } catch (err: any) {
      setError(err.message || 'Unable to load SMS data');
    } finally {
      setLoading(false);
    }
  }

  function openModal(pkg?: SmsPackage) {
    setEditing(pkg || null);
    setForm({
      name: pkg?.name || '',
      code: pkg?.code || '',
      description: pkg?.description || '',
      credits: pkg?.credits ?? 0,
      price: pkg ? Number(pkg.price) : 0,
      currency: pkg?.currency || 'USD',
      status: (pkg?.status as any) || 'ACTIVE',
      isFeatured: pkg?.isFeatured || false,
      displayOrder: pkg?.displayOrder ?? 0,
    });
    setError('');
    setModalOpen(true);
  }

  async function savePackage() {
    if (!form.name.trim() || !form.code.trim()) return setError('Name and code are required.');
    if (!form.credits || form.credits < 1) return setError('Credits must be at least 1.');
    if (!form.price || form.price < 0) return setError('Price must be valid.');
    setBusy('save');
    setError('');
    try {
      if (editing) {
        await apiFetch(`/super-admin/sms-packages/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim() || undefined,
            credits: form.credits,
            price: form.price,
            currency: form.currency,
            status: form.status,
            isFeatured: form.isFeatured,
            displayOrder: form.displayOrder,
          }),
        });
      } else {
        await apiFetch('/super-admin/sms-packages', {
          method: 'POST',
          body: JSON.stringify({
            name: form.name.trim(),
            code: form.code.trim().toUpperCase(),
            description: form.description.trim() || undefined,
            credits: form.credits,
            price: form.price,
            currency: form.currency,
            status: form.status,
            isFeatured: form.isFeatured,
            displayOrder: form.displayOrder,
          }),
        });
      }
      setModalOpen(false);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to save SMS package');
    } finally {
      setBusy('');
    }
  }

  async function toggleStatus(pkg: SmsPackage) {
    const nextStatus = pkg.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setBusy(pkg.id);
    setError('');
    try {
      await apiFetch(`/super-admin/sms-packages/${pkg.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to update package status');
    } finally {
      setBusy('');
    }
  }

  async function archivePackage(pkg: SmsPackage) {
    if (!window.confirm(`Archive SMS package "${pkg.name}"? This cannot be undone if there are active purchases.`)) return;
    setBusy(pkg.id);
    setError('');
    try {
      await apiFetch(`/super-admin/sms-packages/${pkg.id}/archive`, {
        method: 'POST',
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to archive package');
    } finally {
      setBusy('');
    }
  }

  async function topUpCredits(schoolId: string, schoolName: string) {
    const credits = window.prompt(`Enter credits to add to ${schoolName}:`);
    if (!credits || isNaN(Number(credits)) || Number(credits) < 1) return;
    const reason = window.prompt('Reason for top-up:');
    if (!reason) return;
    setBusy(schoolId);
    setError('');
    try {
      await apiFetch('/super-admin/sms-packages/topup', {
        method: 'POST',
        body: JSON.stringify({ schoolId, credits: Number(credits), reason }),
      });
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Unable to top up credits');
    } finally {
      setBusy('');
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-ivory-50">
        <Loader2 className="mx-auto animate-spin text-forest-700" size={34} />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-charcoal-900">
            SMS Packages
          </h1>
          <p className="mt-1 text-warm-500 font-medium">
            Manage platform-wide SMS packages and school credit balances.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTab('packages')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-xl ${tab === 'packages' ? 'bg-forest-700 text-white' : 'text-warm-500 border border-warm-200'}`}>
            Packages
          </Button>
          <Button onClick={() => setTab('balances')} className={`px-4 py-2 text-xs font-bold uppercase tracking-wide rounded-xl ${tab === 'balances' ? 'bg-forest-700 text-white' : 'text-warm-500 border border-warm-200'}`}>
            Credit Balances
          </Button>
          <Button onClick={() => openModal()} leftIcon={<Plus size={16} />}>
            Add Package
          </Button>
        </div>
      </div>

      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      {tab === 'packages' ? (
        <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Package</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">Credits</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Price</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Status</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Featured</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Purchases</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {packages.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-xs font-semibold text-warm-400">
                    No SMS packages configured. Add one to make it available for schools to purchase.
                  </td>
                </tr>
              )}
              {packages.map((pkg) => (
                <tr key={pkg.id} className="hover:bg-ivory-50">
                  <td className="px-5 py-4">
                    <div className="text-xs font-semibold text-charcoal-900">{pkg.name}</div>
                    <div className="text-[10px] text-warm-500 font-mono">{pkg.code}</div>
                    {pkg.description && (
                      <div className="text-[10px] text-warm-400 truncate max-w-xs">{pkg.description}</div>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-charcoal-900">{pkg.credits}</td>
                  <td className="px-5 py-4 text-xs font-semibold text-charcoal-900 text-right">
                    {pkg.currency} {pkg.price}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge
                      variant={pkg.status === 'ACTIVE' ? 'default' : 'secondary'}
                      className="text-[10px] font-semibold"
                    >
                      {pkg.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge variant={pkg.isFeatured ? 'default' : 'secondary'} className="text-[10px]">
                      {pkg.isFeatured ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-charcoal-900 text-right">
                    {pkg._count?.purchases || 0}
                  </td>
                  <td className="px-5 py-4 text-right text-[10px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openModal(pkg)}
                      disabled={busy === pkg.id}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {pkg.status === 'ACTIVE' ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(pkg)}
                        disabled={busy === pkg.id}
                      >
                        Deactivate
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(pkg)}
                        disabled={busy === pkg.id}
                      >
                        Activate
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => archivePackage(pkg)}
                      disabled={busy === pkg.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">School</th>
                <th className="px-5 py-3 text-center text-[11px] font-semibold uppercase text-warm-400">Status</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Balance</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Currency</th>
                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase text-warm-400">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100">
              {balances.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-xs font-semibold text-warm-400">
                    No school balances found.
                  </td>
                </tr>
              )}
              {balances.map((school) => (
                <tr key={school.id} className="hover:bg-ivory-50">
                  <td className="px-5 py-4">
                    <div className="text-xs font-semibold text-charcoal-900">{school.name}</div>
                    <div className="text-[10px] text-warm-500 font-mono">{school.code}</div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Badge
                      variant={school.status === 'ACTIVE' ? 'default' : 'destructive'}
                      className="text-[10px] font-semibold"
                    >
                      {school.status}
                    </Badge>
                  </td>
                  <td className="px-5 py-4 text-xs font-semibold text-charcoal-900 text-right">
                    {Number(school.smsCreditBalance).toLocaleString()}
                  </td>
                  <td className="px-5 py-4 text-xs font-medium text-charcoal-900 text-right">
                    {school.currency}
                  </td>
                  <td className="px-5 py-4 text-right text-[10px]">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => topUpCredits(school.id, school.name)}
                      disabled={busy === school.id}
                    >
                      {busy === school.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Top Up'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.name}` : 'Create SMS Package'}
        footerActions={
          <>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={savePackage} isLoading={busy === 'save'} leftIcon={<Save size={15} />}>
              Save Package
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-danger-200 bg-danger-50 px-3 py-2 text-xs font-semibold text-danger-700">
              {error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Package name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Starter Pack"
            />
            <Input
              label="Package code"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="e.g. STARTER"
            />
          </div>
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Optional description"
          />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              type="number"
              label="Credits"
              value={form.credits}
              onChange={(e) => setForm({ ...form, credits: Number(e.target.value) || 0 })}
              placeholder="e.g. 1000"
            />
            <Input
              type="number"
              label="Price"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: Number(e.target.value) || 0 })}
              placeholder="e.g. 49.99"
            />
            <Input
              label="Currency"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value || 'USD' })}
              placeholder="USD"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <label className="flex items-center gap-2 rounded-xl border border-warm-200 p-3">
              <input
                type="checkbox"
                checked={form.status === 'ACTIVE'}
                onChange={(e) =>
                  setForm({ ...form, status: (e.target.checked ? 'ACTIVE' : 'INACTIVE') as any })
                }
                className="h-4 w-4 rounded border-warm-300 text-forest-700"
              />
              <span className="text-xs font-semibold text-warm-700">Active</span>
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-warm-200 p-3">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="h-4 w-4 rounded border-warm-300 text-forest-700"
              />
              <span className="text-xs font-semibold text-warm-700">Featured</span>
            </label>
            <Input
              type="number"
              label="Display order"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) || 0 })}
              placeholder="0"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
