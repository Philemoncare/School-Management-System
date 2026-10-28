'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Loader2, Search, UserCheck, X } from 'lucide-react';

export interface FrontOfficeStudent {
  id: string;
  firstName: string;
  lastName: string;
  studentNumber: string;
  enrollments?: Array<{
    class?: { name?: string | null } | null;
    section?: { name?: string | null } | null;
  }>;
  guardians?: Array<{
    guardian?: {
      firstName?: string | null;
      lastName?: string | null;
      phone?: string | null;
    } | null;
  }>;
}

export function studentName(student: FrontOfficeStudent) {
  return `${student.firstName} ${student.lastName}`.trim();
}

export function studentClass(student: FrontOfficeStudent) {
  const enrollment = student.enrollments?.[0];
  const className = enrollment?.class?.name;
  const sectionName = enrollment?.section?.name;
  if (!className) return 'No active class';
  return sectionName ? `${className} · ${sectionName}` : className;
}

interface Props {
  selected: FrontOfficeStudent | null;
  onSelect: (student: FrontOfficeStudent | null) => void;
  label?: string;
  helperText?: string;
  error?: string;
}

/**
 * Debounced server-side student search. Never lists every student in the
 * school on the client — the reception desk searches by name or student number.
 */
export function StudentPicker({
  selected,
  onSelect,
  label = 'Student *',
  helperText = 'Search by name or student number.',
  error,
}: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FrontOfficeStudent[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const requestRef = useRef(0);

  useEffect(() => {
    if (selected) return;
    const needle = query.trim();
    if (needle.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }

    const requestId = ++requestRef.current;
    setSearching(true);
    setSearchError('');
    const timer = setTimeout(async () => {
      try {
        const data = await apiFetch(
          `/front-office/students/search?q=${encodeURIComponent(needle)}`,
        );
        if (requestRef.current !== requestId) return;
        setResults(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (requestRef.current !== requestId) return;
        setResults([]);
        setSearchError(err?.message || 'Could not search students.');
      } finally {
        if (requestRef.current === requestId) setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, selected]);

  if (selected) {
    return (
      <div className="space-y-1.5">
        <span className="block text-xs font-semibold text-charcoal-800">{label}</span>
        <div className="flex items-start justify-between gap-3 rounded-lg border border-forest-200 bg-sage-50 p-3">
          <div className="flex items-start gap-2.5">
            <UserCheck size={18} className="mt-0.5 shrink-0 text-forest-700" />
            <div>
              <p className="text-sm font-bold text-charcoal-900">{studentName(selected)}</p>
              <p className="text-[11px] font-medium text-warm-600">
                {selected.studentNumber} · {studentClass(selected)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onSelect(null);
              setQuery('');
              setResults([]);
            }}
            className="rounded-md p-1.5 text-warm-500 transition-colors hover:bg-card hover:text-charcoal-900"
            aria-label="Change selected student"
          >
            <X size={15} />
          </button>
        </div>
        {error && <p className="text-[11px] font-semibold text-danger-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        label={label}
        type="search"
        placeholder="Start typing a name or student number…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        leftIcon={<Search size={16} />}
        helperText={helperText}
        error={error}
        autoComplete="off"
      />
      {searching && (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-warm-500">
          <Loader2 size={12} className="animate-spin" /> Searching students…
        </p>
      )}
      {searchError && (
        <p role="alert" className="text-[11px] font-semibold text-danger-600">
          {searchError}
        </p>
      )}
      {!searching && query.trim().length >= 2 && results.length === 0 && !searchError && (
        <p className="rounded-lg bg-warm-50 p-2.5 text-[11px] font-medium text-warm-600">
          No student found for “{query.trim()}”. Check the spelling or student number.
        </p>
      )}
      {results.length > 0 && (
        <ul className="max-h-56 divide-y divide-warm-100 overflow-y-auto rounded-lg border border-warm-200 bg-card">
          {results.map((student) => (
            <li key={student.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(student);
                  setResults([]);
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-sage-50 focus-visible:bg-sage-50 focus-visible:outline-none"
              >
                <span>
                  <span className="block text-sm font-semibold text-charcoal-900">
                    {studentName(student)}
                  </span>
                  <span className="block text-[11px] font-medium text-warm-500">
                    {student.studentNumber} · {studentClass(student)}
                  </span>
                </span>
                <span className="text-[11px] font-bold uppercase text-forest-700">Select</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
