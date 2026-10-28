'use client';

import React, { useEffect, useState } from 'react';
import {
  Database,
  Download,
  HardDrive,
  Loader2,
  Play,
  ShieldCheck,
} from 'lucide-react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';

function formatBytes(value: number | null) {
  if (value == null) return 'Pending';
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

const statusStyles: Record<string, string> = {
  PENDING: 'bg-warning-100 text-warning-700',
  RUNNING: 'bg-sage-100 text-forest-700',
  COMPLETED: 'bg-success-100 text-success-700',
  FAILED: 'bg-danger-100 text-danger-700',
  VERIFIED: 'bg-success-100 text-success-700',
};

export default function BackupsPage() {
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    const hasRunning = backups.some(
      (backup) => backup.status === 'PENDING' || backup.status === 'RUNNING',
    );
    if (!hasRunning) return;
    const timer = window.setInterval(() => {
      void load(false);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [backups]);

  async function load(showLoading = true) {
    if (showLoading) setLoading(true);
    try {
      const data = await apiFetch('/super-admin/backups');
      setBackups(data.items || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to load backups');
    } finally {
      if (showLoading) setLoading(false);
    }
  }

  async function startBackup() {
    if (!window.confirm('Start a real PostgreSQL backup now? The archive will be written to the configured backup directory.')) return;
    setStarting(true);
    setError('');
    try {
      await apiFetch('/super-admin/backups', { method: 'POST' });
      await load(false);
    } catch (err: any) {
      setError(err.message || 'Unable to start backup');
    } finally {
      setStarting(false);
    }
  }

  async function verify(backup: any) {
    setBusy(backup.id);
    setError('');
    try {
      await apiFetch(`/super-admin/backups/${backup.id}/verify`, { method: 'POST' });
      await load(false);
    } catch (err: any) {
      setError(err.message || 'Unable to verify backup');
    } finally {
      setBusy('');
    }
  }

  const completed = backups.filter((backup) => backup.status === 'COMPLETED');
  const verified = backups.filter((backup) => backup.verificationStatus === 'VERIFIED');
  const totalBytes = completed.reduce(
    (sum, backup) => sum + (backup.sizeBytes || 0),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            <Database className="text-forest-700" /> Platform Backups
          </h1>
          <p className="mt-1 font-medium text-warm-500">
            Real PostgreSQL archives with checksums and `pg_restore` verification evidence.
          </p>
        </div>
        <Button onClick={startBackup} isLoading={starting} leftIcon={<Play size={16} />}>
          Start backup
        </Button>
      </div>

      {error && (
        <div className="rounded-xl border border-danger-200 bg-danger-50 px-4 py-3 text-sm font-semibold text-danger-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Completed backups" value={String(completed.length)} icon={<HardDrive size={18} />} />
        <Stat label="Verified archives" value={String(verified.length)} icon={<ShieldCheck size={18} />} />
        <Stat label="Stored size" value={formatBytes(totalBytes)} icon={<Download size={18} />} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-sm">
        <div className="border-b border-warm-200 px-5 py-4">
          <h2 className="text-base font-semibold text-charcoal-900">Backup history</h2>
          <p className="text-xs font-medium text-warm-500">
            Backups are stored outside the web root. Verification runs `pg_restore --list` against the archive.
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center">
            <Loader2 className="mx-auto animate-spin text-forest-700" size={34} />
          </div>
        ) : backups.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Database className="mx-auto mb-3 text-warm-200" size={56} />
            <p className="text-sm font-semibold text-warm-500">No backups have been created yet.</p>
            <p className="mt-1 text-xs text-warm-400">
              Start a backup to produce verifiable recovery evidence.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-warm-200">
              <thead className="bg-ivory-50">
                <tr>
                  {['Archive', 'Status', 'Size', 'Verification', 'Checksum', 'Created', 'Actions'].map((label) => (
                    <th key={label} className="px-5 py-3 text-left text-[11px] font-semibold uppercase text-warm-400">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100">
                {backups.map((backup) => (
                  <tr key={backup.id} className="hover:bg-ivory-50">
                    <td className="px-5 py-4">
                      <p className="max-w-[260px] truncate text-sm font-semibold text-charcoal-900">{backup.filename}</p>
                      <p className="text-[11px] font-medium text-warm-400">{backup.databaseName}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[backup.status] || statusStyles.PENDING}`}>
                        {backup.status}
                      </span>
                      {backup.errorMessage && (
                        <p className="mt-1 max-w-[220px] truncate text-[11px] font-semibold text-danger-600" title={backup.errorMessage}>
                          {backup.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-sm font-semibold text-warm-600">{formatBytes(backup.sizeBytes)}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[backup.verificationStatus] || statusStyles.PENDING}`}>
                        {backup.verificationStatus}
                      </span>
                      {backup.verificationMessage && (
                        <p className="mt-1 max-w-[220px] truncate text-[11px] font-medium text-warm-400" title={backup.verificationMessage}>
                          {backup.verificationMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="block max-w-[120px] truncate font-mono text-[11px] text-warm-500" title={backup.checksumSha256 || ''}>
                        {backup.checksumSha256 || '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs font-semibold text-warm-500">
                      {new Date(backup.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      {backup.status === 'COMPLETED' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verify(backup)}
                          isLoading={busy === backup.id}
                          leftIcon={<ShieldCheck size={14} />}
                        >
                          Verify
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-warm-200 bg-ivory-50 p-5">
        <p className="text-sm font-semibold text-charcoal-900">Restore boundary</p>
        <p className="mt-1 text-sm leading-relaxed text-warm-600">
          No restore button is exposed here. A verified archive is recovery evidence, but restoring over a live tenant database requires a planned maintenance window and an explicit, audited operator procedure.
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-warm-200 bg-card p-5 shadow-sm">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-forest-700">
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-warm-400">{label}</p>
        <p className="text-xl font-semibold text-charcoal-900">{value}</p>
      </div>
    </div>
  );
}
