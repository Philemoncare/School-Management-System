'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Package,
  Search,
  Plus,
  Box,
  Tag,
  ArrowRight,
  MoreVertical,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function InventoryItemsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    apiFetch('/inventory/items')
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Inventory Items</h1>
          <p className="text-warm-500 text-sm">Full catalog of stock, consumables and materials.</p>
        </div>
        <Link href="/inventory/items/new" className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-colors">
          <Plus size={18} /> New Item
        </Link>
      </div>

      <div className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 bg-ivory-50/50 flex flex-col md:flex-row justify-between gap-4">
           <div className="relative flex-1 max-w-md">
             <input
               type="text"
               placeholder="Search items by name or code..."
               className="w-full pl-10 pr-4 py-2 bg-card border border-warm-200 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-all"
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
             />
             <Search className="absolute left-3 top-2.5 text-warm-400" size={16} />
           </div>
           <div className="flex gap-2">
              <button className="px-4 py-2 bg-card border border-warm-200 text-warm-600 rounded-xl text-sm font-bold hover:bg-ivory-50 transition-colors">Categories</button>
              <button className="px-4 py-2 bg-card border border-warm-200 text-warm-600 rounded-xl text-sm font-bold hover:bg-ivory-50 transition-colors">Filter</button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ivory-50/30 text-[11px] font-semibold text-warm-400 uppercase tracking-wide border-b border-warm-100">
                <th className="px-8 py-4">Item Details</th>
                <th className="px-8 py-4">Category</th>
                <th className="px-8 py-4">Current Stock</th>
                <th className="px-8 py-4">Unit</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-50">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center text-warm-400 font-bold animate-pulse">Syncing catalog...</td></tr>
              ) : filteredItems.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center text-warm-400 font-bold">No items found matching your search.</td></tr>
              ) : filteredItems.map((item) => {
                const totalStock = item.balances.reduce((acc: number, bal: any) => acc + bal.onHand, 0);
                const isLow = totalStock <= item.reorderLevel;

                return (
                  <tr key={item.id} className="hover:bg-ivory-50/50 transition-colors group">
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-warm-100 rounded-xl flex items-center justify-center text-warm-400 group-hover:bg-sage-50 group-hover:text-forest-500 transition-colors">
                             <Box size={20} />
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-charcoal-900 leading-tight">{item.name}</p>
                             <p className="text-[11px] text-warm-400 font-bold uppercase">{item.code}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className="text-xs font-bold text-warm-600 bg-warm-100 px-2 py-1 rounded-lg uppercase tracking-wider">{item.category.name}</span>
                    </td>
                    <td className="px-8 py-5">
                       <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isLow ? 'text-danger-600' : 'text-forest-600'}`}>{totalStock}</span>
                          {isLow && <AlertTriangle size={14} className="text-warning-500" />}
                       </div>
                    </td>
                    <td className="px-8 py-5 text-xs font-bold text-warm-500 uppercase">{item.unitOfMeasure}</td>
                    <td className="px-8 py-5">
                       <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                         item.status === 'ACTIVE' ? 'bg-sage-50 text-forest-600' : 'bg-warm-100 text-warm-500'
                       }`}>{item.status}</span>
                    </td>
                    <td className="px-8 py-5 text-right">
                       <Link href={`/inventory/items/${item.id}`} className="p-2 text-warm-400 hover:text-forest-700 transition-colors">
                          <ArrowRight size={18} />
                       </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
