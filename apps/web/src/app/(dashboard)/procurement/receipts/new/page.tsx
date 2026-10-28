'use client';

import { Select } from '@/components/ui/input';
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import {
  Truck,
  ArrowLeft,
  Save,
  Loader2,
  ShoppingCart,
  MapPin,
  Box,
  Plus,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function NewGoodsReceiptPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]); // Catalog items
  const [locations, setLocations] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    poId: '',
    deliveryNoteNumber: '',
    notes: '',
    items: [{ itemId: '', locationId: '', quantityReceived: 1, condition: 'GOOD' }],
  });

  useEffect(() => {
    Promise.all([
      apiFetch('/procurement/orders'),
      apiFetch('/inventory/items'),
      apiFetch('/inventory/locations')
    ]).then(([ordersData, itemsData, locationsData]) => {
      setOrders(ordersData.filter((o: any) => o.status === 'APPROVED' || o.status === 'SENT'));
      setItems(itemsData);
      setLocations(locationsData);
    });
  }, []);

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { itemId: '', locationId: '', quantityReceived: 1, condition: 'GOOD' }]
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
    setFormData({ ...formData, items: newItems });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/procurement/receive', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      toast.success('Goods received and stock updated');
      router.push('/procurement');
    } catch (error: any) {
      toast.error(error.message || 'Failed to record receipt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/procurement" className="p-2 hover:bg-warm-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-warm-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Goods Receiving</h1>
          <p className="text-warm-500 text-sm">Verify and record arrival of supplies into school inventory.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-card rounded-3xl border border-warm-100 p-8 shadow-sm space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                 <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Related Purchase Order (Optional)</label>
                 <div className="relative">
                    <Select
                      className="w-full pl-10 pr-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-bold outline-none appearance-none"
                      value={formData.poId}
                      onChange={e => setFormData({...formData, poId: e.target.value})}
                    >
                       <option value="">No PO Link / Ad-hoc Receipt</option>
                       {orders.map(o => (
                         <option key={o.id} value={o.id}>{o.poNumber} - {o.supplier.name}</option>
                       ))}
                    </Select>
                    <ShoppingCart className="absolute left-3.5 top-3 text-warm-400" size={16} />
                 </div>
              </div>
              <div className="space-y-2">
                 <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Delivery Note #</label>
                 <input
                   type="text"
                   placeholder="e.g. DN-55210"
                   className="w-full px-4 py-2.5 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-medium outline-none"
                   value={formData.deliveryNoteNumber}
                   onChange={e => setFormData({...formData, deliveryNoteNumber: e.target.value})}
                 />
              </div>
           </div>
        </section>

        <section className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
           <div className="p-6 border-b border-warm-100 bg-ivory-50/50 flex justify-between items-center">
              <h3 className="font-bold text-charcoal-900 flex items-center gap-2">
                <Box size={18} className="text-forest-700" /> Received Items
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
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-ivory-50 rounded-2xl border border-warm-100 relative group">
                   <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Item</label>
                      <Select
                        required
                        className="w-full px-3 py-2 bg-card border border-warm-200 rounded-lg text-xs font-bold outline-none"
                        value={item.itemId}
                        onChange={e => handleItemChange(index, 'itemId', e.target.value)}
                      >
                         <option value="">Select Item</option>
                         {items.map(i => (
                           <option key={i.id} value={i.id}>{i.name}</option>
                         ))}
                      </Select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Storage Location</label>
                      <Select
                        required
                        className="w-full px-3 py-2 bg-card border border-warm-200 rounded-lg text-xs font-bold outline-none"
                        value={item.locationId}
                        onChange={e => handleItemChange(index, 'locationId', e.target.value)}
                      >
                         <option value="">Select Location</option>
                         {locations.map(l => (
                           <option key={l.id} value={l.id}>{l.name}</option>
                         ))}
                      </Select>
                   </div>
                   <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Qty Received</label>
                      <input
                        required
                        type="number"
                        min="1"
                        className="w-full px-3 py-2 bg-card border border-warm-200 rounded-lg text-xs font-bold outline-none"
                        value={item.quantityReceived}
                        onChange={e => handleItemChange(index, 'quantityReceived', parseInt(e.target.value))}
                      />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Condition</label>
                      <Select
                        className="w-full px-3 py-2 bg-card border border-warm-200 rounded-lg text-xs font-bold outline-none"
                        value={item.condition}
                        onChange={e => handleItemChange(index, 'condition', e.target.value)}
                      >
                         <option value="GOOD">Good</option>
                         <option value="DAMAGED">Damaged</option>
                         <option value="EXPIRED">Expired</option>
                      </Select>
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
             className="bg-forest-700 text-white px-10 py-4 rounded-3xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-all shadow-xs shadow-sage-100 disabled:opacity-50"
           >
             {loading ? <Loader2 size={18} className="animate-spin" /> : <Truck size={18} />}
             Record Goods Receipt
           </button>
        </div>
      </form>
    </div>
  );
}
