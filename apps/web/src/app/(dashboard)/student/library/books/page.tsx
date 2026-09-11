'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Book as BookIcon,
  Search,
  Filter,
  Loader2,
  Bookmark,
  ChevronRight,
  User,
  Hash,
  Star,
  CheckCircle2,
  XCircle,
  Calendar
} from 'lucide-react';
import Link from 'next/link';

export default function StudentBookSearchPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadBooks();
  }, [search]);

  async function loadBooks() {
    setLoading(true);
    try {
      const data = await apiFetch(`/library/books?search=${search}`);
      setBooks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
             <BookIcon className="text-blue-600" /> Digital Catalog
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Browse and discover available institutional resources</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm focus-within:ring-2 focus-within:ring-blue-600/10 transition-all">
              <Search size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by title, author, or keyword..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold placeholder:text-gray-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
           </div>
           <button className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-500 shadow-sm"><Filter size={18}/></button>
        </div>

        <div className="relative min-h-[500px]">
           {loading && (
             <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={32} />
             </div>
           )}

           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 p-8 gap-8">
              {books.map((book) => (
                <div key={book.id} className="group flex flex-col bg-white border border-gray-100 rounded-[2rem] p-5 shadow-sm hover:shadow-2xl hover:border-blue-100 transition-all">
                   <div className="aspect-[3/4] bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden mb-6 relative group-hover:-translate-y-1 transition-transform shadow-inner">
                      {book.coverImage ? (
                         <img src={book.coverImage} className="w-full h-full object-cover" />
                      ) : <BookIcon className="text-gray-200" size={48} />}

                      <div className="absolute top-3 right-3">
                         <button className="p-2 bg-white/90 backdrop-blur-sm rounded-xl text-gray-400 hover:text-blue-600 shadow-sm transition-colors">
                            <Bookmark size={16} />
                         </button>
                      </div>
                   </div>

                   <div className="flex-1">
                      <div className="flex justify-between items-start gap-2 mb-2">
                         <h4 className="text-sm font-black text-gray-900 leading-tight line-clamp-2 group-hover:text-blue-600 transition-colors">{book.title}</h4>
                      </div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase truncate mb-4">{book.authors?.map((a: any) => a.author.name).join(', ')}</p>

                      <div className="flex flex-wrap gap-2 mb-6">
                         <span className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-[8px] font-black uppercase tracking-widest">{book.category?.name || 'General'}</span>
                         <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[8px] font-black uppercase tracking-widest">{book.language}</span>
                      </div>
                   </div>

                   <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                         {book._count.copies > 0 ? (
                            <span className="flex items-center gap-1 text-[9px] font-black text-green-600 uppercase tracking-tighter">
                               <CheckCircle2 size={12}/> Available
                            </span>
                         ) : (
                            <span className="flex items-center gap-1 text-[9px] font-black text-red-500 uppercase tracking-tighter">
                               <XCircle size={12}/> Out of Stock
                            </span>
                         )}
                      </div>
                      <Link href={`/student/library/books/${book.id}`} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-600 hover:text-white transition-all">
                         <ChevronRight size={16} />
                      </Link>
                   </div>
                </div>
              ))}
           </div>

           {books.length === 0 && !loading && (
              <div className="py-32 text-center">
                 <Search className="mx-auto text-gray-200 mb-4" size={64} />
                 <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No matching books found</p>
                 <button onClick={() => setSearch('')} className="mt-4 text-blue-600 font-black text-xs uppercase tracking-widest">Clear search filters</button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
