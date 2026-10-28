'use client';

import { Select } from '@/components/ui/input';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import {
  Package,
  ArrowLeft,
  Save,
  Loader2,
  Box,
  Tag,
  Info
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewInventoryItemPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    categoryId: '',
    unitOfMeasure: 'piece',
    itemType: 'CONSUMABLE',
    reorderLevel: 10,
    description: '',
  });

  useEffect(() => {
    // In a real app we'd fetch categories from API
    // For now we'll use a hardcoded set or fetch if I implemented it (I didn't yet)
    // Let's assume there's a categories endpoint
    // apiFetch('/inventory/categories').then(setCategories);
    setCategories([
        { id: 'cat-1', name: 'Stationery' },
        { id: 'cat-2', name: 'ICT Equipment' },
        { id: 'cat-3', name: 'Cleaning Supplies' },
    ]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/inventory/items', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      toast.success('Item created successfully');
      router.push('/inventory/items');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/inventory/items" className="p-2 hover:bg-warm-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-warm-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">New Catalog Item</h1>
          <p className="text-warm-500 text-sm">Define a new stock item or asset type for the school.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-8 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Item Name</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    placeholder="e.g. A4 Paper Rim"
                    className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                  <Box className="absolute left-3 top-3 text-warm-400" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Item Code</label>
                <div className="relative">
                  <input
                    required
                    type="text"
                    placeholder="INV-001"
                    className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500"
                    value={formData.code}
                    onChange={e => setFormData({...formData, code: e.target.value})}
                  />
                  <Tag className="absolute left-3 top-3 text-warm-400" size={16} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Category</label>
                <Select
                  required
                  className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-bold outline-none focus:border-forest-500"
                  value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Item Type</label>
                <Select
                  className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-bold outline-none"
                  value={formData.itemType}
                  onChange={e => setFormData({...formData, itemType: e.target.value})}
                >
                  <option value="CONSUMABLE">Consumable (Stock)</option>
                  <option value="ASSET">Fixed Asset</option>
                  <option value="SERVICE">Service</option>
                </Select>
              </div>
           </div>

           <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Description</label>
              <textarea
                rows={3}
                placeholder="Technical details, usage instructions, etc."
                className="w-full p-4 bg-ivory-50 border border-warm-100 rounded-2xl text-sm font-medium focus:outline-none focus:border-forest-500 resize-none"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
              />
           </div>
        </div>

        <div className="p-6 bg-ivory-50 border-t border-warm-100 flex justify-end">
           <button
             type="submit"
             disabled={loading}
             className="bg-forest-700 text-white px-8 py-3 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-lg shadow-sage-100 disabled:opacity-50"
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             Save Item
           </button>
        </div>
      </form>
    </div>
  );
}
