'use client';

import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ChecklistItem {
  id: string;
  label: string;
  description?: string;
}

/**
 * Scrollable multi-select checklist with a filter box. Used where a school or
 * another long reference list must be targeted explicitly (platform
 * announcements, maintenance windows, support access).
 */
export function SearchableChecklist({
  items,
  selectedIds,
  onToggle,
  emptyMessage = 'No options available.',
  searchPlaceholder = 'Search…',
  columns = 2,
  maxHeight = 'max-h-56',
  label,
}: {
  items: ChecklistItem[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  emptyMessage?: string;
  searchPlaceholder?: string;
  columns?: 1 | 2;
  maxHeight?: string;
  label?: string;
}) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return items;
    return items.filter((item) =>
      `${item.label} ${item.description ?? ''}`.toLowerCase().includes(needle),
    );
  }, [items, query]);

  return (
    <div className="space-y-2">
      {label && (
        <p className="text-[11px] font-semibold text-warm-600 sm:text-xs">
          {label}
          {selectedIds.length > 0 && (
            <span className="ml-1 font-bold text-forest-700">({selectedIds.length} selected)</span>
          )}
        </p>
      )}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-warm-400" />
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={label ? `Filter ${label}` : 'Filter options'}
          className="h-10 w-full rounded-lg border border-warm-200 bg-ivory-50 pl-9 pr-8 text-sm text-charcoal-900 outline-none placeholder:text-warm-400 focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/15"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear filter"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-warm-400 hover:bg-warm-100 hover:text-charcoal-800"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div
        className={cn(
          'grid grid-cols-1 gap-1 overflow-y-auto rounded-xl border border-warm-200 p-2',
          columns === 2 && 'sm:grid-cols-2',
          maxHeight,
        )}
      >
        {filtered.length === 0 ? (
          <p className="col-span-full px-2 py-4 text-center text-xs font-medium text-warm-500">
            {query.trim() ? `No matches for “${query.trim()}”.` : emptyMessage}
          </p>
        ) : (
          filtered.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 hover:bg-ivory-50"
            >
              <input
                type="checkbox"
                checked={selectedIds.includes(item.id)}
                onChange={() => onToggle(item.id)}
                className="h-4 w-4 shrink-0 rounded border-warm-300 text-forest-700"
              />
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold text-warm-700">
                  {item.label}
                </span>
                {item.description && (
                  <span className="block truncate text-[10px] text-warm-400">
                    {item.description}
                  </span>
                )}
              </span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
