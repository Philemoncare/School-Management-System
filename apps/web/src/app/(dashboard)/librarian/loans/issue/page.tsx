'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  Search,
  Book,
  User,
  Clock,
  CheckCircle,
  Loader2,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Bookmark,
  ArrowRight
} from 'lucide-react';

export default function IssueBookPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [members, setMembers] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);

  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [selectedBook, setSelectedBook] = useState<any>(null);
  const [selectedCopy, setSelectedCopy] = useState<any>(null);

  const [memberSearch, setMemberSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );

  useEffect(() => {
    if (memberSearch) searchMembers();
  }, [memberSearch]);

  useEffect(() => {
    if (bookSearch) searchBooks();
  }, [bookSearch]);

  async function searchMembers() {
    setLoading(true);
    try {
      const data = await apiFetch(`/library/members?search=${memberSearch}`);
      setMembers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function searchBooks() {
    setLoading(true);
    try {
      const data = await apiFetch(`/library/books?search=${bookSearch}`);
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectBook(book: any) {
    setSelectedBook(book);
    setLoading(true);
    try {
      const fullBook = await apiFetch(`/library/books/${book.id}`);
      setSelectedBook(fullBook);
      const available = fullBook.copies.find((c: any) => c.status === 'AVAILABLE');
      if (available) setSelectedCopy(available);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleIssue(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMember || !selectedCopy) return;

    setSaving(true);
    try {
      await apiFetch('/library/loans/issue', {
        method: 'POST',
        body: JSON.stringify({
          membershipId: selectedMember.id,
          bookCopyId: selectedCopy.id,
          dueDate: new Date(dueDate),
        })
      });
      showFeedback('SUCCESS', 'Book issued successfully');
      router.push('/librarian/dashboard');
    } catch (err) {
      showFeedback('ERROR', 'Failed to issue book. Check member loan limits.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-card border border-warm-200 rounded-2xl hover:bg-ivory-50 transition-colors shadow-sm text-warm-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight leading-none">Circulation Desk</h1>
          <p className="text-warm-500 font-bold mt-2 uppercase tracking-wide text-[11px]">Issue new loans and register item checkouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Step 1: Member Selection */}
        <div className="space-y-6">
           <div className={`bg-card border-2 rounded-xl p-8 shadow-sm transition-all ${selectedMember ? 'border-success-100' : 'border-warm-100'}`}>
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-sm font-semibold text-charcoal-900 uppercase tracking-wide">1. Library Member</h3>
                 {selectedMember && <CheckCircle className="text-success-500" size={20} />}
              </div>
              {!selectedMember ? (
                <div className="space-y-4">
                   <div className="relative">
                      <Search className="absolute left-4 top-3.5 text-warm-400" size={18} />
                      <input
                        type="text"
                        placeholder="Name or ID Number..."
                        className="w-full bg-ivory-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold"
                        value={memberSearch}
                        onChange={(e) => setMemberSearch(e.target.value)}
                      />
                   </div>
                   <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {members.map(m => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedMember(m)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-ivory-50 transition-colors border border-transparent hover:border-warm-100"
                        >
                           <div className="w-10 h-10 rounded-xl bg-sage-50 text-forest-700 flex items-center justify-center font-semibold text-xs">
                              {m.user.firstName[0]}
                           </div>
                           <div className="text-left">
                              <p className="text-xs font-semibold text-charcoal-900">{m.user.firstName} {m.user.lastName}</p>
                              <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight">{m.membershipNumber}</p>
                           </div>
                        </button>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-success-50 rounded-3xl">
                   <div className="w-12 h-12 rounded-2xl bg-card flex items-center justify-center font-semibold text-success-600 shadow-sm">
                      {selectedMember.user.firstName[0]}
                   </div>
                   <div className="flex-1">
                      <p className="text-sm font-semibold text-charcoal-900 leading-tight">{selectedMember.user.firstName} {selectedMember.user.lastName}</p>
                      <p className="text-[11px] font-bold text-success-600 uppercase mt-0.5">{selectedMember.membershipNumber}</p>
                   </div>
                   <button onClick={() => setSelectedMember(null)} className="text-[11px] font-semibold text-warm-400 hover:text-danger-500 uppercase">Change</button>
                </div>
              )}
           </div>
        </div>

        {/* Step 2: Book Selection */}
        <div className="space-y-6">
           <div className={`bg-card border-2 rounded-xl p-8 shadow-sm transition-all ${selectedBook ? 'border-success-100' : 'border-warm-100'}`}>
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-sm font-semibold text-charcoal-900 uppercase tracking-wide">2. Item Checkout</h3>
                 {selectedBook && <CheckCircle className="text-success-500" size={20} />}
              </div>
              {!selectedBook ? (
                <div className="space-y-4">
                   <div className="relative">
                      <Search className="absolute left-4 top-3.5 text-warm-400" size={18} />
                      <input
                        type="text"
                        placeholder="Title, ISBN or Barcode..."
                        className="w-full bg-ivory-50 border-none rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold"
                        value={bookSearch}
                        onChange={(e) => setBookSearch(e.target.value)}
                      />
                   </div>
                   <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {books.map(b => (
                        <button
                          key={b.id}
                          onClick={() => handleSelectBook(b)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-ivory-50 transition-colors border border-transparent hover:border-warm-100"
                        >
                           <div className="w-10 h-14 bg-warm-100 rounded-lg flex items-center justify-center shrink-0 border border-warm-200">
                              <Book className="text-warm-300" size={16} />
                           </div>
                           <div className="text-left flex-1 min-w-0">
                              <p className="text-xs font-semibold text-charcoal-900 leading-tight truncate">{b.title}</p>
                              <p className="text-[11px] font-bold text-warm-400 uppercase truncate mt-0.5">{b.authors?.map((a: any) => a.author.name).join(', ')}</p>
                           </div>
                        </button>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="flex items-center gap-4 p-4 bg-success-50 rounded-3xl">
                      <div className="w-12 h-16 bg-card rounded-xl flex items-center justify-center border border-success-100 shadow-sm shrink-0">
                         <Book className="text-success-200" size={24} />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-xs font-semibold text-charcoal-900 leading-tight truncate">{selectedBook.title}</p>
                         <p className="text-[11px] font-bold text-success-600 uppercase mt-0.5 truncate">By {selectedBook.authors?.map((a: any) => a.author.name).join(', ')}</p>
                      </div>
                      <button onClick={() => { setSelectedBook(null); setSelectedCopy(null); }} className="text-[11px] font-semibold text-warm-400 hover:text-danger-500 uppercase">Change</button>
                   </div>

                   {selectedBook.copies && (
                     <div>
                        <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-3 px-1">Physical Copy</label>
                        <Select
                          className="w-full bg-ivory-50 border-none rounded-2xl px-5 py-3.5 text-xs font-bold text-charcoal-900"
                          value={selectedCopy?.id}
                          onChange={(e) => setSelectedCopy(selectedBook.copies.find((c: any) => c.id === e.target.value))}
                        >
                           {selectedBook.copies.map((c: any) => (
                             <option key={c.id} value={c.id} disabled={c.status !== 'AVAILABLE'}>
                                {c.accessionNumber} ({c.status})
                             </option>
                           ))}
                        </Select>
                     </div>
                   )}
                </div>
              )}
           </div>
        </div>

        {/* Step 3: Confirmation */}
        <div className="space-y-8">
           <div className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
              <h3 className="text-lg font-semibold mb-8 tracking-tight">Loan Parameters</h3>
              <div className="space-y-8">
                 <div>
                    <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-4">Scheduled Return Date</label>
                    <div className="relative">
                       <Calendar className="absolute left-4 top-3.5 text-warm-500" size={18} />
                       <input
                         type="date"
                         className="w-full bg-card/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-sm font-bold text-white focus:ring-2 focus:ring-forest-700"
                         value={dueDate}
                         onChange={(e) => setDueDate(e.target.value)}
                       />
                    </div>
                 </div>

                 <div className="space-y-4 pt-4 border-t border-white/5">
                    <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                       <span>Loan Duration</span>
                       <span className="text-white">14 Days</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                       <span>Fine Policy</span>
                       <span className="text-white">Active</span>
                    </div>
                 </div>
              </div>
           </div>

           <button
             onClick={handleIssue}
             disabled={saving || !selectedMember || !selectedCopy}
             className="w-full bg-forest-700 text-white p-6 rounded-xl font-semibold text-sm uppercase tracking-wide hover:bg-forest-800 shadow-xs shadow-sage-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20}/>}
              Finalize Checkout
           </button>

           <div className="bg-sage-50 border border-sage-100 rounded-3xl p-6 flex items-start gap-4">
              <AlertTriangle className="text-forest-500 shrink-0" size={20} />
              <p className="text-[11px] font-bold text-forest-800 leading-relaxed uppercase tracking-tight">
                 Checkout will trigger an in-app notification and email confirmation to the member.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}

