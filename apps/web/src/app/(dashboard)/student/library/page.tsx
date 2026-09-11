'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Book,
  BookOpen,
  Search,
  ArrowRight,
  Clock,
  History,
  Bookmark,
  TrendingUp,
  Loader2,
  ChevronRight,
  Star
} from 'lucide-react';
import Link from 'next/link';

export default function StudentLibraryDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // We should probably have a specific student library overview endpoint
    // but for now we'll use existing ones or filter
    Promise.all([
      apiFetch('/library/books?limit=5'),
      apiFetch('/library/loans?status=ACTIVE'), // Backend needs to handle student self-view
    ])
    .then(([books, loans]) => setData({ books, loans }))
    .catch(console.error)
    .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-4 lg:p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-gray-900 tracking-tight leading-tight">
            Digital <span className="text-blue-600">Library</span>
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Access educational resources and track your loans</p>
        </div>
        <div className="flex items-center gap-3">
           <Link href="/student/library/books" className="bg-blue-600 text-white px-6 py-2.5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2">
             <Search size={18} /> Search Catalog
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
           {/* Discover Section */}
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-black text-gray-900 tracking-tight">Discover New Reads</h3>
                 <Link href="/student/library/books" className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1">View All <ArrowRight size={14}/></Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {data?.books?.slice(0, 4).map((book: any) => (
                   <Link key={book.id} href={`/student/library/books/${book.id}`} className="group space-y-4">
                      <div className="aspect-[3/4] bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden group-hover:shadow-lg transition-all group-hover:-translate-y-1">
                         {book.coverImage ? (
                            <img src={book.coverImage} className="w-full h-full object-cover" />
                         ) : <Book className="text-gray-200" size={32} />}
                      </div>
                      <div>
                         <h4 className="text-xs font-black text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{book.title}</h4>
                         <p className="text-[9px] font-bold text-gray-400 uppercase mt-1 truncate">{book.authors[0]?.author.name}</p>
                      </div>
                   </Link>
                 ))}
              </div>
           </section>

           {/* Current Loans */}
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-xl font-black text-gray-900 tracking-tight mb-8">My Active Loans</h3>
              <div className="space-y-4">
                 {data?.loans?.map((loan: any) => (
                   <div key={loan.id} className="flex items-center gap-6 p-5 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-blue-100 transition-all group">
                      <div className="w-12 h-16 bg-white rounded-xl flex items-center justify-center border border-gray-100 shadow-sm shrink-0">
                         <BookOpen size={24} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <h4 className="text-sm font-black text-gray-900 truncate">{loan.bookCopy.book.title}</h4>
                         <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Accession: {loan.bookCopy.accessionNumber}</span>
                            <div className="flex items-center gap-1 text-orange-600">
                               <Clock size={10} />
                               <span className="text-[9px] font-black uppercase">Due {new Date(loan.dueDate).toLocaleDateString()}</span>
                            </div>
                         </div>
                      </div>
                      <Link href={`/student/library/loans/${loan.id}`} className="p-3 bg-white text-gray-400 hover:text-blue-600 rounded-2xl transition-all shadow-sm opacity-0 group-hover:opacity-100">
                         <ChevronRight size={20} />
                      </Link>
                   </div>
                 ))}
                 {(!data?.loans || data.loans.length === 0) && (
                   <div className="py-12 text-center border-2 border-dashed border-gray-100 rounded-[2rem]">
                      <Bookmark size={40} className="mx-auto text-gray-200 mb-4" />
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No active books borrowed</p>
                      <Link href="/student/library/books" className="mt-4 inline-block text-[10px] font-black text-blue-600 uppercase tracking-widest">Browse Library</Link>
                   </div>
                 )}
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <LibraryAccountCard />
           <QuickSearchCard />
        </div>
      </div>
    </div>
  );
}

function LibraryAccountCard() {
  return (
    <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
       <div className="flex justify-between items-start mb-8">
          <div className="p-3 bg-white/10 rounded-2xl"><Star className="text-yellow-400" size={24}/></div>
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Membership Active</span>
       </div>
       <div className="space-y-6">
          <AccountMetric label="Books Borrowed" value="12" />
          <AccountMetric label="Books Reserved" value="0" />
          <AccountMetric label="Outstanding Fines" value="GH₵ 0.00" />
       </div>
       <button className="mt-10 w-full bg-white/5 border border-white/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
          View History
       </button>
    </div>
  );
}

function AccountMetric({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
       <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</span>
       <span className="text-sm font-black text-white">{value}</span>
    </div>
  );
}

function QuickSearchCard() {
  return (
    <div className="bg-blue-600 rounded-[2.5rem] p-8 shadow-xl text-white relative overflow-hidden group">
       <div className="relative z-10">
          <h3 className="text-xl font-black mb-6 tracking-tight">Need a Reference?</h3>
          <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
             <input
               type="text"
               placeholder="Search study material..."
               className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold placeholder:text-blue-100/50"
             />
          </div>
          <p className="mt-6 text-[10px] font-bold text-blue-100 opacity-70 leading-relaxed uppercase tracking-tight">
             Access over 5,000 digital and physical resources available in our campus collection.
          </p>
       </div>
       <History size={160} className="absolute -bottom-10 -right-10 text-white/5 -rotate-12 group-hover:rotate-0 transition-transform duration-700" />
    </div>
  );
}
