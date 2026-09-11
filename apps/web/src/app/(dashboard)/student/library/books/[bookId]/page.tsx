'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  Book as BookIcon,
  User,
  Building2,
  Hash,
  Globe,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Bookmark,
  Calendar,
  Star,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

export default function StudentBookDetailPage() {
  const { bookId } = useParams();
  const router = useRouter();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    loadBook();
  }, [bookId]);

  async function loadBook() {
    try {
      const data = await apiFetch(`/library/books/${bookId}`);
      setBook(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleReserve() {
    setReserving(true);
    try {
      await apiFetch('/library/reservations', {
        method: 'POST',
        body: JSON.stringify({ bookId })
      });
      alert('Book reserved successfully. You will be notified when it is ready for pickup.');
    } catch (err) {
      alert('Failed to reserve book');
    } finally {
      setReserving(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;
  if (!book) return <div className="p-20 text-center text-gray-500">Book not found</div>;

  const availableCount = book.copies.filter((c: any) => c.status === 'AVAILABLE').length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-colors">
         <ChevronLeft size={16} /> Back to Catalog
      </button>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
         {/* Left: Cover & Actions */}
         <div className="md:col-span-4 space-y-8">
            <div className="aspect-[3/4] bg-gray-50 rounded-[3rem] border border-gray-100 flex items-center justify-center overflow-hidden shadow-2xl shadow-blue-900/5 group">
               {book.coverImage ? (
                  <img src={book.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
               ) : <BookIcon className="text-gray-200" size={80} />}
            </div>

            <div className="space-y-4">
               {availableCount > 0 ? (
                 <div className="p-6 bg-green-50 rounded-[2rem] border border-green-100 text-center">
                    <p className="text-xs font-black text-green-700 uppercase tracking-widest">{availableCount} Copies Available</p>
                    <p className="text-[10px] font-medium text-green-600 mt-1 uppercase">Visit library to checkout</p>
                 </div>
               ) : (
                 <button
                   onClick={handleReserve}
                   disabled={reserving}
                   className="w-full bg-blue-600 text-white p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {reserving ? <Loader2 className="animate-spin" size={16} /> : <Bookmark size={18} />}
                    Reserve Copy
                 </button>
               )}
               <button className="w-full bg-white border border-gray-200 text-gray-700 p-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-3">
                  <Star size={18} /> Add to Reading List
               </button>
            </div>
         </div>

         {/* Right: Info */}
         <div className="md:col-span-8 space-y-12">
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest">{book.category?.name || 'General'}</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-[10px] font-black uppercase tracking-widest">{book.language}</span>
               </div>
               <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.1] mb-6">{book.title}</h1>
               {book.subtitle && <p className="text-xl font-bold text-gray-400 -mt-4 mb-6 leading-relaxed">{book.subtitle}</p>}

               <div className="flex flex-wrap gap-8 items-center pt-4 border-t border-gray-50">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><User size={20}/></div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Author</p>
                        <p className="text-sm font-black text-gray-900">{book.authors?.map((a: any) => a.author.name).join(', ')}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400"><Hash size={20}/></div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">ISBN Number</p>
                        <p className="text-sm font-black text-gray-900">{book.isbn || 'N/A'}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest border-b border-gray-100 pb-4">About this book</h3>
               <p className="text-base text-gray-500 font-medium leading-[1.8] text-justify">
                  {book.description || 'No description available for this title.'}
               </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publication Info</h4>
                  <div className="space-y-3">
                     <DetailRow label="Publisher" value={book.publisher?.name} />
                     <DetailRow label="Year" value={book.publicationYear} />
                     <DetailRow label="Edition" value={book.edition} />
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Library Details</h4>
                  <div className="space-y-3">
                     <DetailRow label="Total Copies" value={book.copies.length} />
                     <DetailRow label="Availability" value={availableCount > 0 ? 'In Stock' : 'On Loan'} color={availableCount > 0 ? 'text-green-600' : 'text-red-500'} />
                     <DetailRow label="Reservation Queue" value="None" />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, color = "text-gray-900" }: any) {
  return (
    <div className="flex justify-between items-center text-xs">
       <span className="font-bold text-gray-400 uppercase tracking-tight">{label}</span>
       <span className={`font-black ${color}`}>{value || '—'}</span>
    </div>
  );
}
