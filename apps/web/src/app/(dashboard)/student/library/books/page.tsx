'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Book as BookIcon,
  Search,
  Filter,
  Loader2,
  ChevronRight,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export default function StudentBookSearchPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [categoryId, setCategoryId] = useState('');
  const [language, setLanguage] = useState('');
  const [languages, setLanguages] = useState<string[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const loadBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (categoryId) params.set('categoryId', categoryId);
      if (language) params.set('language', language);
      const data = await apiFetch(`/library/books${params.toString() ? `?${params.toString()}` : ''}`);
      const list = Array.isArray(data) ? data : [];
      setBooks(list);
      setLanguages((current) => {
        const next = new Set(current);
        for (const book of list) {
          if (book.language) next.add(book.language);
        }
        return Array.from(next).sort();
      });
    } catch (err: any) {
      setBooks([]);
      setError(err?.message || 'Could not load the catalogue.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryId, language]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    apiFetch('/library/categories')
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const activeFilterCount = [categoryId, language].filter(Boolean).length;

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
          <BookIcon className="text-forest-700" /> Library catalogue
        </h1>
        <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
          Browse and reserve resources from the school library
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <div className="space-y-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center rounded-2xl border border-warm-200 bg-card px-5 py-3 shadow-sm transition-all focus-within:ring-2 focus-within:ring-forest-700/10">
              <Search size={18} className="mr-3 shrink-0 text-warm-400" />
              <input
                type="search"
                aria-label="Search the library"
                placeholder="Search by title, author or ISBN…"
                className="w-full border-none bg-transparent text-sm font-bold text-charcoal-900 placeholder:text-warm-400 focus:ring-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              aria-expanded={filtersOpen}
              aria-controls="student-library-filters"
              className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-5 py-3 text-[11px] font-semibold uppercase tracking-wide shadow-sm transition-all ${
                filtersOpen || activeFilterCount
                  ? 'border-forest-700 bg-forest-700 text-white'
                  : 'border-warm-200 bg-card text-warm-600 hover:bg-ivory-50'
              }`}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-white/20 px-1.5 text-[10px]">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {filtersOpen && (
            <div id="student-library-filters" className="grid grid-cols-1 gap-3 rounded-2xl border border-warm-200 bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
              <Select
                label="Category"
                value={categoryId}
                onChange={(event) => setCategoryId(event.target.value)}
                options={[
                  { value: '', label: 'All categories' },
                  ...categories.map((category) => ({ value: category.id, label: category.name })),
                ]}
              />
              <Select
                label="Language"
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                options={[
                  { value: '', label: 'All languages' },
                  ...languages.map((item) => ({ value: item, label: item })),
                ]}
              />
              <div className="flex items-end">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activeFilterCount === 0}
                  onClick={() => {
                    setCategoryId('');
                    setLanguage('');
                  }}
                >
                  Clear filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 border-b border-danger-100 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="flex items-center gap-2">
              <AlertCircle size={16} /> {error}
            </span>
            <Button variant="outline" size="sm" onClick={loadBooks}>
              Try again
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-3 py-24 text-sm font-medium text-warm-500">
            <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading catalogue…
          </div>
        ) : books.length === 0 ? (
          <div className="p-6 sm:p-10">
            <EmptyState
              icon={<BookIcon className="h-8 w-8" />}
              title={debouncedSearch || activeFilterCount ? 'No books match your search' : 'The catalogue is empty'}
              description={
                debouncedSearch || activeFilterCount
                  ? 'Try a different title, author or filter.'
                  : 'The librarian has not added any titles yet.'
              }
              actionButton={
                debouncedSearch || activeFilterCount ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setCategoryId('');
                      setLanguage('');
                    }}
                  >
                    Clear search
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-4">
            {books.map((book) => {
              const copies = book._count?.copies ?? 0;
              return (
                <div
                  key={book.id}
                  className="group flex flex-col rounded-xl border border-warm-100 bg-card p-5 shadow-sm transition-all hover:border-sage-200 hover:shadow-md"
                >
                  <div className="relative mb-5 flex aspect-[3/4] items-center justify-center overflow-hidden rounded-2xl border border-warm-100 bg-ivory-50 shadow-inner transition-transform group-hover:-translate-y-1">
                    {book.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                      <BookIcon className="text-warm-200" size={44} />
                    )}
                  </div>

                  <div className="flex-1">
                    <h2 className="mb-1 line-clamp-2 text-sm font-semibold leading-tight text-charcoal-900 transition-colors group-hover:text-forest-700">
                      {book.title}
                    </h2>
                    <p className="mb-4 truncate text-[11px] font-bold uppercase text-warm-400">
                      {book.authors?.map((a: any) => a.author.name).join(', ') || 'Unknown author'}
                    </p>

                    <div className="mb-5 flex flex-wrap gap-2">
                      <span className="rounded bg-ivory-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                        {book.category?.name || 'General'}
                      </span>
                      {book.language && (
                        <span className="rounded bg-sage-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-forest-700">
                          {book.language}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-ivory-50 pt-4">
                    <div className="flex items-center gap-1.5">
                      {copies > 0 ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-tight text-success-600">
                          <CheckCircle size={12} /> {copies} available
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-tight text-danger-500">
                          <XCircle size={12} /> No copies
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/student/library/books/${book.id}`}
                      aria-label={`Open ${book.title}`}
                      className="rounded-xl bg-sage-50 p-2.5 text-forest-700 transition-all hover:bg-forest-700 hover:text-white"
                    >
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
