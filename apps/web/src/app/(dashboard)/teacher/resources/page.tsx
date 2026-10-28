'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  BookMarked,
  BookOpen,
  FolderOpen,
  Loader2,
  Search,
} from 'lucide-react';

type Book = {
  id: string;
  title: string;
  isbn?: string | null;
  category?: { name: string } | null;
  authors: Array<{ author: { name: string } }>;
  _count?: { copies: number };
};

export default function TeacherResourcesPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiFetch('/library/books')
      .then(setBooks)
      .catch((err) => setError(err.message || 'Unable to load the resource catalog.'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return books;
    return books.filter((book) =>
      `${book.title} ${book.isbn || ''} ${book.category?.name || ''} ${book.authors.map((item) => item.author.name).join(' ')}`.toLowerCase().includes(query),
    );
  }, [books, search]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    books.forEach((book) => {
      const name = book.category?.name || 'Uncategorized';
      counts.set(name, (counts.get(name) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [books]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={40} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div>
        <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
          <FolderOpen className="text-forest-700" /> Academic Resources
        </h1>
        <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px]">Library-managed teaching and learning materials</p>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <CategoryCard label="Catalog Titles" count={books.length} icon={<BookMarked className="text-forest-700" />} />
        <CategoryCard label="Categories" count={categoryCounts.length} icon={<FolderOpen className="text-terracotta-600" />} />
        <CategoryCard label="Physical Copies" count={books.reduce((sum, book) => sum + (book._count?.copies || 0), 0)} icon={<BookOpen className="text-success-600" />} />
        <CategoryCard label="Search Results" count={filtered.length} icon={<Search className="text-forest-700" />} />
      </div>

      <div className="bg-card border border-warm-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-warm-100 flex flex-col md:flex-row md:items-center gap-4 bg-ivory-50/50">
          <div className="flex-1 bg-card border border-warm-200 px-5 py-3 rounded-xl flex items-center shadow-sm">
            <Search size={18} className="text-warm-400 mr-3" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} type="text" placeholder="Search by title, author, ISBN or category..." className="bg-transparent border-none w-full focus:ring-0 text-sm font-medium outline-none" />
          </div>
          <p className="text-xs font-medium text-warm-400">Resources are managed by the school librarian.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50/50">
              <tr>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Title</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Author</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Category</th>
                <th className="px-8 py-5 text-left text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Copies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {filtered.map((book) => (
                <tr key={book.id} className="hover:bg-sage-50/30 transition-colors">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-warm-100 rounded-lg text-warm-500"><BookOpen size={18} /></div>
                      <div>
                        <p className="text-sm font-semibold text-charcoal-800">{book.title}</p>
                        {book.isbn && <p className="text-[11px] font-medium text-warm-400">ISBN {book.isbn}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-sm font-medium text-warm-600">{book.authors.map((item) => item.author.name).join(', ') || 'Unknown'}</td>
                  <td className="px-8 py-5"><span className="text-[11px] font-semibold px-2 py-0.5 bg-warm-100 text-warm-500 rounded uppercase tracking-tight">{book.category?.name || 'Uncategorized'}</span></td>
                  <td className="px-8 py-5 text-sm font-semibold text-charcoal-900">{book._count?.copies || 0}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <FolderOpen className="mx-auto text-warm-200 mb-4" size={56} />
                    <p className="text-warm-400 font-semibold">No resources match your search.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CategoryCard({ label, count, icon }: { label: string; count: number; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
      <div className="p-3 bg-ivory-50 rounded-xl w-fit mb-4">{icon}</div>
      <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-charcoal-900 mt-1">{count} <span className="text-xs text-warm-300 font-bold uppercase tracking-tight">items</span></p>
    </div>
  );
}
