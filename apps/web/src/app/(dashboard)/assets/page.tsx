'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Monitor,
  Search,
  Plus,
  Tag,
  MapPin,
  User,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';

export default function AssetsPage() {
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    apiFetch('/inventory/assets')
      .then(setAssets)
      .finally(() => setLoading(false));
  }, []);

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    asset.assetTag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Asset Register</h1>
          <p className="text-warm-500 text-sm">Official registry of fixed assets, equipment and property.</p>
        </div>
        <Link href="/assets/new" className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-colors">
          <Plus size={18} /> Register Asset
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
         <div className="lg:col-span-1 space-y-6">
            <section className="bg-card rounded-3xl border border-warm-100 p-6 shadow-sm">
               <h3 className="font-bold text-charcoal-900 mb-4 flex items-center gap-2">
                 <Search size={18} className="text-forest-700" /> Quick Filter
               </h3>
               <div className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Asset tag or name..."
                      className="w-full pl-10 pr-4 py-2 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-medium focus:outline-none focus:border-forest-500 transition-all"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search className="absolute left-3 top-2.5 text-warm-400" size={16} />
                  </div>
                  <div className="space-y-2">
                     <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Condition</p>
                     <Select className="w-full px-3 py-2 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-bold outline-none">
                        <option>All Conditions</option>
                        <option>New</option>
                        <option>Good</option>
                        <option>Damaged</option>
                     </Select>
                  </div>
                  <div className="space-y-2">
                     <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Status</p>
                     <Select className="w-full px-3 py-2 bg-ivory-50 border border-warm-100 rounded-xl text-sm font-bold outline-none">
                        <option>All Statuses</option>
                        <option>Assigned</option>
                        <option>In Storage</option>
                        <option>Maintenance</option>
                     </Select>
                  </div>
               </div>
            </section>
         </div>

         <div className="lg:col-span-3">
            <div className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="bg-ivory-50/30 text-[11px] font-semibold text-warm-400 uppercase tracking-wide border-b border-warm-100">
                           <th className="px-8 py-4">Asset Details</th>
                           <th className="px-8 py-4">Assignment / Location</th>
                           <th className="px-8 py-4">Condition</th>
                           <th className="px-8 py-4">Status</th>
                           <th className="px-8 py-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-ivory-50">
                        {loading ? (
                          <tr><td colSpan={5} className="p-20 text-center text-warm-400 font-bold animate-pulse">Syncing asset register...</td></tr>
                        ) : filteredAssets.length === 0 ? (
                          <tr><td colSpan={5} className="p-20 text-center text-warm-400 font-bold">No assets found matching your criteria.</td></tr>
                        ) : filteredAssets.map((asset) => (
                           <tr key={asset.id} className="hover:bg-ivory-50/50 transition-colors">
                              <td className="px-8 py-5">
                                 <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-sage-50 rounded-xl flex items-center justify-center text-forest-700">
                                       <Monitor size={20} />
                                    </div>
                                    <div>
                                       <p className="text-sm font-semibold text-charcoal-900 leading-tight">{asset.name}</p>
                                       <p className="text-[11px] text-warm-400 font-bold uppercase">{asset.assetTag}</p>
                                    </div>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                 {asset.status === 'ASSIGNED' ? (
                                    <div className="flex items-center gap-2">
                                       <User size={14} className="text-warm-400" />
                                       <div>
                                          <p className="text-xs font-bold text-warm-700">{asset.staff?.firstName} {asset.staff?.lastName}</p>
                                          <p className="text-[11px] text-warm-400 font-medium">{asset.department?.name}</p>
                                       </div>
                                    </div>
                                 ) : (
                                    <div className="flex items-center gap-2 text-warm-400">
                                       <MapPin size={14} />
                                       <span className="text-xs font-bold uppercase">{asset.location?.name || 'TBA'}</span>
                                    </div>
                                 )}
                              </td>
                              <td className="px-8 py-5">
                                 <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                                    asset.condition === 'NEW' ? 'bg-sage-50 text-forest-700' :
                                    asset.condition === 'GOOD' ? 'bg-sage-50 text-forest-600' :
                                    'bg-danger-50 text-danger-600'
                                 }`}>{asset.condition}</span>
                              </td>
                              <td className="px-8 py-5">
                                 <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                                    asset.status === 'ASSIGNED' ? 'bg-terracotta-50 text-terracotta-600' :
                                    asset.status === 'IN_STORAGE' ? 'bg-warm-100 text-warm-500' :
                                    'bg-warning-50 text-warning-600'
                                 }`}>{asset.status.replace('_', ' ')}</span>
                              </td>
                              <td className="px-8 py-5 text-right">
                                 <Link href={`/assets/${asset.id}`} className="p-2 text-warm-400 hover:text-forest-700 transition-colors">
                                    <ArrowRight size={18} />
                                 </Link>
                              </td>
                           </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

