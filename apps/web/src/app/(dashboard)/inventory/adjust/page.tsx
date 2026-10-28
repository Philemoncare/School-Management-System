'use client';

import { Select } from '@/components/ui/input';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import {
  ClipboardList,
  ArrowLeft,
  Save,
  Loader2,
  Box,
  MapPin,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function StockAdjustmentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    itemId: '',
    locationId: '',
    quantity: 1,
    type: 'RECEIPT',
    reason: '',
  });

  useEffect(() => {
    Promise.all([
      apiFetch('/inventory/items'),
      apiFetch('/inventory/locations')
    ]).then(([itemsData, locationsData]) => {
      setItems(itemsData);
      setLocations(locationsData);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/inventory/adjust', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      toast.success('Stock adjusted successfully');
      router.push('/inventory');
    } catch (error: any) {
      toast.error(error.message || 'Failed to adjust stock');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/inventory" className="p-2 hover:bg-warm-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-warm-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Adjust Stock</h1>
          <p className="text-warm-500 text-sm">Manually update stock levels due to damage, loss or findings.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Select Item</label>
                <div className="relative">
                  <Select
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-bold outline-none focus:border-forest-500 appearance-none"
                    value={formData.itemId}
                    onChange={e => setFormData({...formData, itemId: e.target.value})}
                  >
                    <option value="">Select Item</option>
                    {items.map(item => (
                      <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
                    ))}
                  </Select>
                  <Box className="absolute left-3 top-3 text-warm-400" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Location</label>
                <div className="relative">
                  <Select
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-bold outline-none focus:border-forest-500 appearance-none"
                    value={formData.locationId}
                    onChange={e => setFormData({...formData, locationId: e.target.value})}
                  >
                    <option value="">Select Location</option>
                    {locations.map(loc => (
                      <option key={loc.id} value={loc.id}>{loc.name}</option>
                    ))}
                  </Select>
                  <MapPin className="absolute left-3 top-3 text-warm-400" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Adjustment Type</label>
                <Select
                  className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-bold outline-none"
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="RECEIPT">Stock In (Receipt)</option>
                  <option value="ISSUE">Stock Out (Issue)</option>
                  <option value="ADJUSTMENT_IN">Adjustment In</option>
                  <option value="ADJUSTMENT_OUT">Adjustment Out</option>
                  <option value="DAMAGE">Damage</option>
                  <option value="LOSS">Loss</option>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Quantity</label>
                <input
                  required
                  type="number"
                  min="1"
                  className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-bold outline-none focus:border-forest-500"
                  value={formData.quantity}
                  onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})}
                />
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Reason / Reference</label>
              <textarea
                required
                rows={2}
                placeholder="Why is this adjustment being made?"
                className="w-full p-4 bg-ivory-50 border border-warm-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-forest-500 resize-none"
                value={formData.reason}
                onChange={e => setFormData({...formData, reason: e.target.value})}
              />
           </div>
        </div>

        <div className="p-6 bg-ivory-50 border-t border-warm-100 flex justify-end">
           <button
             type="submit"
             disabled={loading}
             className="bg-forest-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100 disabled:opacity-50"
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : <TrendingUp size={18} />}
             Record Adjustment
           </button>
        </div>
      </form>
    </div>
  );
}
