'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  Book as BookIcon,
  User,
  Hash,
  Loader2,
  Bookmark,
  ArrowRight,
} from 'lucide-react';

export default function StudentBookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();
  const [book, setBook] = useState<any>(null);
  const [activeReservation, setActiveReservation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    loadBook();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  async function loadBook() {
    setLoading(true);
    setError('');
    try {
      const [data, reservations] = await Promise.all([
        apiFetch(`/library/books/${bookId}`),
        apiFetch('/library/reservations').catch(() => []),
      ]);
      setBook(data);
      const mine = Array.isArray(reservations)
        ? reservations.find(
            (reservation: any) =>
              reservation.bookId === bookId &&
              ['PENDING', 'READY', 'FULFILLED'].includes(String(reservation.status)),
          )
        : null;
      setActiveReservation(mine ?? null);
    } catch (err: any) {
      setBook(null);
      setError(err?.message || 'Could not load this book.');
    } finally {
      setLoading(false);
    }
  }

  async function handleReserve() {
    if (reserving) return;
    setReserving(true);
    try {
      await apiFetch('/library/reservations', {
        method: 'POST',
        body: JSON.stringify({ bookId }),
      });
      showFeedback('SUCCESS', 'Book reserved. You will be notified when it is ready for pickup.');
      await loadBook();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Failed to reserve book');
    } finally {
      setReserving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading book…
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={() => router.push('/student/library/books')}
          className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-forest-700"
        >
          <ChevronLeft size={16} /> Back to catalogue
        </button>
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">{error || 'Book not found.'}</span>
          <button
            type="button"
            onClick={loadBook}
            className="rounded-xl border border-danger-300 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const availableCount = book.copies.filter((c: any) => c.status === 'AVAILABLE').length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-warm-400 hover:text-forest-700 transition-colors">
         <ChevronLeft size={16} /> Back to Catalog
      </button>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
         {/* Left: Cover & Actions */}
         <div className="md:col-span-4 space-y-8">
            <div className="aspect-[3/4] bg-ivory-50 rounded-xl border border-warm-100 flex items-center justify-center overflow-hidden shadow-xs shadow-forest-950/5 group">
               {book.coverImage ? (
                  <img src={book.coverImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
               ) : <BookIcon className="text-warm-200" size={80} />}
            </div>

            <div className="space-y-4">
               {availableCount > 0 ? (
                 <div className="p-6 bg-success-50 rounded-xl border border-success-100 text-center">
                    <p className="text-xs font-semibold text-success-700 uppercase tracking-wide">{availableCount} Copies Available</p>
                    <p className="text-[11px] font-medium text-success-600 mt-1 uppercase">Visit library to checkout</p>
                 </div>
               ) : activeReservation ? (
                 <div className="p-6 bg-sage-50 rounded-xl border border-sage-100 text-center">
                    <p className="text-xs font-semibold text-forest-700 uppercase tracking-wide">
                      Reserved • {String(activeReservation.status).replace(/_/g, ' ')}
                    </p>
                    <p className="text-[11px] font-medium text-forest-600 mt-1 uppercase">
                      The librarian will notify you when a copy is ready
                    </p>
                 </div>
               ) : (
                 <button
                   onClick={handleReserve}
                   disabled={reserving}
                   className="w-full bg-forest-700 text-white p-6 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 shadow-sm transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                 >
                    {reserving ? <Loader2 className="animate-spin" size={16} /> : <Bookmark size={18} />}
                    {reserving ? 'Reserving…' : 'Reserve copy'}
                 </button>
               )}
               <Link
                 href="/student/library/loans"
                 className="w-full bg-card border border-warm-200 text-warm-700 p-6 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-ivory-50 transition-all shadow-sm flex items-center justify-center gap-3"
               >
                  <ArrowRight size={18} /> View my loans
               </Link>
            </div>
         </div>

         {/* Right: Info */}
         <div className="md:col-span-8 space-y-12">
            <div>
               <div className="flex items-center gap-3 mb-4">
                  <span className="px-3 py-1 bg-sage-50 text-forest-700 rounded-full text-[11px] font-semibold uppercase tracking-wide">{book.category?.name || 'General'}</span>
                  <span className="px-3 py-1 bg-warm-100 text-warm-500 rounded-full text-[11px] font-semibold uppercase tracking-wide">{book.language}</span>
               </div>
               <h1 className="text-4xl lg:text-5xl font-semibold text-charcoal-900 tracking-tight leading-[1.1] mb-6">{book.title}</h1>
               {book.subtitle && <p className="text-xl font-bold text-warm-400 -mt-4 mb-6 leading-relaxed">{book.subtitle}</p>}

               <div className="flex flex-wrap gap-8 items-center pt-4 border-t border-ivory-50">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-ivory-50 flex items-center justify-center text-warm-400"><User size={20}/></div>
                     <div>
                        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide leading-none mb-1">Author</p>
                        <p className="text-sm font-semibold text-charcoal-900">{book.authors?.map((a: any) => a.author.name).join(', ')}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 rounded-xl bg-ivory-50 flex items-center justify-center text-warm-400"><Hash size={20}/></div>
                     <div>
                        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide leading-none mb-1">ISBN Number</p>
                        <p className="text-sm font-semibold text-charcoal-900">{book.isbn || 'N/A'}</p>
                     </div>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
               <h3 className="text-xs font-semibold text-charcoal-900 uppercase tracking-wide border-b border-warm-100 pb-4">About this book</h3>
               <p className="text-base text-warm-500 font-medium leading-[1.8] text-justify">
                  {book.description || 'No description available for this title.'}
               </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-8 border-t border-ivory-50">
               <div className="space-y-4">
                  <h4 className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Publication Info</h4>
                  <div className="space-y-3">
                     <DetailRow label="Publisher" value={book.publisher?.name} />
                     <DetailRow label="Year" value={book.publicationYear} />
                     <DetailRow label="Edition" value={book.edition} />
                  </div>
               </div>
               <div className="space-y-4">
                  <h4 className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Library Details</h4>
                  <div className="space-y-3">
                     <DetailRow label="Total Copies" value={book.copies.length} />
                     <DetailRow label="Availability" value={availableCount > 0 ? 'In Stock' : 'On Loan'} color={availableCount > 0 ? 'text-success-600' : 'text-danger-500'} />
                     <DetailRow
                       label="My reservation"
                       value={
                         activeReservation
                           ? String(activeReservation.status).replace(/_/g, ' ')
                           : 'None'
                       }
                       color={activeReservation ? 'text-forest-700' : 'text-charcoal-900'}
                     />
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, color = "text-charcoal-900" }: any) {
  return (
    <div className="flex justify-between items-center text-xs">
       <span className="font-bold text-warm-400 uppercase tracking-tight">{label}</span>
       <span className={`font-semibold ${color}`}>{value || '—'}</span>
    </div>
  );
}
