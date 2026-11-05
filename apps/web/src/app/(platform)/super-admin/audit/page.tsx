'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FileText,
  Filter,
  Loader2,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';

export default function SuperAdminAudit() {
  const [data, setData] = useState<any>({ items: [], total: 0 });
  const [filters, setFilters] = useState<any>({ actions: [], modules: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [module, setModule] = useState('');
  const [action, setAction] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const take = 50;

  useEffect(() => {
    apiFetch('/super-admin/audit/filters')
      .then(setFilters)
      .catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    loadLogs();
  }, [debouncedSearch, module, action, from, to, page]);

  function queryString(extra: Record<string, string> = {}) {
    return new URLSearchParams({
      skip: String((page - 1) * take),
      take: String(take),
      ...(debouncedSearch && { search: debouncedSearch }),
      ...(module && { module }),
      ...(action && { action }),
      ...(from && { from }),
      ...(to && { to }),
      ...extra,
    }).toString();
  }

  async function loadLogs() {
    setLoading(true);
    setError('');
    try {
      setData(await apiFetch(`/super-admin/audit?${queryString()}`));
    } catch (err: any) {
      setError(err.message || 'Unable to load audit trail');
    } finally {
      setLoading(false);
    }
  }

  async function exportLogs() {
    try {
      const all = await apiFetch(`/super-admin/audit?${queryString({ skip: '0', take: '200' })}`);
      const rows = [
        ['Timestamp', 'Actor', 'Actor email', 'Module', 'Action', 'School', 'Resource', 'IP', 'Metadata'],
        ...all.items.map((log: any) => [
          new Date(log.createdAt).toISOString(),
          log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'SYSTEM',
          log.actor?.email || '',
          log.module,
          log.action,
          log.school?.name || '',
          log.resourceId || '',
          log.ipAddress || '',
          log.metadata ? JSON.stringify(log.metadata) : '',
        ]),
      ];
      const csv = rows.map((row: any[]) => row.map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `schoolma-audit-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Unable to export audit trail');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <ShieldCheck className="text-forest-700" /> Platform Audit Trail
          </h1>
          <p className="text-warm-500 font-medium mt-1">Immutable record of administrative and security events.</p>
        </div>
        <Button variant="outline" onClick={exportLogs} leftIcon={<Download size={18} />}>Export filtered (max 200)</Button>
      </div>

      {error && <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">{error}</div>}

      <div className="bg-card border border-warm-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-warm-100 space-y-4 bg-ivory-50/50">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="flex-1 bg-card border border-warm-200 px-4 py-2.5 rounded-xl flex items-center shadow-sm">
              <Search size={18} className="text-warm-400 mr-3 shrink-0" />
              <input
                type="text"
                placeholder="Search actor, action, module or resource..."
                className="bg-transparent border-none w-full focus:ring-0 text-sm font-bold outline-none"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              />
            </div>
            <Button variant="outline" onClick={() => setShowFilters((value) => !value)} leftIcon={<Filter size={16} />}>Filters</Button>
          </div>
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 rounded-xl border border-warm-200 bg-card p-4">
              <Select label="Module" value={module} onChange={(e) => { setModule(e.target.value); setPage(1); }}>
                <option value="">All modules</option>
                {filters.modules?.map((item: any) => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}
              </Select>
              <Select label="Action" value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }}>
                <option value="">All actions</option>
                {filters.actions?.map((item: any) => <option key={item.value} value={item.value}>{item.value} ({item.count})</option>)}
              </Select>
              <Input label="From" type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} />
              <Input label="To" type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} />
              <div className="flex items-end">
                <Button variant="ghost" className="w-full" onClick={() => { setModule(''); setAction(''); setFrom(''); setTo(''); setSearch(''); setPage(1); }}>Clear</Button>
              </div>
            </div>
          )}
        </div>

        <div className="relative overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-card/75">
              <Loader2 className="animate-spin text-forest-700" size={32} />
            </div>
          )}

          <table className="min-w-full divide-y divide-warm-200">
            <thead className="bg-ivory-50">
              <tr>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Timestamp</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Actor</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Context</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Action</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">School</th>
                <th className="px-5 py-3 text-left text-[11px] font-semibold text-warm-400 uppercase">Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warm-100 bg-card">
              {data.items.map((log: any) => (
                <tr key={log.id} className="hover:bg-ivory-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 text-warm-500">
                      <Clock size={13} />
                      <span className="text-[11px] font-bold whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-sage-100 flex items-center justify-center text-[10px] font-semibold text-forest-700 shrink-0">
                        {log.actor?.firstName?.[0] || 'S'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-warm-700 truncate max-w-[150px]">{log.actor ? `${log.actor.firstName} ${log.actor.lastName}` : 'SYSTEM'}</p>
                        <p className="text-[10px] text-warm-400 truncate max-w-[150px]">{log.actor?.email || log.userId || '-'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-semibold px-2 py-0.5 bg-warm-100 text-warm-500 rounded uppercase tracking-tighter">{log.module}</span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-semibold text-charcoal-900" title={log.metadata ? JSON.stringify(log.metadata, null, 2) : undefined}>{log.action}</span>
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold text-warm-600">{log.school?.name || '-'}</td>
                  <td className="px-5 py-3">
                    <span className="text-[10px] font-mono text-warm-400 truncate max-w-[150px] block" title={log.resourceId || ''}>{log.resourceId || '-'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data.items.length === 0 && !loading && (
            <div className="py-20 text-center">
              <FileText className="mx-auto text-warm-200 mb-4" size={64} />
              <p className="text-warm-400 font-bold text-lg uppercase tracking-wide">No audit logs found</p>
            </div>
          )}
        </div>

        <div className="p-4 sm:p-6 bg-ivory-50/50 border-t border-warm-100 flex items-center justify-between">
          <p className="text-xs font-bold text-warm-400 uppercase">Showing {data.items.length} of {data.total}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="p-2 bg-card border border-warm-200 rounded-xl disabled:opacity-30 shadow-sm">
              <ChevronLeft size={18} />
            </button>
            <button onClick={() => setPage((value) => value + 1)} disabled={page * take >= data.total} className="p-2 bg-card border border-warm-200 rounded-xl disabled:opacity-30 shadow-sm">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
