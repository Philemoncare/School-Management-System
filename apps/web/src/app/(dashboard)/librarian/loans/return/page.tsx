'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  Search,
  BookOpen,
  User,
  Clock,
  CheckCircle2,
  Loader2,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  History,
  ArrowDownLeft,
  XCircle,
  Hash
} from 'lucide-react';

export default function ReturnBookPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [search, setSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    condition: 'GOOD',
    notes: '',
  });

  useEffect(() => {
    if (search) searchLoans();
  }, [search]);

  async function searchLoans() {
    setLoading(true);
    try {
      const data = await apiFetch(`/library/loans?search=${search}&status=ACTIVE`);
      setLoans(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReturn(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedLoan) return;

    setSaving(true);
    try {
      await apiFetch(`/library/loans/${selectedLoan.id}/return`, {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      alert('Book returned successfully');
      router.push('/librarian/dashboard');
    } catch (err) {
      alert('Failed to return book');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none text-green-600">Inventory Recovery</h1>
          <p className="text-gray-500 font-bold mt-2 uppercase tracking-widest text-[10px]">Verify item condition and register book returns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-6">
           <div className={`bg-white border-2 rounded-[2.5rem] p-8 shadow-sm transition-all ${selectedLoan ? 'border-green-100' : 'border-gray-100'}`}>
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-8">1. Locate Loan</h3>
              {!selectedLoan ? (
                <div className="space-y-4">
                   <div className="relative">
                      <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
                      <input
                        type="text"
                        placeholder="Barcode or Accession #..."
                        className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                   </div>
                   <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {loans.map(loan => (
                        <button
                          key={loan.id}
                          onClick={() => setSelectedLoan(loan)}
                          className="w-full flex items-center gap-3 p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group"
                        >
                           <div className="w-12 h-16 bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 rounded-xl group-hover:scale-105 transition-transform shadow-sm border border-blue-100">
                              <BookOpen size={24} />
                           </div>
                           <div className="text-left flex-1 min-w-0">
                              <p className="text-xs font-black text-gray-900 truncate">{loan.bookCopy.book.title}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{loan.membership.user.firstName} {loan.membership.user.lastName}</p>
                              <div className="flex items-center gap-1.5 mt-2">
                                 <Clock size={10} className="text-orange-500" />
                                 <span className="text-[9px] font-black text-orange-600 uppercase">Due {new Date(loan.dueDate).toLocaleDateString()}</span>
                              </div>
                           </div>
                        </button>
                      ))}
                      {loans.length === 0 && search && !loading && (
                        <p className="text-center py-10 text-gray-400 font-bold text-[10px] uppercase">No active loans found</p>
                      )}
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="p-4 bg-green-50 rounded-3xl border border-green-100">
                      <div className="flex justify-between items-start mb-4">
                         <div className="bg-white p-2 rounded-xl shadow-sm text-green-600"><CheckCircle2 size={16}/></div>
                         <button onClick={() => setSelectedLoan(null)} className="text-[9px] font-black text-gray-400 hover:text-red-500 uppercase tracking-widest">Change</button>
                      </div>
                      <p className="text-xs font-black text-gray-900 leading-tight">{selectedLoan.bookCopy.book.title}</p>
                      <p className="text-[9px] font-bold text-green-600 uppercase mt-1 tracking-tight">Accession: {selectedLoan.bookCopy.accessionNumber}</p>
                   </div>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           {selectedLoan ? (
             <form onSubmit={handleReturn} className="space-y-8">
                <section className="bg-white border border-gray-200 rounded-[2.5rem] p-10 shadow-sm space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Verified Condition</label>
                         <select
                           required
                           className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-black text-gray-900 focus:ring-2 focus:ring-green-600 appearance-none"
                           value={formData.condition}
                           onChange={(e) => setFormData({...formData, condition: e.target.value})}
                         >
                            <option value="NEW">As New</option>
                            <option value="GOOD">Good Condition</option>
                            <option value="FAIR">Fair (Shows Wear)</option>
                            <option value="POOR">Poor (Requires Maintenance)</option>
                            <option value="DAMAGED">Damaged / Needs Repair</option>
                         </select>
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Check-in Status</label>
                         <div className="w-full bg-green-50 rounded-2xl px-6 py-4 text-sm font-black text-green-600 flex items-center gap-2">
                            <ShieldCheck size={18}/> READY FOR STORAGE
                         </div>
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Librarian Notes</label>
                      <textarea
                        rows={3}
                        placeholder="Any observations regarding the return..."
                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-green-600"
                        value={formData.notes}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      />
                   </div>

                   <div className="pt-8 border-t border-gray-50 flex items-center justify-between">
                      <div className="space-y-1">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Loan Duration</p>
                         <p className="text-sm font-black text-gray-900">14 Days Recorded</p>
                      </div>
                      {new Date() > new Date(selectedLoan.dueDate) ? (
                         <div className="text-right">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest leading-none mb-1">Overdue Fine</p>
                            <p className="text-xl font-black text-red-600">PENDING CALCULATION</p>
                         </div>
                      ) : (
                         <div className="text-right">
                            <span className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-[9px] font-black uppercase tracking-widest">Returned On Time</span>
                         </div>
                      )}
                   </div>
                </section>

                <div className="flex justify-end pt-4">
                   <button
                     type="submit"
                     disabled={saving}
                     className="bg-green-600 text-white px-12 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-green-100 transition-all flex items-center gap-3 disabled:opacity-50"
                   >
                      {saving ? <Loader2 className="animate-spin" size={20} /> : <ArrowDownLeft size={20} />}
                      Verify & Check-in Item
                   </button>
                </div>
             </form>
           ) : (
             <div className="h-full bg-white border-2 border-dashed border-gray-200 rounded-[2.5rem] flex flex-col items-center justify-center p-20 text-center">
                <div className="p-6 bg-green-50 text-green-600 rounded-full mb-6 animate-pulse"><BookOpen size={40}/></div>
                <h3 className="text-xl font-black text-gray-900">No active loan selected</h3>
                <p className="text-gray-400 mt-2 font-medium leading-relaxed">Search for a book by accession number or member name to begin the return process.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
