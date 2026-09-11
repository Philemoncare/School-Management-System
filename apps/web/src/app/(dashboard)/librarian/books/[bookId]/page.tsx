'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  Book as BookIcon,
  Bookmark,
  User,
  Building2,
  Hash,
  Layers,
  Globe,
  Plus,
  Loader2,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  History,
  Barcode,
  Save,
  CheckCircle2,
  Edit3
} from 'lucide-react';

export default function BookDetailPage() {
  const { bookId } = useParams();
  const router = useRouter();
  const [book, setBook] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingCopy, setAddingCopy] = useState(false);

  const [copyData, setCopyData] = useState({
    accessionNumber: '',
    barcode: '',
    condition: 'NEW',
    locationId: '',
    shelf: '',
  });

  useEffect(() => {
    loadData();
  }, [bookId]);

  async function loadData() {
    try {
      const [bookData, locData] = await Promise.all([
        apiFetch(`/library/books/${bookId}`),
        apiFetch('/library/locations'),
      ]);
      setBook(bookData);
      setLocations(locData);

      // Auto-generate accession number for convenience
      setCopyData(prev => ({
        ...prev,
        accessionNumber: `ACC-${bookData.title.slice(0, 3).toUpperCase()}-${Date.now().toString().slice(-4)}`
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddCopy(e: React.FormEvent) {
    e.preventDefault();
    setAddingCopy(true);
    try {
      await apiFetch('/library/copies', {
        method: 'POST',
        body: JSON.stringify({ ...copyData, bookId })
      });
      loadData();
      alert('Physical copy added successfully');
    } catch (err) {
      alert('Failed to add copy');
    } finally {
      setAddingCopy(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">{book.title}</h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">{book.category?.name || 'Uncategorized'} • {book.authors?.map((a: any) => a.author.name).join(', ')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
           {/* Summary Stats */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BookStat value={book.copies.length} label="Total Copies" icon={<Bookmark size={18}/>} color="text-blue-600 bg-blue-50" />
              <BookStat value={book.copies.filter((c: any) => c.status === 'AVAILABLE').length} label="Available" icon={<CheckCircle2 size={18}/>} color="text-green-600 bg-green-50" />
              <BookStat value={book.copies.filter((c: any) => c.status === 'BORROWED').length} label="On Loan" icon={<Clock size={18}/>} color="text-orange-600 bg-orange-50" />
           </div>

           {/* Copy List */}
           <div className="bg-white border border-gray-200 rounded-[2.5rem] shadow-sm overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                 <h3 className="text-lg font-black text-gray-900 tracking-tight">Physical Inventory</h3>
                 <div className="flex gap-2">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Displaying {book.copies.length} items</span>
                 </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead className="bg-gray-50/30">
                       <tr>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Accession / Barcode</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Location</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Condition</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {book.copies.map((copy: any) => (
                         <tr key={copy.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-3">
                                  <Barcode className="text-gray-300" size={18} />
                                  <div>
                                     <p className="text-sm font-black text-gray-900">{copy.accessionNumber}</p>
                                     <p className="text-[10px] font-bold text-gray-400 uppercase">{copy.barcode || 'No Barcode'}</p>
                                  </div>
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <div className="flex items-center gap-2">
                                  <MapPin size={12} className="text-gray-400" />
                                  <span className="text-xs font-bold text-gray-700">{copy.location?.name || 'General'}</span>
                                  {copy.shelf && <span className="text-[9px] font-black bg-gray-100 px-2 py-0.5 rounded text-gray-500 uppercase">{copy.shelf}</span>}
                               </div>
                            </td>
                            <td className="px-8 py-6">
                               <StatusBadge status={copy.status} />
                            </td>
                            <td className="px-8 py-6 text-right">
                               <span className={`text-[10px] font-black uppercase tracking-widest ${
                                 copy.condition === 'NEW' ? 'text-blue-500' : 'text-gray-400'
                               }`}>{copy.condition}</span>
                            </td>
                         </tr>
                       ))}
                       {book.copies.length === 0 && (
                         <tr>
                            <td colSpan={4} className="px-8 py-20 text-center">
                               <AlertTriangle className="mx-auto text-gray-200 mb-4" size={48} />
                               <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No physical copies registered</p>
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
           <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
              <h3 className="text-lg font-black mb-8 tracking-tight flex items-center gap-2">
                 <Plus className="text-blue-500" /> Register New Copy
              </h3>
              <form onSubmit={handleAddCopy} className="space-y-6">
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Accession Number</label>
                    <input
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-600"
                      value={copyData.accessionNumber}
                      onChange={(e) => setCopyData({...copyData, accessionNumber: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Barcode (Optional)</label>
                    <input
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white focus:ring-2 focus:ring-blue-600"
                      value={copyData.barcode}
                      onChange={(e) => setCopyData({...copyData, barcode: e.target.value})}
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Location</label>
                       <select
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-600"
                         value={copyData.locationId}
                         onChange={(e) => setCopyData({...copyData, locationId: e.target.value})}
                       >
                          <option value="" className="bg-gray-900">Select...</option>
                          {locations.map(l => <option key={l.id} value={l.id} className="bg-gray-900">{l.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 px-1">Condition</label>
                       <select
                         className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-600"
                         value={copyData.condition}
                         onChange={(e) => setCopyData({...copyData, condition: e.target.value})}
                       >
                          <option value="NEW" className="bg-gray-900">New</option>
                          <option value="GOOD" className="bg-gray-900">Good</option>
                          <option value="FAIR" className="bg-gray-900">Fair</option>
                          <option value="POOR" className="bg-gray-900">Poor</option>
                       </select>
                    </div>
                 </div>
                 <button
                   type="submit"
                   disabled={addingCopy}
                   className="w-full bg-blue-600 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                 >
                    {addingCopy ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                    Add to Inventory
                 </button>
              </form>
           </div>

           {/* Bibliographic Info */}
           <div className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">Bibliographic Record</h3>
              <div className="space-y-4">
                 <InfoRow label="ISBN" value={book.isbn} />
                 <InfoRow label="Edition" value={book.edition} />
                 <InfoRow label="Year" value={book.publicationYear} />
                 <InfoRow label="Publisher" value={book.publisher?.name} />
                 <InfoRow label="Language" value={book.language} />
              </div>
              <div className="pt-4 mt-4 border-t border-gray-50">
                 <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed line-clamp-6">{book.description}</p>
                 <button className="mt-4 text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                    Full Description <ChevronRight size={12}/>
                 </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function BookStat({ value, label, icon, color }: any) {
  return (
    <div className={`p-6 rounded-3xl border border-gray-100 flex items-center gap-4 bg-white shadow-sm`}>
       <div className={`p-3 rounded-2xl ${color}`}>{icon}</div>
       <div>
          <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
       </div>
    </div>
  );
}

function StatusBadge({ status }: any) {
  const configs: any = {
    AVAILABLE: { color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
    BORROWED: { color: 'bg-orange-100 text-orange-700', icon: Clock },
    RESERVED: { color: 'bg-blue-100 text-blue-700', icon: Bookmark },
    LOST: { color: 'bg-red-100 text-red-700', icon: AlertTriangle },
    DAMAGED: { color: 'bg-gray-100 text-gray-600', icon: AlertTriangle },
  };
  const config = configs[status] || configs.AVAILABLE;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter ${config.color}`}>
       <Icon size={12} /> {status}
    </span>
  );
}

function InfoRow({ label, value }: any) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
       <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
       <span className="text-xs font-bold text-gray-900">{value || 'N/A'}</span>
    </div>
  );
}
