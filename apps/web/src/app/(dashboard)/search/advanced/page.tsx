'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import { Select } from '@/components/ui/input';
import React, { useState, useEffect } from 'react';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, ChevronRight, FileText, User, Briefcase, Book, DollarSign, Calendar, Info, Save, RotateCcw } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import Link from 'next/link';

const SEARCHABLE_ENTITIES = [
  { value: 'STUDENT', label: 'Students', icon: <User size={16}/> },
  { value: 'TEACHER', label: 'Teachers', icon: <Briefcase size={16}/> },
  { value: 'STAFF', label: 'Staff', icon: <Briefcase size={16}/> },
  { value: 'ADMISSION_APPLICATION', label: 'Admissions', icon: <User size={16}/> },
  { value: 'INVOICE', label: 'Invoices', icon: <FileText size={16}/> },
  { value: 'PAYMENT', label: 'Payments', icon: <DollarSign size={16}/> },
  { value: 'LIBRARY_BOOK', label: 'Library Books', icon: <Book size={16}/> },
  { value: 'TRANSPORT_ROUTE', label: 'Transport Routes', icon: <Calendar size={16}/> },
];

export default function AdvancedSearchPage() {
  const [query, setQuery] = useState('');
  const [entity, setEntity] = useState('STUDENT');
  const [filters, setFilters] = useState<any>({});
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [results, setResults] = useState<any[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchSavedSearches = async () => {
    try {
      const data = await apiFetch('/search/saved');
      setSavedSearches(data);
    } catch (err) {
      console.error('Failed to fetch saved searches', err);
    }
  };

  useEffect(() => {
    fetchSavedSearches();
  }, []);

  const performSearch = async (overrides?: {
    query?: string;
    filters?: any;
    entity?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) => {
    const activeQuery = overrides?.query ?? query;
    const activeFilters = overrides?.filters ?? filters;
    const activeEntity = overrides?.entity ?? entity;
    const activeSortBy = overrides?.sortBy ?? sortBy;
    const activeSortOrder = overrides?.sortOrder ?? sortOrder;

    setLoading(true);
    setError('');
    try {
      const queryString = new URLSearchParams({
        q: activeQuery,
        entity: activeEntity,
        filters: JSON.stringify(activeFilters),
        sortBy: activeSortBy,
        sortOrder: activeSortOrder,
      }).toString();
      const data = await apiFetch(`/search/advanced?${queryString}`);
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setResults([]);
      setError(err?.message || 'Advanced search could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  const resetSearch = () => {
    setQuery('');
    setFilters({});
    performSearch({ query: '', filters: {} });
  };

  useEffect(() => {
    performSearch();
  }, [entity, sortBy, sortOrder]);

  const handleSaveSearch = async () => {
    setIsSaving(true);
    try {
      const name = prompt('Enter a name for this saved search:');
      if (!name) return;
      await apiFetch('/search/saved', {
        method: 'POST',
        body: JSON.stringify({
          name,
          query,
          filters,
          entityScope: [entity as any]
        })
      });
      showFeedback('SUCCESS', 'Search saved successfully!');
      await fetchSavedSearches();
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not save this search.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Advanced Discovery</h1>
          <p className="text-warm-500 font-medium mt-1">Refine your search across all school modules.</p>
        </div>
        <div className="flex items-center gap-3">
           <button
             onClick={handleSaveSearch}
             disabled={isSaving}
             className="flex items-center gap-2 px-5 py-2.5 bg-card border border-warm-200 text-warm-700 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-ivory-50 transition-all shadow-sm"
           >
             <Save size={16} /> Save Search
           </button>
           <button
             onClick={resetSearch}
             className="flex items-center gap-2 px-5 py-2.5 bg-warm-100 text-warm-600 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-warm-200 transition-all"
           >
             <RotateCcw size={16} /> Reset
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-card rounded-3xl p-6 shadow-sm border border-warm-100">
            <h3 className="text-xs font-semibold text-charcoal-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <Filter size={14} className="text-forest-700"/> Resource Type
            </h3>
            <div className="space-y-1">
              {SEARCHABLE_ENTITIES.map((item) => (
                <button
                  key={item.value}
                  onClick={() => setEntity(item.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm transition-all ${
                    entity === item.value
                      ? 'bg-forest-700 text-white font-semibold shadow-lg shadow-sage-100'
                      : 'text-warm-600 font-bold hover:bg-ivory-50'
                  }`}
                >
                  <span className={entity === item.value ? 'text-white' : 'text-warm-400'}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-card rounded-3xl p-6 shadow-sm border border-warm-100">
            <h3 className="text-xs font-semibold text-charcoal-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-terracotta-600"/> Filters
            </h3>
            <div className="space-y-4">
               <div>
                 <label className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1.5 block">Status</label>
                 <Select
                   className="w-full bg-ivory-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-terracotta-600"
                   value={filters.status ?? ''}
                   onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                 >
                   <option value="">All Statuses</option>
                   <option value="ACTIVE">Active</option>
                   <option value="INACTIVE">Inactive</option>
                   <option value="PENDING">Pending</option>
                 </Select>
               </div>
               {/* Entity specific filters could go here */}
            </div>
          </div>

          <div className="bg-card rounded-3xl p-6 shadow-sm border border-warm-100">
            <h3 className="text-xs font-semibold text-charcoal-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <ArrowUpDown size={14} className="text-warning-600"/> Sorting
            </h3>
            <div className="space-y-4">
               <Select
                 className="w-full bg-ivory-50 border-none rounded-xl text-sm font-bold focus:ring-2 focus:ring-warning-600"
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
               >
                 <option value="updatedAt">Last Updated</option>
                 <option value="title">Alphabetical</option>
                 <option value="createdAt">Date Created</option>
               </Select>
               <div className="flex bg-ivory-50 p-1 rounded-xl">
                 <button
                   onClick={() => setSortOrder('asc')}
                   className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all ${sortOrder === 'asc' ? 'bg-card shadow-sm text-warning-600' : 'text-warm-400'}`}
                 >ASC</button>
                 <button
                   onClick={() => setSortOrder('desc')}
                   className={`flex-1 py-2 text-[11px] font-semibold rounded-lg transition-all ${sortOrder === 'desc' ? 'bg-card shadow-sm text-warning-600' : 'text-warm-400'}`}
                 >DESC</button>
               </div>
            </div>
          </div>

          {savedSearches.length > 0 && (
            <div className="bg-card rounded-3xl p-6 shadow-sm border border-warm-100">
              <h3 className="text-xs font-semibold text-charcoal-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                <Save size={14} className="text-success-600"/> Saved Searches
              </h3>
              <div className="space-y-2">
                {savedSearches.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setQuery(s.query || '');
                      setFilters(s.filters || {});
                      if (s.entityScope?.[0]) setEntity(s.entityScope[0]);
                    }}
                    className="w-full text-left p-3 rounded-xl hover:bg-ivory-50 group border border-transparent hover:border-warm-100 transition-all"
                  >
                    <p className="text-xs font-semibold text-charcoal-800 group-hover:text-success-600 truncate">{s.name}</p>
                    <p className="text-[11px] text-warm-400 font-bold mt-0.5 uppercase">{s.entityScope?.[0] || 'Global'}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Results Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-warm-400 group-focus-within:text-forest-700 transition-colors" size={24} />
            <input
              type="text"
              placeholder={`Search ${SEARCHABLE_ENTITIES.find(e => e.value === entity)?.label.toLowerCase()}...`}
              className="w-full bg-card border border-warm-100 rounded-xl py-6 pl-16 pr-32 text-lg font-bold shadow-sm focus:ring-4 focus:ring-sage-50 focus:border-sage-200 transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
            />
            <button
              type="button"
              onClick={() => performSearch()}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-forest-700 text-white px-8 py-3.5 rounded-xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-lg shadow-sage-200 active:scale-95"
            >
              Search
            </button>
          </div>

          {error && (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="flex items-center gap-2">
                <Info size={16} /> {error}
              </span>
              <button
                type="button"
                onClick={() => performSearch()}
                className="rounded-xl border border-danger-200 bg-card px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-danger-700 transition-colors hover:bg-danger-50"
              >
                Try again
              </button>
            </div>
          )}

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-warm-100 shadow-sm">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-sage-100 border-t-forest-700 rounded-full animate-spin"></div>
                  <Search className="absolute inset-0 m-auto text-forest-700" size={24} />
                </div>
                <p className="mt-6 text-sm font-semibold text-warm-400 uppercase tracking-wide animate-pulse">Scanning database...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    href={item.route}
                    className="group bg-card p-6 rounded-xl border border-warm-100 hover:border-sage-200 hover:shadow-xs hover:shadow-sage-50/50 transition-all flex items-start gap-5 relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={20} className="text-forest-700"/>
                    </div>
                    <div className="w-14 h-14 rounded-2xl bg-ivory-50 flex items-center justify-center text-warm-400 group-hover:bg-sage-50 group-hover:text-forest-700 transition-colors shrink-0">
                      {item.entityType === 'STUDENT' && <User size={28}/>}
                      {item.entityType === 'TEACHER' && <Briefcase size={28}/>}
                      {item.entityType === 'INVOICE' && <FileText size={28}/>}
                      {item.entityType === 'LIBRARY_BOOK' && <Book size={28}/>}
                    </div>
                    <div className="flex-1 min-w-0 pt-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 bg-warm-100 text-[11px] font-semibold text-warm-500 rounded uppercase tracking-wider">{item.module}</span>
                        {item.status && (
                          <span className={`px-2 py-0.5 text-[11px] font-semibold rounded uppercase tracking-wider ${
                            item.status === 'ACTIVE' ? 'bg-success-50 text-success-600' : 'bg-warning-50 text-warning-600'
                          }`}>{item.status}</span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-charcoal-900 group-hover:text-forest-800 transition-colors truncate">{item.title}</h4>
                      <p className="text-sm font-bold text-warm-400 mt-1 truncate">{item.subtitle}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 bg-card rounded-xl border border-warm-100 shadow-sm text-center px-10">
                <div className="w-20 h-20 bg-ivory-50 rounded-full flex items-center justify-center mb-6">
                  <Info size={40} className="text-warm-300"/>
                </div>
                <h3 className="text-xl font-semibold text-charcoal-900 mb-2">Discovery yielded no results</h3>
                <p className="text-warm-500 font-medium max-w-sm">Try broadening your search query or adjusting your filters for better results.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
