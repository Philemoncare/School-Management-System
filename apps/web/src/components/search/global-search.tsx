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
      <div className={`flex items-center bg-gray-100 px-4 py-2 rounded-2xl w-80 lg:w-96 focus-within:ring-2 focus-within:ring-blue-600 focus-within:bg-white transition-all border border-transparent focus-within:border-blue-100 ${isOpen && results.length > 0 ? 'rounded-b-none border-b-gray-200' : ''}`}>
        <Search size={18} className="text-gray-400 mr-3" />
        <input
          type="text"
          placeholder="Search students, staff, library..."
          className="bg-transparent border-none text-sm focus:ring-0 w-full placeholder:text-gray-500 font-bold"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
          onFocus={() => setIsOpen(true)}
        />
        <div className="flex items-center gap-2">
            {loading ? (
                <Loader2 size={16} className="animate-spin text-blue-600" />
            ) : (
                <div className="hidden lg:flex items-center gap-1 px-1.5 py-0.5 bg-gray-200/50 rounded text-[10px] font-black text-gray-500">
                    <Command size={10} />
                    <span>K</span>
                </div>
            )}
            {query && (
                <button onClick={() => { setQuery(''); setResults([]); }} className="text-gray-400 hover:text-gray-600">
                    <X size={16} />
                </button>
            )}
        </div>
      </div>

      {isOpen && (results.length > 0 || (query.length > 1 && !loading)) && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 border-t-0 rounded-b-3xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
             <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-2">
                {results.length > 0 ? (
                  <div className="space-y-1">
                    {/* Group by module if possible, for now just a list */}
                    <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Search Results</p>
                    {results.map((item) => (
                      <Link
                        key={item.id}
                        href={item.route}
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-4 p-3 hover:bg-blue-50 rounded-2xl transition-all group"
                      >
                         <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 group-hover:bg-white transition-colors">
                            {renderEntityIcon(item.entityType)}
                         </div>
                         <div className="flex-1 min-w-0">
                           <p className="text-sm font-black text-gray-900 leading-tight group-hover:text-blue-700 transition-colors">{item.title}</p>
                           <p className="text-[11px] font-bold text-gray-400 uppercase truncate mt-0.5">{item.subtitle || item.entityType}</p>
                         </div>
                         <div className="px-2 py-1 bg-gray-100 rounded text-[9px] font-black text-gray-500 uppercase group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                            {item.module}
                         </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                     <p className="text-xs font-black uppercase tracking-widest">No matching records</p>
                  </div>
                )}
             </div>
             <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-center">
                <Link href="/dashboard/search/advanced" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline" onClick={() => setIsOpen(false)}>
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
