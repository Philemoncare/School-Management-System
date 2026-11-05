'use client';
import { showFeedback } from '@/components/layout/global-feedback';

import React, { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  SettingsError,
  SettingsLoading,
  SettingsNotice,
  SettingsPageHeader,
  SettingsSection,
  useSettingsAccess,
} from '@/components/settings/settings-ui';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';

/**
 * Numbering & sequence rules.
 *
 * Owns the `NumberingRule` records exposed by `/settings/numbering/*`.
 * The sequence counter (`currentValue`) is advanced only by the API when an
 * identifier is issued, so it is displayed here read-only.
 */

const ENTITIES = [
  { key: 'STUDENT', label: 'Student Number', description: 'Issued when a student is admitted.' },
  { key: 'ADMISSION_APPLICATION', label: 'Admission Application', description: 'Issued when an application is created.' },
  { key: 'STAFF', label: 'Staff Employee ID', description: 'Issued when a staff member is registered.' },
  { key: 'INVOICE', label: 'Invoice Number', description: 'Issued when an invoice is generated.' },
  { key: 'PAYMENT', label: 'Payment Reference', description: 'Issued when a payment is recorded.' },
  { key: 'RECEIPT', label: 'Receipt Number', description: 'Issued when a receipt is printed.' },
];

const PADDING_OPTIONS = ['4', '5', '6', '8'];

type RuleForm = { prefix: string; padding: string; includeYear: boolean };

const DEFAULT_RULE: RuleForm = { prefix: '', padding: '6', includeYear: true };

function toForm(stored: any): RuleForm {
  return {
    prefix: stored?.prefix ?? '',
    padding: String(stored?.padding ?? 6),
    includeYear: stored?.includeYear ?? true,
  };
}

export default function NumberingSettings() {
  const { canManage } = useSettingsAccess(['SCHOOL_ADMIN', 'ADMIN']);

  const [forms, setForms] = useState<Record<string, RuleForm>>({});
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; key: string; message: string } | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const rules = await apiFetch('/settings/numbering/rules');
      const nextForms: Record<string, RuleForm> = {};
      const nextCounters: Record<string, number> = {};
      for (const { key } of ENTITIES) {
        nextForms[key] = toForm(rules?.[key]);
        nextCounters[key] = Number(rules?.[key]?.currentValue ?? 0);
      }
      setForms(nextForms);
      setCounters(nextCounters);
    } catch (err: any) {
      setError(err?.message || 'Unable to load numbering rules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const updateForm = (key: string, patch: Partial<RuleForm>) => {
    setForms((prev) => ({ ...prev, [key]: { ...DEFAULT_RULE, ...prev[key], ...patch } }));
  };

  const handleSave = async (entity: string) => {
    const form = { ...DEFAULT_RULE, ...forms[entity] };
    if (!form.prefix.trim()) {
      setNotice({ kind: 'error', key: entity, message: `${entity} requires a prefix.` });
      return;
    }
    setSavingKey(entity);
    setNotice(null);
    try {
      // Only DTO-declared fields are accepted; currentValue is owned by the API.
      const saved = await apiFetch(`/settings/numbering/${entity}`, {
        method: 'PUT',
        body: JSON.stringify({
          prefix: form.prefix.trim(),
          padding: Number(form.padding),
          includeYear: form.includeYear,
        }),
      });
      setCounters((prev) => ({ ...prev, [entity]: Number(saved?.currentValue ?? prev[entity] ?? 0) }));
      setForms((prev) => ({ ...prev, [entity]: toForm(saved) }));
      setNotice({ kind: 'success', key: entity, message: `${entity} numbering rule updated.` });
      showFeedback('SUCCESS', 'Numbering rule saved');
    } catch (err: any) {
      setNotice({
        kind: 'error',
        key: entity,
        message: err?.message || `Unable to save the ${entity} numbering rule.`,
      });
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <SettingsLoading label="Loading numbering rules…" />;

  if (error) {
    return <SettingsError title="Unable to load numbering rules" message={error} onRetry={load} />;
  }

  const preview = (form: RuleForm) => {
    const parts = [form.prefix.trim() || 'PREFIX'];
    if (form.includeYear) parts.push(String(new Date().getFullYear()));
    parts.push('1'.padStart(Number(form.padding), '0'));
    return parts.join('-');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <SettingsPageHeader
        title="Numbering & Sequences"
        description="Define how identifiers are generated across the system."
      />

      {!canManage && (
        <div className="rounded-xl border border-warm-200 bg-ivory-50 p-4 text-sm font-medium text-warm-600">
          You have view-only access. Numbering rules can be changed by a school administrator.
        </div>
      )}

      {notice && (
        <SettingsNotice kind={notice.kind} message={notice.message} />
      )}

      <div className="space-y-6">
        {ENTITIES.map((entity) => {
          const form = { ...DEFAULT_RULE, ...forms[entity.key] };
          return (
            <SettingsSection
              key={entity.key}
              title={entity.label}
              description={entity.description}
              actions={
                <Badge variant="neutral" className="text-[10px]">
                  Issued so far: {counters[entity.key] ?? 0}
                </Badge>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  label="Prefix"
                  placeholder="e.g. STU"
                  value={form.prefix}
                  disabled={!canManage}
                  onChange={(e) => updateForm(entity.key, { prefix: e.target.value })}
                />
                <Select
                  label="Padding"
                  value={form.padding}
                  disabled={!canManage}
                  options={PADDING_OPTIONS.map((p) => ({ value: p, label: `${p} digits` }))}
                  onChange={(e) => updateForm(entity.key, { padding: e.target.value })}
                />
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-warm-300 text-forest-700 focus:ring-forest-700"
                      checked={form.includeYear}
                      disabled={!canManage}
                      onChange={(e) => updateForm(entity.key, { includeYear: e.target.checked })}
                    />
                    <span className="text-xs font-semibold text-warm-600 uppercase tracking-wide">
                      Include year
                    </span>
                  </label>
                </div>
              </div>

              <div className="pt-1">
                <p className="text-[11px] font-bold text-warm-400 uppercase">
                  Next preview:{' '}
                  <span className="text-forest-700 ml-2 font-mono normal-case">{preview(form)}</span>
                </p>
              </div>

              {canManage && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Save size={14} />}
                    isLoading={savingKey === entity.key}
                    onClick={() => handleSave(entity.key)}
                  >
                    Update Rule
                  </Button>
                </div>
              )}
            </SettingsSection>
          );
        })}
      </div>
    </div>
  );
}
