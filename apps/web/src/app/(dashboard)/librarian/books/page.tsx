'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Book as BookIcon,
  Search,
  Plus,
  Filter,
  MoreVertical,
  Loader2,
  Bookmark,
  ChevronRight,
  User,
  Hash,
  Layers,
  Tag
} from 'lucide-react';
import Link from 'next/link';

export default function BookCatalogPage() {
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
             <BookIcon className="text-blue-600" /> Library Catalog
          </h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Title-level bibliographic records and inventory management</p>
        </div>
        <Link href="/librarian/books/new" className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center gap-2">
          <Plus size={16} /> New Title
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-gray-50/50">
           <div className="flex-1 bg-white border border-gray-200 px-5 py-3 rounded-2xl flex items-center shadow-sm">
              <Search size={18} className="text-gray-400 mr-3" />
              <input
                type="text"
                placeholder="Search by title, author, category or ISBN..."
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

           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 p-8 gap-8">
              {books.map((book) => (
                <div key={book.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col">
                   <div className="flex justify-between items-start mb-6">
                      <div className="w-24 h-32 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100 overflow-hidden shadow-inner shrink-0 group-hover:scale-105 transition-transform">
                         {book.coverImage ? (
                            <img src={book.coverImage} className="w-full h-full object-cover" />
                         ) : <BookIcon className="text-gray-200" size={40} />}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                         <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest">{book.category?.name || 'General'}</span>
                         <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                            <Bookmark size={10} className="text-gray-400" />
                            <span className="text-[9px] font-black text-gray-600">{book._count.copies} Copies</span>
                         </div>
                      </div>
                   </div>

                   <div className="flex-1">
                      <h4 className="text-lg font-black text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">{book.title}</h4>
                      <div className="space-y-1.5 mb-6">
                         <div className="flex items-center gap-2 text-gray-400">
                            <User size={12}/>
                            <span className="text-[10px] font-bold uppercase truncate">{book.authors?.map((a: any) => a.author.name).join(', ') || 'Unknown Author'}</span>
                         </div>
                         <div className="flex items-center gap-2 text-gray-400">
                            <Hash size={12}/>
                            <span className="text-[10px] font-bold uppercase">{book.isbn || 'No ISBN'}</span>
                         </div>
                      </div>
                   </div>

                   <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                      <Link href={`/librarian/books/${book.id}`} className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                         View Collection <ChevronRight size={14}/>
                      </Link>
                      <button className="p-2 text-gray-300 hover:text-gray-900 transition-colors"><MoreVertical size={18}/></button>
                   </div>
                </div>
              ))}
              {books.length === 0 && !loading && (
                 <div className="col-span-full py-20 text-center">
                    <BookIcon className="mx-auto text-gray-200 mb-4" size={64} />
                    <p className="text-gray-400 font-bold text-lg uppercase tracking-widest">No books found in catalog</p>
                 </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
