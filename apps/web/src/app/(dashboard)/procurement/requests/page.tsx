'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  ClipboardList,
  Plus,
  Search,
  ArrowRight,
  MoreVertical,
  CheckCircle,
  Clock,
  User,
  Tag
} from 'lucide-react';
import Link from 'next/link';

export default function PurchaseRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/procurement/requests')
      .then(setRequests)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">Purchase Requests</h1>
          <p className="text-warm-500 text-sm">Internal requisitions for goods and services.</p>
        </div>
        <Link href="/procurement/requests/new" className="bg-forest-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-forest-800 transition-colors shadow-lg shadow-sage-100">
          <Plus size={18} /> New Request
        </Link>
      </div>

      <div className="bg-card rounded-3xl border border-warm-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-ivory-50/30 text-[11px] font-semibold text-warm-400 uppercase tracking-wide border-b border-warm-100">
                <th className="px-8 py-4">Request #</th>
                <th className="px-8 py-4">Requester</th>
                <th className="px-8 py-4">Priority</th>
                <th className="px-8 py-4">Status</th>
                <th className="px-8 py-4">Items</th>
                <th className="px-8 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ivory-50">
              {loading ? (
                <tr><td colSpan={6} className="p-20 text-center text-warm-400 font-bold animate-pulse">Scanning requests...</td></tr>
              ) : requests.length === 0 ? (
                <tr><td colSpan={6} className="p-20 text-center text-warm-400 font-bold">No purchase requests found.</td></tr>
              ) : requests.map((req) => (
                <tr key={req.id} className="hover:bg-ivory-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <p className="text-sm font-semibold text-charcoal-900">{req.requestNumber}</p>
                    <p className="text-[11px] text-warm-400 font-bold uppercase">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-lg bg-warm-100 flex items-center justify-center text-warm-400">
                          <User size={14} />
                       </div>
                       <p className="text-xs font-bold text-warm-700">{req.requester.firstName} {req.requester.lastName}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                      req.priority === 'HIGH' ? 'bg-danger-50 text-danger-600' : 'bg-sage-50 text-forest-700'
                    }`}>{req.priority}</span>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase tracking-wider ${
                      req.status === 'APPROVED' ? 'bg-sage-50 text-forest-600' :
                      req.status === 'DRAFT' ? 'bg-warm-100 text-warm-500' :
                      'bg-warning-50 text-warning-600'
                    }`}>{req.status}</span>
                  </td>
                  <td className="px-8 py-5 text-xs font-bold text-warm-500">{req.items.length} items</td>
                  <td className="px-8 py-5 text-right">
                    <Link href={`/procurement/requests/${req.id}`} className="p-2 text-warm-400 hover:text-forest-700 transition-colors">
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
  );
}

