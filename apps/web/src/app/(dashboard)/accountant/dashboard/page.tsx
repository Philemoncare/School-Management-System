'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  CreditCard,
  FileText,
  Users,
  ChevronRight,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

export default function AccountantDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/finance/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const metrics = data?.metrics || {};

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
            Financial <span className="text-blue-600">Command Center</span>
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Real-time School Revenue & Collections</p>
        </div>
        <div className="flex items-center gap-3">
           <button className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2">
             <FileText size={18} /> Generate Billing
           </button>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Billed" value={`GH₵ ${parseFloat(metrics.totalBilled || 0).toLocaleString()}`} icon={<FileText className="text-blue-600"/>} color="bg-blue-50" />
        <StatCard title="Total Collected" value={`GH₵ ${parseFloat(metrics.totalCollected || 0).toLocaleString()}`} icon={<CreditCard className="text-green-600"/>} color="bg-green-50" trend="+12.5%" />
        <StatCard title="Outstanding" value={`GH₵ ${parseFloat(metrics.outstanding || 0).toLocaleString()}`} icon={<AlertCircle className="text-red-600"/>} color="bg-red-50" />
        <StatCard title="Collection Rate" value={`${metrics.collectionRate || 0}%`} icon={<TrendingUp className="text-purple-600"/>} color="bg-purple-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Revenue Chart Placeholder */}
           <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Collection Trends</h3>
                <select className="bg-gray-50 border-none text-xs font-black text-gray-400 rounded-xl focus:ring-0">
                   <option>Last 30 Days</option>
                   <option>Last 6 Months</option>
                </select>
             </div>
             <div className="h-[300px] bg-gray-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-100 relative overflow-hidden">
                <PieChart className="text-gray-200" size={64} />
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mt-4 absolute">Real-time revenue stream active</p>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SummaryListCard title="Today's Collections" value={`GH₵ ${parseFloat(metrics.paymentsToday || 0).toLocaleString()}`} count={5} icon={<DollarSign size={20}/>} link="/accountant/payments" />
              <SummaryListCard title="Overdue Invoices" value={metrics.overdueCount} icon={<Clock size={20}/>} color="bg-red-50 text-red-600" link="/accountant/invoices?status=OVERDUE" />
           </div>
        </div>

        <div className="space-y-8">
           <AccountantActionsCard />
           <SchoolPopulationFinanceCard studentsWithBalance={metrics.studentsWithBalance} />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, trend }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>{icon}</div>
        {trend && <span className="text-green-600 text-[10px] font-black flex items-center gap-1"><ArrowUpRight size={14}/> {trend}</span>}
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{value}</p>
      </div>
    </div>
  );
}

function SummaryListCard({ title, value, count, icon, color = "bg-blue-50 text-blue-600", link }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm group cursor-pointer hover:border-blue-200 transition-all">
       <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
          <Link href={link} className="p-2 text-gray-300 hover:text-blue-600 transition-colors"><ChevronRight size={20}/></Link>
       </div>
       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
       <h4 className="text-2xl font-black text-gray-900 mt-1">{value}</h4>
       {count !== undefined && <p className="text-[9px] font-bold text-gray-400 mt-1 uppercase tracking-tight">{count} transactions processed</p>}
    </div>
  );
}

function AccountantActionsCard() {
  return (
    <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
       <h3 className="text-lg font-black mb-8 tracking-tight">Quick Actions</h3>
       <div className="space-y-3">
          <ActionLink label="Record Cash Payment" href="/accountant/payments/record" />
          <ActionLink label="Create Fee Item" href="/accountant/fees/new" />
          <ActionLink label="Refund Request" href="/accountant/refunds/new" />
          <ActionLink label="Financial Reports" href="/accountant/reports" />
       </div>
    </div>
  );
}

function ActionLink({ label, href }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group">
       <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
       <ArrowUpRight size={16} className="text-blue-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
    </Link>
  );
}

function SchoolPopulationFinanceCard({ studentsWithBalance }: any) {
  return (
    <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden group">
       <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
             <div className="p-3 bg-white/10 rounded-2xl"><Users size={24}/></div>
          </div>
          <h3 className="text-3xl font-black mb-2">{studentsWithBalance || '0'}</h3>
          <p className="text-blue-100 text-xs font-black uppercase tracking-widest">Students with Balances</p>
          <p className="mt-6 text-blue-100/60 text-[10px] leading-relaxed font-medium uppercase tracking-tight">
             Automated reminders are active for {studentsWithBalance} accounts.
          </p>
          <Link href="/accountant/outstanding" className="mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:gap-3 transition-all">
             View List <ChevronRight size={14}/>
          </Link>
       </div>
       <Users size={160} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
    </div>
  );
}
