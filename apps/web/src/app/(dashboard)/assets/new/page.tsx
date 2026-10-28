'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Monitor, Save, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function NewAssetPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    assetTag: '',
    category: 'EQUIPMENT',
    serialNumber: '',
    location: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    purchaseValue: '',
    condition: 'NEW',
    notes: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await apiFetch('/inventory/assets', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          purchaseValue: Number(form.purchaseValue) || 0,
        }),
      });
      router.push('/assets');
    } catch (err: any) {
      setError(err.message || 'Failed to register asset.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Link
          href="/assets"
          className="p-2.5 bg-card border border-warm-200 rounded-xl text-warm-600 hover:text-charcoal-900 transition-colors"
          aria-label="Back to assets"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-900 tracking-tight flex items-center gap-2.5">
            <Monitor className="text-forest-700 h-6 w-6" /> Register Fixed Asset
          </h1>
          <p className="text-xs sm:text-sm text-warm-500 font-medium mt-0.5">
            Add a new physical asset or equipment to school registry.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl text-xs sm:text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-card border border-warm-200 rounded-2xl p-5 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Asset Name *"
            required
            placeholder="e.g. Dell Latitude 5420 Laptop"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Asset Tag / Code *"
            required
            placeholder="e.g. AST-LAB-042"
            value={form.assetTag}
            onChange={(e) => setForm({ ...form, assetTag: e.target.value })}
          />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="EQUIPMENT">IT & Computer Equipment</option>
            <option value="FURNITURE">School Furniture</option>
            <option value="VEHICLE">School Vehicle / Transport</option>
            <option value="LABORATORY">Lab Instrumentation</option>
            <option value="SPORTING">Sports Infrastructure</option>
            <option value="OTHER">General Property</option>
          </Select>
          <Input
            label="Serial Number"
            placeholder="e.g. SN-8923491283"
            value={form.serialNumber}
            onChange={(e) => setForm({ ...form, serialNumber: e.target.value })}
          />
          <Input
            label="Location / Room *"
            required
            placeholder="e.g. Computer Lab 2 - Building B"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <Input
            label="Purchase Date"
            type="date"
            value={form.purchaseDate}
            onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}
          />
          <Input
            label="Purchase Value (GH₵)"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={form.purchaseValue}
            onChange={(e) => setForm({ ...form, purchaseValue: e.target.value })}
          />
          <Select
            label="Initial Condition"
            value={form.condition}
            onChange={(e) => setForm({ ...form, condition: e.target.value })}
          >
            <option value="NEW">Brand New</option>
            <option value="GOOD">Good / Functional</option>
            <option value="FAIR">Fair / Needs Minor Maintenance</option>
            <option value="POOR">Poor / Damaged</option>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-warm-100">
          <Link
            href="/assets"
            className="px-5 py-2.5 border border-warm-200 rounded-xl text-xs font-bold text-warm-600 hover:bg-warm-50 text-center transition-colors"
          >
            Cancel
          </Link>
          <Button type="submit" isLoading={loading} leftIcon={<Save size={16} />}>
            Save Asset Record
          </Button>
        </div>
      </form>
    </div>
  );
}
