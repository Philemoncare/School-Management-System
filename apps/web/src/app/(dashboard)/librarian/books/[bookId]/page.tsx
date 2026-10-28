'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  ChevronRight,
  Book as BookIcon,
  Bookmark,
  User,
  Hash,
  Plus,
  Loader2,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  QrCode,
  Save,
} from 'lucide-react';

export default function BookDetailPage() {
  const { bookId } = useParams<{ bookId: string }>();
  const router = useRouter();
  const [book, setBook] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingCopy, setAddingCopy] = useState(false);
  const [copyError, setCopyError] = useState('');
  const [showFullDescription, setShowFullDescription] = useState(false);

  const [copyData, setCopyData] = useState({
    accessionNumber: '',
    barcode: '',
    condition: 'NEW',
    locationId: '',
    shelf: '',
  });

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  async function loadData() {
    setLoading(true);
    setError('');
    try {
      const [bookData, locData] = await Promise.all([
        apiFetch(`/library/books/${bookId}`),
        apiFetch('/library/locations'),
      ]);
      setBook(bookData);
      setLocations(Array.isArray(locData) ? locData : []);

      // Auto-generate accession number for convenience
      setCopyData((prev) => ({
        ...prev,
        accessionNumber: `ACC-${String(bookData.title ?? 'GEN')
          .slice(0, 3)
          .toUpperCase()}-${Date.now().toString().slice(-4)}`,
      }));
    } catch (err: any) {
      setBook(null);
      setError(err?.message || 'Could not load this title.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCopy(e: React.FormEvent) {
    e.preventDefault();
    if (addingCopy) return;
    if (!copyData.accessionNumber.trim()) {
      setCopyError('Enter an accession number.');
      return;
    }
    setAddingCopy(true);
    setCopyError('');
    try {
      await apiFetch('/library/copies', {
        method: 'POST',
        body: JSON.stringify({
          ...copyData,
          accessionNumber: copyData.accessionNumber.trim(),
          barcode: copyData.barcode.trim() || undefined,
          shelf: copyData.shelf.trim() || undefined,
          locationId: copyData.locationId || undefined,
          bookId,
        }),
      });
      await loadData();
      showFeedback('SUCCESS', 'Physical copy added successfully');
    } catch (err: any) {
      setCopyError(err?.message || 'Failed to add copy.');
    } finally {
      setAddingCopy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading title…
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 p-4 sm:p-6 lg:p-8">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm font-semibold text-forest-700"
        >
          <ChevronLeft size={16} /> Back to catalogue
        </button>
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertTriangle size={16} /> {error || 'Title not found.'}
          </span>
          <button
            type="button"
            onClick={loadData}
            className="rounded-xl border border-danger-300 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-card border border-warm-200 rounded-2xl hover:bg-ivory-50 transition-colors shadow-sm text-warm-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">{book.title}</h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">{book.category?.name || 'Uncategorized'} • {book.authors?.map((a: any) => a.author.name).join(', ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
           {/* Summary Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BookStat value={book.copies.length} label="Total Copies" icon={<Bookmark size={18}/>} color="text-forest-700 bg-sage-50" />
              <BookStat value={book.copies.filter((c: any) => c.status === 'AVAILABLE').length} label="Available" icon={<CheckCircle size={18}/>} color="text-success-600 bg-success-50" />
              <BookStat value={book.copies.filter((c: any) => c.status === 'BORROWED').length} label="On Loan" icon={<Clock size={18}/>} color="text-terracotta-600 bg-terracotta-50" />
           </div>

           {/* Copy List */}
           <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-8 border-b border-warm-100 flex justify-between items-center bg-ivory-50/50">
                 <h3 className="text-lg font-semibold text-charcoal-900 tracking-tight">Physical Inventory</h3>
                 <div className="flex gap-2">
                    <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Displaying {book.copies.length} items</span>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead className="bg-ivory-50/30">
                       <tr>
                          <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Accession / Barcode</th>
                          <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Location</th>
                          <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Status</th>
                          <th className="px-8 py-5 text-right text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Condition</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100">
                       {book.copies.map((copy: any) => (
                         <tr key={copy.id} className="hover:bg-sage-50/30 transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <QrCode className="text-warm-300" size={18} />
                                  <div>
                                     <p className="text-sm font-semibold text-charcoal-900">{copy.accessionNumber}</p>
                                     <p className="text-[11px] font-bold text-warm-400 uppercase">{copy.barcode || 'No Barcode'}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2">
                                  <MapPin size={12} className="text-warm-400" />
                                  <span className="text-xs font-bold text-warm-700">{copy.location?.name || 'General'}</span>
                                  {copy.shelf && <span className="text-[11px] font-semibold bg-warm-100 px-2 py-0.5 rounded text-warm-500 uppercase">{copy.shelf}</span>}
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <StatusBadge status={copy.status} />
                            </td>
                            <td className="px-8 py-6 text-right">
                               <span className={`text-[11px] font-semibold uppercase tracking-wide ${
                                 copy.condition === 'NEW' ? 'text-forest-500' : 'text-warm-400'
                               }`}>{copy.condition}</span>
                            </td>
                         </tr>
                       ))}
                       {book.copies.length === 0 && (
                         <tr>
                            <td colSpan={4} className="px-8 py-20 text-center">
                               <AlertTriangle className="mx-auto text-warm-200 mb-4" size={48} />
                               <p className="text-warm-400 font-bold uppercase tracking-wide text-sm">No physical copies registered</p>
                            </td>
                         </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
        </div>

        <div className="space-y-8">
           {/* Add Copy Form */}
           <div className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
              <h3 className="text-lg font-semibold mb-8 tracking-tight flex items-center gap-2">
                 <Plus className="text-forest-500" /> Register New Copy
              </h3>
              <form onSubmit={handleAddCopy} className="space-y-6">
                 {copyError && (
                    <p role="alert" className="rounded-lg bg-danger-500/20 p-3 text-[11px] font-semibold text-danger-100">
                       {copyError}
                    </p>
                 )}
                 <div>
                    <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-3 px-1">Accession Number</label>
                    <input
                      required
                      className="w-full bg-card/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-forest-700"
                      value={copyData.accessionNumber}
                      onChange={(e) => setCopyData({...copyData, accessionNumber: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-3 px-1">Barcode (Optional)</label>
                    <input
                      className="w-full bg-card/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-forest-700"
                      value={copyData.barcode}
                      onChange={(e) => setCopyData({...copyData, barcode: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-3 px-1">Location</label>
                       <Select
                         className="w-full bg-card/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-forest-700"
                         value={copyData.locationId}
                         onChange={(e) => setCopyData({...copyData, locationId: e.target.value})}
                       >
                          <option value="" className="bg-charcoal-900">Select...</option>
                          {locations.map(l => <option key={l.id} value={l.id} className="bg-charcoal-900">{l.name}</option>)}
                       </Select>
                    </div>
                    <div>
                       <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-3 px-1">Condition</label>
                       <Select
                         className="w-full bg-card/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-forest-700"
                         value={copyData.condition}
                         onChange={(e) => setCopyData({...copyData, condition: e.target.value})}
                       >
                          <option value="NEW" className="bg-charcoal-900">New</option>
                          <option value="GOOD" className="bg-charcoal-900">Good</option>
                          <option value="FAIR" className="bg-charcoal-900">Fair</option>
                          <option value="POOR" className="bg-charcoal-900">Poor</option>
                       </Select>
                    </div>
                 </div>
                 <button
                   type="submit"
                   disabled={addingCopy}
                   className="w-full bg-forest-700 text-white p-4 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all flex items-center justify-center gap-2"
                 >
                    {addingCopy ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Add to Inventory
                 </button>
              </form>
           </div>

           {/* Bibliographic Info */}
           <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm space-y-6">
              <h3 className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide border-b border-ivory-50 pb-4">Bibliographic Record</h3>
              <div className="space-y-4">
                 <InfoRow label="ISBN" value={book.isbn} />
                 <InfoRow label="Edition" value={book.edition} />
                 <InfoRow label="Year" value={book.publicationYear} />
                 <InfoRow label="Publisher" value={book.publisher?.name} />
                 <InfoRow label="Language" value={book.language} />
              </div>
              <div className="pt-4 mt-4 border-t border-ivory-50">
                 <p className={`text-[11px] font-bold text-warm-400 uppercase leading-relaxed ${showFullDescription ? '' : 'line-clamp-6'}`}>{book.description || 'No description recorded for this title.'}</p>
                 {book.description && (
                   <button
                     type="button"
                     aria-expanded={showFullDescription}
                     onClick={() => setShowFullDescription((current) => !current)}
                     className="mt-4 text-[11px] font-semibold text-forest-700 uppercase tracking-wide flex items-center gap-1 hover:gap-2 transition-all"
                   >
                      {showFullDescription ? 'Show less' : 'Full description'} <ChevronRight size={12} className={`transition-transform ${showFullDescription ? 'rotate-90' : ''}`}/>
                   </button>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function BookStat({ value, label, icon, color }: any) {
  return (
    <div className={`p-6 rounded-3xl border border-warm-100 flex items-center gap-4 bg-card shadow-sm`}>
       <div className={`p-3 rounded-2xl ${color}`}>{icon}</div>
       <div>
          <p className="text-2xl font-semibold text-charcoal-900 leading-none">{value}</p>
          <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mt-1">{label}</p>
       </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const configs: any = {
    AVAILABLE: { color: 'bg-success-100 text-success-700', icon: CheckCircle },
    BORROWED: { color: 'bg-terracotta-100 text-terracotta-700', icon: Clock },
    RESERVED: { color: 'bg-sage-100 text-forest-800', icon: Bookmark },
    LOST: { color: 'bg-danger-100 text-danger-700', icon: AlertTriangle },
    DAMAGED: { color: 'bg-warm-100 text-warm-600', icon: AlertTriangle },
  };
  const config = configs[status] || configs.AVAILABLE;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-tighter ${config.color}`}>
       <Icon size={12} /> {status}
    </span>
  );
}

function InfoRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-ivory-50 last:border-0">
       <span className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{label}</span>
       <span className="text-xs font-bold text-charcoal-900">{value || 'N/A'}</span>
    </div>
  );
}
