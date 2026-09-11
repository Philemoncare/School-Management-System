'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  CreditCard,
  FileText,
  Settings,
  TrendingUp,
  Users,
  ChevronRight,
  AlertCircle,
  Loader2,
  BadgeDollarSign
} from 'lucide-react';
import Link from 'next/link';

export default function FinanceDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reuse main dashboard metrics for simplicity if they contain finance data
    apiFetch('/schools/dashboard/metrics')
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const stats = [
    {
      name: 'Total Invoiced',
      value: loading ? '...' : `GH₵ ${parseFloat(data?.stats?.totalInvoiced || 0).toLocaleString()}`,
      icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50'
    },
    {
      name: 'Total Collected',
      value: loading ? '...' : `GH₵ ${parseFloat((data?.stats?.totalInvoiced || 0) - (data?.stats?.outstandingFees || 0)).toLocaleString()}`,
      icon: BadgeDollarSign, color: 'text-green-600', bg: 'bg-green-50'
    },
    {
      name: 'Outstanding Balance',
      value: loading ? '...' : `GH₵ ${parseFloat(data?.stats?.outstandingFees || 0).toLocaleString()}`,
      icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50'
    },
  ];

  const modules = [
    { name: 'Invoices', description: 'Generate and manage student bills', href: '/dashboard/finance/invoices', icon: FileText, color: 'bg-blue-500' },
    { name: 'Payments', description: 'Record and track fee collections', href: '/dashboard/finance/payments', icon: CreditCard, color: 'bg-green-500' },
    { name: 'Fee Structures', description: 'Configure school fee items', href: '/dashboard/finance/fee-structures', icon: Settings, color: 'bg-purple-500' },
    { name: 'Financial Reports', description: 'Statements and collection summaries', href: '/dashboard/finance/reports', icon: TrendingUp, color: 'bg-orange-500' },
  ];

  return (
    <div className="p-8 space-y-10">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Command Center</h1>
          <p className="text-gray-500 mt-1">Institutional revenue tracking and fee management.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm flex flex-col gap-6 hover:shadow-md transition-shadow">
            <div className={`p-4 rounded-2xl w-fit ${stat.bg}`}>
              <stat.icon className={stat.color} size={24} />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{stat.name}</p>
              <p className="text-3xl font-black text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {modules.map((module) => (
          <Link
            key={module.name}
            href={module.href}
            className="group block bg-white border border-gray-200 rounded-[2.5rem] p-8 hover:shadow-xl hover:border-blue-200 transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className={`${module.color} p-5 rounded-3xl text-white shadow-lg shadow-gray-100 group-hover:scale-110 transition-transform`}>
                  <module.icon size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 group-hover:text-blue-600 transition-colors">{module.name}</h3>
                  <p className="text-gray-500 mt-1 font-medium">{module.description}</p>
                </div>
              </div>
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                <ChevronRight size={24} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Activity Mini-Table */}
      <div className="bg-white border border-gray-200 rounded-[2.5rem] overflow-hidden shadow-sm">
         <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h3 className="text-lg font-black text-gray-900">Recent Transactions</h3>
            <button className="text-xs font-black text-blue-600 uppercase tracking-widest hover:underline">View All</button>
         </div>
         <div className="p-12 text-center text-gray-400 font-bold uppercase tracking-widest text-sm">
            Live financial transaction stream established.
         </div>
      </div>
    </div>
  );
}
