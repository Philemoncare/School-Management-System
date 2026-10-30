'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  History,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Loader2,
  RefreshCcw,
  ShieldCheck,
  Tag
} from 'lucide-react';
import { Select } from '@/components/ui/input';

export default function LedgerPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [direction, setDirection] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadLedger();
  }, []);

  async function loadLedger() {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch('/finance/ledger');
      setEntries(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setEntries([]);
      setError(err?.message || 'Could not load ledger entries.');
    } finally {
      setLoading(false);
    }
  }

  const visible = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return entries.filter((entry) => {
      if (direction && entry.direction !== direction) return false;
      if (!needle) return true;
      return (
        String(entry.transactionType ?? '').toLowerCase().includes(needle) ||
        String(entry.description ?? '').toLowerCase().includes(needle) ||
        String(entry.referenceType ?? '').toLowerCase().includes(needle) ||
        `${entry.student?.firstName ?? ''} ${entry.student?.lastName ?? ''}`
          .toLowerCase()
          .includes(needle)
      );
    });
  }, [entries, search, direction]);

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
             <History className="text-forest-700" /> General Ledger
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Authoritative record of all financial transactions</p>
        </div>
        <div className="flex items-center gap-3">
           <button onClick={loadLedger} className="p-3 bg-card border border-warm-200 rounded-2xl text-warm-500 hover:text-forest-700 transition-all shadow-sm">
             <RefreshCcw size={18} className={loading ? 'animate-spin' : ''} />
           </button>
           <Link href="/dashboard/activity" className="bg-charcoal-900 text-white px-8 py-3 rounded-2xl font-semibold text-[11px] uppercase tracking-wide hover:bg-charcoal-950 shadow-xs transition-all flex items-center gap-2">
             <ShieldCheck size={16} /> Audit Trail
           </Link>
        </div>
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex items-center gap-4 bg-ivory-50/50">
           <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3" />
              <input
                type="text"
                placeholder="Search ledger entries..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <Select
             aria-label="Filter ledger entries by direction"
             value={direction}
             placeholder="All entries"
             options={[
                { value: "", label: "All entries" },
                { value: "DEBIT", label: "Debits" },
                { value: "CREDIT", label: "Credits" },
             ]}
             onChange={(event) => setDirection(event.target.value)}
             className="w-auto min-w-[140px]"
           />
        </div>

        {error && (
          <div role="alert" className="border-b border-danger-200 bg-danger-50 px-6 py-3 text-xs font-semibold text-danger-700">
            {error}
          </div>
        )}

        <div className="relative min-h-[500px]">
           {loading && (
             <div className="absolute inset-0 bg-card/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-forest-700" size={32} />
             </div>
           )}

           <table className="min-w-full divide-y divide-warm-200">
             <thead className="bg-ivory-50/50">
               <tr>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Transaction</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Reference</th>
                 <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Student</th>
                 <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Debit</th>
                 <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Credit</th>
                 <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Date</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-warm-100 bg-card">
               {visible.map((entry) => (
                 <tr key={entry.id} className="hover:bg-ivory-50/50 transition-colors group">
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-xl ${entry.direction === 'DEBIT' ? 'bg-danger-50 text-danger-600' : 'bg-success-50 text-success-600'}`}>
                             {entry.direction === 'DEBIT' ? <ArrowUpRight size={18}/> : <ArrowDownLeft size={18}/>}
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-charcoal-900 leading-tight">{entry.transactionType.replace('_', ' ')}</p>
                             <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tighter mt-1 truncate max-w-[200px]">{entry.description}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-warm-100 text-warm-600 rounded-lg text-[11px] font-semibold uppercase tracking-wide">
                          <Tag size={10}/> {entry.referenceType}
                       </span>
                    </td>
                    <td className="px-8 py-6">
                       {entry.student ? (
                         <div>
                            <p className="text-xs font-semibold text-charcoal-900 leading-tight">{entry.student.firstName} {entry.student.lastName}</p>
                            <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide">{entry.student.studentNumber}</p>
                         </div>
                       ) : <span className="text-warm-300 font-bold text-[11px] uppercase">Institutional</span>}
                    </td>
                    <td className="px-8 py-6 text-right">
                       <span className={`text-sm font-semibold ${entry.direction === 'DEBIT' ? 'text-danger-600' : 'text-warm-300'}`}>
                          {entry.direction === 'DEBIT' ? `${entry.currency} ${parseFloat(entry.amount).toLocaleString()}` : 'â€”'}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <span className={`text-sm font-semibold ${entry.direction === 'CREDIT' ? 'text-success-600' : 'text-warm-300'}`}>
                          {entry.direction === 'CREDIT' ? `${entry.currency} ${parseFloat(entry.amount).toLocaleString()}` : 'â€”'}
                       </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <div className="flex flex-col items-end">
                          <p className="text-xs font-semibold text-charcoal-900">{new Date(entry.createdAt).toLocaleDateString()}</p>
                          <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tighter">{new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                       </div>
                    </td>
                 </tr>
               ))}
               {visible.length === 0 && !loading && (
                 <tr>
                    <td colSpan={6} className="px-8 py-20 text-center">
                       <History className="mx-auto text-warm-200 mb-4" size={64} />
                       <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">{entries.length === 0 ? 'No ledger entries found' : 'No entries match this filter'}</p>
                    </td>
                 </tr>
               )}
             </tbody>
           </table>
        </div>
      </div>
    </div>
  );
}
