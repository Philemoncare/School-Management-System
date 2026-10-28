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
  Plus,
  Trash2,
  Package
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewPurchaseRequestPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>([]); // Catalog items
  const [formData, setFormData] = useState({
    reason: '',
    priority: 'NORMAL',
    items: [{ itemId: '', description: '', quantity: 1, estimatedUnitPrice: 0 }],
  });

  useEffect(() => {
    apiFetch('/inventory/items').then(setItems);
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: '', description: '', quantity: 1, estimatedUnitPrice: 0 }]
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index)
    });
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    // If itemId changed, update description from catalog
    if (field === 'itemId') {
        const item = items.find(i => i.id === value);
        if (item) newItems[index].description = item.name;
    }

    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/procurement/requests', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      toast.success('Purchase request submitted');
      router.push('/procurement/requests');
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/procurement/requests" className="p-2 hover:bg-warm-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-warm-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">New Purchase Request</h1>
          <p className="text-warm-500 text-sm">Request funds or supplies for your department.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-card rounded-3xl border border-warm-100 p-8 shadow-sm space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Priority</label>
                 <Select
                   className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-bold outline-none focus:border-forest-500"
                   value={formData.priority}
                   onChange={e => setFormData({...formData, priority: e.target.value})}
                 >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Emergency / Urgent</option>
                 </Select>
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Reason for Request</label>
                 <input
                   required
                   type="text"
                   placeholder="e.g. End of term exam papers"
                   className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500"
                   value={formData.reason}
                   onChange={e => setFormData({...formData, reason: e.target.value})}
                 />
              </div>
           </div>
        </section>

        <section className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-warm-100 bg-ivory-50/50 flex justify-between items-center">
              <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
                <Package size={18} className="text-forest-700" /> Requested Items
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide flex items-center gap-1 hover:underline"
              >
                <Plus size={14} /> Add Item
              </button>
           </div>
           <div className="p-6 space-y-4">
              {formData.items.map((item, index) => (
                <div key={index} className="flex flex-col md:flex-row gap-4 p-4 bg-ivory-50 rounded-2xl border border-warm-100 relative group">
                   <div className="flex-1 space-y-2">
                      <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Catalog Item (Optional)</label>
                      <Select
                        className="w-full px-3 py-2 bg-card border border-warm-200 rounded-lg text-xs font-bold outline-none"
                        value={item.itemId}
                        onChange={e => handleItemChange(index, 'itemId', e.target.value)}
                      >
                         <option value="">Select Catalog Item</option>
                         {items.map(i => (
                           <option key={i.id} value={i.id}>{i.name}</option>
                         ))}
                      </Select>
                   </div>
                   <div className="flex-1 space-y-2">
                      <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Description</label>
                      <input
                        required
                        type="text"
                        placeholder="Detailed description..."
                        className="w-full px-3 py-2 bg-card border border-warm-200 rounded-lg text-xs font-medium outline-none"
                        value={item.description}
                        onChange={e => handleItemChange(index, 'description', e.target.value)}
                      />
                   </div>
                   <div className="w-24 space-y-2">
                      <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Quantity</label>
                      <input
                        required
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 bg-card border border-warm-200 rounded-lg text-xs font-bold outline-none"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                      />
                   </div>
                   <button
                     type="button"
                     onClick={() => handleRemoveItem(index)}
                     className="absolute -right-2 -top-2 p-1.5 bg-card border border-danger-100 text-danger-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                   >
                     <Trash2 size={12} />
                   </button>
                </div>
              ))}
           </div>
        </section>

        <div className="flex justify-end">
           <button
             type="submit"
             disabled={loading}
             className="bg-forest-700 text-white px-10 py-4 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-xs shadow-sage-100 disabled:opacity-50"
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
             Submit Purchase Request
           </button>
        </div>
      </form>
    </div>
  );
}
