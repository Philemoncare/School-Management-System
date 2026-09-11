'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Book,
  BookOpen,
  Users,
  Clock,
  AlertTriangle,
  FileText,
  Plus,
  Search,
  ArrowRight,
  TrendingUp,
  History,
  CheckCircle2,
  ChevronRight,
  Loader2,
  Bookmark
} from 'lucide-react';
import Link from 'next/link';

export default function LibrarianDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/library/dashboard')
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const metrics = data?.metrics || {};

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-4 lg:p-8 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
            Librarian <span className="text-blue-600">Command Center</span>
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Library Inventory & Circulation Management</p>
        </div>
        <div className="flex items-center gap-3">
           <Link href="/librarian/books/new" className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2">
             <Plus size={18} /> Add Book
           </Link>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Books" value={metrics.totalBooks} icon={<Book className="text-blue-600"/>} color="bg-blue-50" />
        <StatCard title="Total Copies" value={metrics.totalCopies} icon={<Bookmark className="text-purple-600"/>} color="bg-purple-50" />
        <StatCard title="Available" value={metrics.availableCopies} icon={<CheckCircle2 className="text-green-600"/>} color="bg-green-50" />
        <StatCard title="Borrowed" value={metrics.borrowedCopies} icon={<BookOpen className="text-orange-600"/>} color="bg-orange-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-black text-gray-900 tracking-tight">Circulation Trends</h3>
                <div className="flex gap-2">
                   <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                      <span className="text-[10px] font-black uppercase text-gray-500">Issued</span>
                   </div>
                   <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-green-600"></div>
                      <span className="text-[10px] font-black uppercase text-gray-500">Returned</span>
                   </div>
                </div>
             </div>
             <div className="h-[300px] bg-gray-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-gray-100 relative overflow-hidden group">
                <TrendingUp size={48} className="text-gray-200 group-hover:scale-110 transition-transform duration-700" />
                <p className="text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] mt-2 absolute bottom-10">Real-time usage data stream</p>
             </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <SummaryListCard title="Overdue Loans" value={metrics.overdueLoans} icon={<Clock size={20}/>} color="bg-red-50 text-red-600" link="/librarian/loans?status=OVERDUE" />
              <SummaryListCard title="Active Members" value={metrics.activeMembers} icon={<Users size={20}/>} color="bg-blue-50 text-blue-600" link="/librarian/members" />
           </div>
        </div>

        <div className="space-y-8">
           <QuickActionsCard />
           <LibrarySearchCard />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-4">
        <div className={`${color} p-4 rounded-2xl group-hover:scale-110 transition-transform`}>{icon}</div>
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black text-gray-900 mt-1 tracking-tight">{value || '0'}</p>
      </div>
    </div>
  );
}

function SummaryListCard({ title, value, icon, color = "bg-blue-50 text-blue-600", link }: any) {
  return (
    <div className="bg-white border border-gray-200 rounded-[2rem] p-6 shadow-sm group cursor-pointer hover:border-blue-200 transition-all">
       <div className="flex justify-between items-start mb-6">
          <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
          <Link href={link} className="p-2 text-gray-300 hover:text-blue-600 transition-colors"><ChevronRight size={20}/></Link>
       </div>
       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
       <h4 className="text-2xl font-black text-gray-900 mt-1">{value || '0'}</h4>
    </div>
  );
}

function QuickActionsCard() {
  return (
    <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
       <h3 className="text-lg font-black mb-8 tracking-tight">Library Actions</h3>
       <div className="space-y-3">
          <ActionLink label="Issue Book" href="/librarian/loans/issue" />
          <ActionLink label="Return Book" href="/librarian/loans/return" />
          <ActionLink label="Register Member" href="/librarian/members/new" />
          <ActionLink label="View Reports" href="/librarian/reports" />
       </div>
    </div>
  );
}

function ActionLink({ label, href }: any) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 group">
       <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
       <ArrowRight size={16} className="text-blue-500 group-hover:translate-x-0.5 transition-transform" />
    </Link>
  );
}

function LibrarySearchCard() {
  return (
    <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden group">
       <div className="relative z-10">
          <div className="p-3 bg-white/10 rounded-2xl w-fit mb-6"><Search size={24}/></div>
          <h3 className="text-xl font-black mb-4 tracking-tight">Quick Catalog Search</h3>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10 focus-within:bg-white/20 transition-all">
             <input
               type="text"
               placeholder="Title, Author or ISBN..."
               className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold placeholder:text-blue-100/50"
             />
          </div>
          <Link href="/librarian/books" className="mt-8 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] hover:gap-3 transition-all">
             Advanced Search <ChevronRight size={14}/>
          </Link>
       </div>
       <Book size={160} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
    </div>
  );
}
