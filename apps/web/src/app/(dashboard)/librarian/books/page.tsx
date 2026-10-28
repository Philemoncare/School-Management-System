'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Book as BookIcon,
  Search,
  Plus,
  Loader2,
  Bookmark,
  ChevronRight,
  User,
  Hash,
  AlertCircle,
} from 'lucide-react';

export default function BookCatalogPage() {
  const [books, setBooks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');

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
      const data = await apiFetch(`/library/books${params.toString() ? `?${params.toString()}` : ''}`);
      setBooks(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setBooks([]);
      setError(err?.message || 'Could not load the library catalogue.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, categoryId]);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  useEffect(() => {
    apiFetch('/library/categories')
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => setCategories([]));
  }, []);

  const totalCopies = useMemo(
    () => books.reduce((sum, book) => sum + (book._count?.copies ?? 0), 0),
    [books],
  );

  const hasFilters = Boolean(debouncedSearch || categoryId);

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            <BookIcon className="text-forest-700" /> Library catalogue
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
            {books.length} title{books.length === 1 ? '' : 's'} • {totalCopies} cop
            {totalCopies === 1 ? 'y' : 'ies'} on record
          </p>
        </div>
        <Link
          href="/librarian/books/new"
          className="inline-flex items-center gap-2 rounded-2xl bg-forest-700 px-6 py-3 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-forest-800"
        >
          <Plus size={16} /> New title
        </Link>
      </div>

      <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-warm-100 bg-ivory-50/50 p-4 sm:p-6 lg:flex-row lg:items-end">
          <div className="flex flex-1 items-center rounded-2xl border border-warm-200 bg-card px-5 py-3 shadow-sm">
            <Search size={18} className="mr-3 shrink-0 text-warm-400" />
            <input
              type="search"
              aria-label="Search the catalogue"
              placeholder="Search by title, author or ISBN…"
              className="w-full border-none bg-transparent text-sm font-bold text-charcoal-900 placeholder:text-warm-400 focus:ring-0"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-full lg:w-64">
            <Select
              label="Category"
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              options={[
                { value: '', label: 'All categories' },
                ...categories.map((category) => ({ value: category.id, label: category.name })),
              ]}
            />
          </div>
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
              title={hasFilters ? 'No titles match your filters' : 'No titles in the catalogue yet'}
              description={
                hasFilters
                  ? 'Clear the search or category filter to see the full catalogue.'
                  : 'Add the first bibliographic record, then register physical copies against it.'
              }
              actionButton={
                hasFilters ? (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearch('');
                      setCategoryId('');
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Link
                    href="/librarian/books/new"
                    className="inline-flex items-center gap-2 rounded-xl bg-forest-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-forest-800"
                  >
                    <Plus size={15} /> New title
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 p-4 sm:p-6 md:grid-cols-2 xl:grid-cols-3">
            {books.map((book) => (
              <div
                key={book.id}
                className="group flex flex-col rounded-xl border border-warm-100 bg-card p-5 shadow-sm transition-all hover:border-sage-200 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex h-28 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-warm-100 bg-ivory-50 shadow-inner transition-transform group-hover:scale-105">
                    {book.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={book.coverImage} alt={book.title} className="h-full w-full object-cover" />
                    ) : (
                      <BookIcon className="text-warm-200" size={36} />
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="rounded-full bg-sage-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-forest-700">
                      {book.category?.name || 'General'}
                    </span>
                    <div className="flex items-center gap-1.5 rounded-full border border-warm-100 bg-ivory-50 px-3 py-1">
                      <Bookmark size={10} className="text-warm-400" />
                      <span className="text-[11px] font-semibold text-warm-600">
                        {book._count?.copies ?? 0} cop{(book._count?.copies ?? 0) === 1 ? 'y' : 'ies'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex-1">
                  <h2 className="mb-2 line-clamp-2 text-lg font-semibold leading-tight text-charcoal-900 transition-colors group-hover:text-forest-700">
                    {book.title}
                  </h2>
                  <div className="mb-5 space-y-1.5">
                    <div className="flex items-center gap-2 text-warm-400">
                      <User size={12} />
                      <span className="truncate text-[11px] font-bold uppercase">
                        {book.authors?.map((a: any) => a.author.name).join(', ') || 'Unknown author'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-warm-400">
                      <Hash size={12} />
                      <span className="text-[11px] font-bold uppercase">{book.isbn || 'No ISBN'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-ivory-50 pt-4">
                  <Link
                    href={`/librarian/books/${book.id}`}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-forest-700 transition-all hover:gap-2"
                  >
                    View copies <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
