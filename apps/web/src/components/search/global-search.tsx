'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X, Command } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 1) {
        setLoading(true);
        apiFetch(`/search?q=${query}`)
          .then(setResults)
          .finally(() => setLoading(false));
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative hidden md:block" ref={containerRef}>
      <div className={`flex items-center bg-warm-100 px-4 py-2 rounded-2xl w-80 lg:w-96 focus-within:ring-2 focus-within:ring-forest-700 focus-within:bg-card transition-all border border-transparent focus-within:border-sage-100 ${isOpen && results.length > 0 ? 'rounded-b-none border-b-warm-200' : ''}`}>
        <Search size={18} className="text-warm-400 mr-3" />
        <input
          type="text"
          placeholder="Search students, staff, library..."
          className="bg-transparent border-none text-sm focus:ring-0 w-full placeholder:text-warm-500 font-bold"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
        <div className="flex items-center gap-2">
            {loading ? (
                <Loader2 size={16} className="animate-spin text-forest-700" />
            ) : (
                <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 bg-warm-200/50 rounded text-[11px] font-semibold text-warm-500">
                    <Command size={10} />
                    <span>K</span>
                </div>
            )}
            {query && (
                <button onClick={() => { setQuery(''); setResults([]); }} className="text-warm-400 hover:text-warm-600">
                    <X size={16} />
                </button>
            )}
        </div>
      </div>

      {isOpen && (results.length > 0 || (query.length > 1 && !loading)) && (
        <div className="absolute top-full left-0 right-0 bg-card border border-warm-200 border-t-0 rounded-b-3xl shadow-xs z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
             <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-2">
                {results.length > 0 ? (
                  <div className="space-y-1">
                    {/* Group by module if possible, for now just a list */}
                    <p className="px-3 py-2 text-[11px] font-semibold text-warm-400 uppercase tracking-wide">Global Search Results</p>
                    {results.map((item) => (
                      <Link
                        key={item.id}
                        href={item.route}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 p-3 hover:bg-sage-50 rounded-2xl transition-all group"
                      >
                         <div className="w-10 h-10 rounded-xl bg-ivory-50 flex items-center justify-center text-warm-500 group-hover:bg-card transition-colors">
                            {renderEntityIcon(item.entityType)}
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-semibold text-charcoal-900 leading-tight group-hover:text-forest-800 transition-colors">{item.title}</p>
                           <p className="text-[11px] font-bold text-warm-400 uppercase truncate mt-0.5">{item.subtitle || item.entityType}</p>
                         </div>
                         <div className="px-2 py-1 bg-warm-100 rounded text-[11px] font-semibold text-warm-500 uppercase group-hover:bg-sage-100 group-hover:text-forest-700 transition-colors">
                            {item.module}
                         </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-warm-400">
                     <p className="text-xs font-semibold uppercase tracking-wide">No matching records</p>
                  </div>
                )}
             </div>
             <div className="p-3 bg-ivory-50 border-t border-warm-100 flex items-center justify-center">
                <Link href="/dashboard/search/advanced" className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide hover:underline" onClick={() => setIsOpen(false)}>
                    Go to Advanced Search
                </Link>
             </div>
          </div>
      )}
    </div>
  );
}

import { User, Briefcase, FileText, DollarSign, Book, Bell, Calendar, ArrowRight } from 'lucide-react';

function renderEntityIcon(type: string) {
    switch (type) {
      case 'STUDENT': return <User size={18} />;
      case 'TEACHER': return <Briefcase size={18} />;
      case 'STAFF': return <Briefcase size={18} />;
      case 'INVOICE': return <FileText size={18} />;
      case 'PAYMENT': return <DollarSign size={18} />;
      case 'LIBRARY_BOOK': return <Book size={18} />;
      case 'ANNOUNCEMENT': return <Bell size={18} />;
      case 'CLASS': return <Calendar size={18} />;
      default: return <ArrowRight size={18} />;
    }
}
