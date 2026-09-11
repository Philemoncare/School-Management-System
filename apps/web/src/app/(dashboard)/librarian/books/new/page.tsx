'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  Save,
  Loader2,
  Book,
  User,
  Building2,
  CheckCircle2,
  Layers,
  Globe,
  Hash,
  FileText
} from 'lucide-react';

export default function NewBookPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    isbn: '',
    edition: '',
    publicationYear: new Date().getFullYear(),
    language: 'English',
    description: '',
    categoryId: '',
    publisherId: '',
    authorIds: [] as string[],
  });

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    try {
      const [catData, authData, pubData] = await Promise.all([
        apiFetch('/library/categories'),
        apiFetch('/library/authors'),
        apiFetch('/library/publishers'),
      ]);
      setCategories(catData);
      setAuthors(authData);
      setPublishers(pubData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/library/books', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          publicationYear: parseInt(formData.publicationYear.toString()),
        })
      });
      router.push('/librarian/books');
    } catch (err) {
      alert('Failed to create book title');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2.5 bg-white border border-gray-200 rounded-2xl hover:bg-gray-50 transition-colors shadow-sm text-gray-500">
           <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">New Title</h1>
          <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px]">Create a new bibliographic record in the library catalog</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-10 shadow-sm space-y-8">
              <div className="space-y-6">
                 <InputGroup label="Book Title" value={formData.title} onChange={(v) => setFormData({...formData, title: v})} placeholder="e.g. Introduction to Algorithms" icon={<Book size={16}/>} />
                 <InputGroup label="Subtitle (Optional)" value={formData.subtitle} onChange={(v) => setFormData({...formData, subtitle: v})} placeholder="e.g. A comprehensive guide..." />

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <InputGroup label="ISBN" value={formData.isbn} onChange={(v) => setFormData({...formData, isbn: v})} placeholder="978-0..." icon={<Hash size={16}/>} />
                    <div>
                       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">Category</label>
                       <select
                         required
                         className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 appearance-none"
                         value={formData.categoryId}
                         onChange={(e) => setFormData({...formData, categoryId: e.target.value})}
                       >
                          <option value="">Select Category...</option>
                          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              <div className="pt-8 border-t border-gray-50">
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 px-1">Bibliographic Details</label>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <InputGroup label="Edition" value={formData.edition} onChange={(v) => setFormData({...formData, edition: v})} placeholder="3rd Ed." />
                    <InputGroup label="Year" value={formData.publicationYear} onChange={(v) => setFormData({...formData, publicationYear: v})} type="number" />
                    <InputGroup label="Language" value={formData.language} onChange={(v) => setFormData({...formData, language: v})} icon={<Globe size={16}/>} />
                 </div>
              </div>

              <div className="pt-8 border-t border-gray-50">
                 <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 px-1">Description / Abstract</label>
                 <textarea
                   rows={4}
                   className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600"
                   placeholder="Brief summary of the book content..."
                   value={formData.description}
                   onChange={(e) => setFormData({...formData, description: e.target.value})}
                 />
              </div>
           </section>
        </div>

        <div className="space-y-8">
           <div className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
              <h3 className="text-lg font-black mb-8 tracking-tight">Relationships</h3>
              <div className="space-y-8">
                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Authors</label>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-2">
                       {authors.map(a => (
                         <label key={a.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 cursor-pointer transition-colors border border-white/5">
                            <input
                              type="checkbox"
                              className="w-4 h-4 rounded border-white/10 bg-transparent text-blue-600"
                              checked={formData.authorIds.includes(a.id)}
                              onChange={(e) => {
                                 const ids = e.target.checked
                                   ? [...formData.authorIds, a.id]
                                   : formData.authorIds.filter(id => id !== a.id);
                                 setFormData({...formData, authorIds: ids});
                              }}
                            />
                            <span className="text-xs font-bold">{a.name}</span>
                         </label>
                       ))}
                    </div>
                    <button type="button" className="mt-4 text-[9px] font-black text-blue-400 uppercase tracking-widest">+ New Author</button>
                 </div>

                 <div>
                    <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Publisher</label>
                    <select
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-blue-600"
                      value={formData.publisherId}
                      onChange={(e) => setFormData({...formData, publisherId: e.target.value})}
                    >
                       <option value="" className="bg-gray-900 text-white">Select Publisher...</option>
                       {publishers.map(p => <option key={p.id} value={p.id} className="bg-gray-900 text-white">{p.name}</option>)}
                    </select>
                    <button type="button" className="mt-4 text-[9px] font-black text-blue-400 uppercase tracking-widest">+ New Publisher</button>
                 </div>
              </div>
           </div>

           <button
             type="submit"
             disabled={saving}
             className="w-full bg-blue-600 text-white p-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
           >
              {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
              Initialize Title
           </button>
        </div>
      </form>
    </div>
  );
}

function InputGroup({ label, value, onChange, placeholder, icon, type = "text" }: any) {
  return (
    <div>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 px-1">{label}</label>
      <div className="relative">
         {icon && <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">{icon}</div>}
         <input
           type={type}
           required={type !== "text" || label.includes("Title")}
           placeholder={placeholder}
           className={`w-full bg-gray-50 border-none rounded-2xl ${icon ? 'pl-11' : 'px-6'} pr-4 py-3.5 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-600 transition-all`}
           value={value}
           onChange={(e) => onChange(e.target.value)}
         />
      </div>
    </div>
  );
}
