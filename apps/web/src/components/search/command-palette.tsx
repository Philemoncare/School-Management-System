'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Command as CommandIcon, X, User, Book, DollarSign, Calendar, Settings, ArrowRight, Loader2, FileText, Briefcase, Bell, CheckSquare } from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [commands, setCommands] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      fetchCommands();
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.length > 1) {
        performSearch();
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchCommands = async () => {
    try {
      const cmds = await apiFetch('/search/commands');
      setCommands(cmds);
    } catch (err) {
      console.error('Failed to fetch commands', err);
    }
  };

  const performSearch = async () => {
    setLoading(true);
    try {
      const data = await apiFetch(`/search?q=${query}`);
      setResults(data);
      setSelectedIndex(0);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const totalResults = results.length + (query === '' ? commands.length : 0);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % totalResults);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalResults) % totalResults);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const currentItem = query === '' ? commands[selectedIndex] : results[selectedIndex];
      if (currentItem) {
        handleSelect(currentItem);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSelect = (item: any) => {
    setIsOpen(false);
    router.push(item.route);
  };

  if (!isOpen) return null;

  const displayItems = query === '' ? commands : results;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24 sm:pt-40 px-4">
      <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 flex flex-col max-h-[60vh]">
        <div className="flex items-center px-6 py-4 border-b border-gray-100">
          <Search className="text-gray-400 mr-4" size={20} />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent border-none text-lg focus:ring-0 placeholder:text-gray-400 font-medium"
            placeholder="Search students, staff, invoices, or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {loading ? (
            <Loader2 className="animate-spin text-blue-600" size={20} />
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg">
              <span className="text-[10px] font-black text-gray-400 uppercase">ESC</span>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
          {displayItems.length > 0 ? (
            <div className="space-y-1">
              <p className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                {query === '' ? 'Suggested Commands' : 'Search Results'}
              </p>
              {displayItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center gap-4 px-4 py-3 rounded-2xl cursor-pointer transition-all ${
                    selectedIndex === index ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-[1.01]' : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    selectedIndex === index ? 'bg-white/20' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {renderIcon(item.entityType || item.id, item.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black truncate leading-tight ${selectedIndex === index ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </p>
                    <p className={`text-[11px] font-bold truncate mt-0.5 ${selectedIndex === index ? 'text-white/70' : 'text-gray-400 font-medium'}`}>
                      {item.subtitle || item.entityType || 'Action'}
                    </p>
                  </div>
                  {selectedIndex === index && <ArrowRight size={16} className="text-white/70" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Search size={32} />
               </div>
               <p className="text-sm font-black uppercase tracking-widest">No results found</p>
               <p className="text-xs mt-1">Try a different keyword or identifier</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
           <div className="flex items-center gap-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↵</span>
                <span>Select</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-white border border-gray-200 rounded">↑↓</span>
                <span>Navigate</span>
              </div>
           </div>
           <Link href="/dashboard/search/advanced" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline" onClick={() => setIsOpen(false)}>
              Advanced Search
           </Link>
        </div>
      </div>
    </div>
  );
}

function renderIcon(type: string, customIcon?: string) {
  if (customIcon === 'UserPlus') return <User size={20} />;
  if (customIcon === 'DollarSign') return <DollarSign size={20} />;
  if (customIcon === 'CheckSquare') return <CheckSquare size={20} />;
  if (customIcon === 'PlusCircle') return <PlusCircle size={20} />;
  if (customIcon === 'Bell') return <Bell size={20} />;

  switch (type) {
    case 'STUDENT': return <User size={20} />;
    case 'TEACHER': return <Briefcase size={20} />;
    case 'INVOICE': return <FileText size={20} />;
    case 'PAYMENT': return <DollarSign size={20} />;
    case 'LIBRARY_BOOK': return <Book size={20} />;
    case 'TRANSPORT_ROUTE': return <ArrowRight size={20} />;
    case 'ANNOUNCEMENT': return <Bell size={20} />;
    case 'CLASS': return <Calendar size={20} />;
    default: return <CommandIcon size={20} />;
  }
}

import { PlusCircle } from 'lucide-react';
