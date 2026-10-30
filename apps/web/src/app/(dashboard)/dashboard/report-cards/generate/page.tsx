'use client';

import { showFeedback } from '@/components/layout/global-feedback';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/input';
import {
  FileText,
  ChevronLeft,
  Loader2,
  CheckCircle,
  Printer,
  Settings2,
  AlertCircle,
  Send,
} from 'lucide-react';
import Link from 'next/link';

type BatchForm = {
  academicYearId: string;
  termId: string;
  classId: string;
};

export default function BatchReportCardGeneration() {
  const [classes, setClasses] = useState<any[]>([]);
  const [years, setYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);
  const [success, setSuccess] = useState<any>(null);
  const [form, setForm] = useState<BatchForm>({
    academicYearId: '',
    termId: '',
    classId: '',
  });

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    setLoading(true);
    setLoadError('');
    try {
      const [classesData, yearsData] = await Promise.all([
        apiFetch('/classes'),
        apiFetch('/academic-years'),
      ]);
      const yearList = Array.isArray(yearsData) ? yearsData : [];
      setClasses(Array.isArray(classesData) ? classesData : []);
      setYears(yearList);
      if (yearList.length > 0) {
        const current = yearList.find((year: any) => year.isCurrent) ?? yearList[0];
        setForm((prev) => ({ ...prev, academicYearId: current.id }));
      }
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load classes and academic years.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!form.academicYearId) {
      setTerms([]);
      return;
    }
    let cancelled = false;
    apiFetch(`/academic-terms/by-year/${form.academicYearId}`)
      .then((data) => {
        if (!cancelled) setTerms(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setTerms([]);
      });
    return () => {
      cancelled = true;
    };
  }, [form.academicYearId]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!form.academicYearId || !form.termId || !form.classId) {
      showFeedback('ERROR', 'Select the academic year, term and class before generating.');
      return;
    }
    setSubmitting(true);
    setSuccess(null);
    setPublishResult(null);
    try {
      const res = await apiFetch('/results/report-cards/generate', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setSuccess(res);
    } catch (err: any) {
      showFeedback(
        'ERROR',
        err?.message || 'Generation failed. Ensure results are published for this class and term.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function openPrintableBatch() {
    if (printing) return;
    setPrinting(true);
    try {
      const params = new URLSearchParams({
        academicYearId: form.academicYearId,
        classId: form.classId,
      });
      if (form.termId) params.set('termId', form.termId);
      const cards = await apiFetch(`/results/report-cards?${params.toString()}`);
      const list = Array.isArray(cards) ? cards : [];
      if (list.length === 0) {
        showFeedback('ERROR', 'No report cards are available to print for this batch.');
        return;
      }
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        showFeedback('ERROR', 'Allow pop-ups to open the printable report card batch.');
        return;
      }
      printWindow.document.write(buildPrintableBatch(list, form));
      printWindow.document.close();
      printWindow.focus();
      printWindow.onload = () => printWindow.print();
      // Fallback for browsers that do not fire onload after document.write.
      setTimeout(() => {
        try {
          printWindow.print();
        } catch {
          /* The user can still print from the opened window. */
        }
      }, 350);
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not load the generated report cards.');
    } finally {
      setPrinting(false);
    }
  }

  async function publishBatch() {
    if (publishing) return;
    setPublishing(true);
    try {
      const res = await apiFetch('/results/report-cards/publish', {
        method: 'PATCH',
        body: JSON.stringify(form),
      });
      setPublishResult(res);
      showFeedback('SUCCESS', res?.message || 'Report cards published.');
    } catch (err: any) {
      showFeedback('ERROR', err?.message || 'Could not publish the generated report cards.');
    } finally {
      setPublishing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading generation parameters…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-start gap-4">
        <Link
          href="/dashboard/results"
          aria-label="Back to results"
          className="rounded-2xl border border-warm-200 bg-card p-2.5 text-warm-400 shadow-sm transition-all hover:text-forest-700"
        >
          <ChevronLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            Batch report cards
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
            Official terminal academic record generation
          </p>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-2xl border border-danger-200 bg-danger-50 p-4 text-xs font-semibold text-danger-700 sm:flex-row sm:items-center sm:justify-between"
        >
          <span className="flex items-center gap-2">
            <AlertCircle size={16} /> {loadError}
          </span>
          <Button variant="outline" size="sm" onClick={loadOptions}>
            Try again
          </Button>
        </div>
      )}

      {!success ? (
        <div className="overflow-hidden rounded-xl border border-warm-200 bg-card shadow-sm">
          <div className="bg-charcoal-900 p-5 text-white sm:p-8">
            <h3 className="mb-2 text-lg font-semibold tracking-tight">Generation parameters</h3>
            <p className="text-xs font-medium uppercase tracking-wide text-warm-400">
              Select a class and academic period to begin bulk processing.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="space-y-8 p-5 sm:p-8 lg:p-10">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Select
                label="Academic year *"
                value={form.academicYearId}
                onChange={(event) =>
                  setForm({ ...form, academicYearId: event.target.value, termId: '' })
                }
                options={[
                  { value: '', label: 'Select year' },
                  ...years.map((year) => ({ value: year.id, label: year.name })),
                ]}
              />
              <Select
                label="Term / semester *"
                value={form.termId}
                disabled={!form.academicYearId || terms.length === 0}
                onChange={(event) => setForm({ ...form, termId: event.target.value })}
                options={[
                  {
                    value: '',
                    label: terms.length ? 'Select term' : 'No terms in this year',
                  },
                  ...terms.map((term) => ({ value: term.id, label: term.name })),
                ]}
              />
              <div className="md:col-span-2">
                <Select
                  label="Target class *"
                  value={form.classId}
                  onChange={(event) => setForm({ ...form, classId: event.target.value })}
                  options={[
                    { value: '', label: 'Choose class' },
                    ...classes.map((clazz) => ({ value: clazz.id, label: clazz.name })),
                  ]}
                />
              </div>
            </div>

            {terms.length === 0 && form.academicYearId && (
              <p className="rounded-xl bg-warning-50 p-3 text-[11px] font-semibold text-warning-800">
                This academic year has no terms yet. Add terms before generating report cards.
              </p>
            )}

            <div className="flex flex-col items-start justify-between gap-5 border-t border-warm-100 pt-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 text-warning-600">
                <Settings2 size={20} className="shrink-0" />
                <p className="max-w-sm text-[11px] font-bold uppercase leading-relaxed tracking-tight">
                  Generation only uses published result snapshots for the selected class and term.
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-forest-700 px-10 py-4 text-xs font-semibold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-forest-800 disabled:opacity-50 sm:w-auto"
              >
                {submitting ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                {submitting ? 'Generating…' : 'Generate batch'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6 rounded-xl border border-warm-200 bg-card p-6 text-center shadow-sm sm:p-10">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl bg-success-50 text-success-600 shadow-inner">
            <CheckCircle size={40} />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-charcoal-900">
              Generation complete
            </h2>
            <p className="mt-2 text-sm font-medium text-warm-500">
              {success.message || 'Report cards generated.'}
            </p>
          </div>

          {publishResult && (
            <p
              role="status"
              className="rounded-xl bg-success-50 p-3 text-xs font-semibold text-success-700"
            >
              {publishResult.message || `${publishResult.published ?? 0} report cards published.`}
            </p>
          )}

          <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
            <Button
              onClick={openPrintableBatch}
              isLoading={printing}
              leftIcon={<Printer size={18} />}
            >
              Open printable batch
            </Button>
            <Button
              variant="outline"
              onClick={publishBatch}
              isLoading={publishing}
              leftIcon={<Send size={18} />}
            >
              Publish to portals
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setSuccess(null);
                setPublishResult(null);
              }}
            >
              Generate another batch
            </Button>
          </div>
          <p className="text-[11px] font-medium leading-relaxed text-warm-400">
            “Open printable batch” opens every generated card in a print-ready window. Use your
            browser’s print dialogue to save the batch as a PDF. Cards stay in GENERATED status until
            you publish them.
          </p>
        </div>
      )}
    </div>
  );
}

function escapeHtml(value: any): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildPrintableBatch(cards: any[], form: BatchForm): string {
  const first = cards[0];
  const heading = `${escapeHtml(first?.class?.name ?? 'Class')} • ${escapeHtml(
    first?.term?.name ?? 'Term',
  )} • ${escapeHtml(first?.academicYear?.name ?? 'Academic year')}`;

  const body = cards
    .map((card) => {
      const snapshots = Array.isArray(card.subjectSnapshots) ? card.subjectSnapshots : [];
      const rows = snapshots
        .map(
          (snapshot: any) => `
            <tr>
              <td>${escapeHtml(snapshot.subject?.name ?? 'Subject')}</td>
              <td>${escapeHtml(snapshot.score ?? '—')}</td>
              <td>${escapeHtml(snapshot.grade ?? '—')}</td>
              <td>${escapeHtml(snapshot.gradePoint ?? '—')}</td>
            </tr>`,
        )
        .join('');

      return `
        <section class="card">
          <header>
            <div>
              <h2>${escapeHtml(card.student?.firstName ?? '')} ${escapeHtml(
                card.student?.lastName ?? '',
              )}</h2>
              <p>Student number: ${escapeHtml(card.student?.studentNumber ?? '—')}</p>
            </div>
            <div class="meta">
              <p>Rank: ${escapeHtml(card.rank ?? '—')}</p>
              <p>Status: ${escapeHtml(card.status ?? '—')}</p>
            </div>
          </header>
          <div class="totals">
            <div><span>Average</span><strong>${escapeHtml(card.averagePercentage ?? '—')}%</strong></div>
            <div><span>Overall score</span><strong>${escapeHtml(card.overallScore ?? '—')}</strong></div>
            <div><span>GPA</span><strong>${escapeHtml(card.gpa ?? '—')}</strong></div>
          </div>
          <table>
            <thead>
              <tr><th>Subject</th><th>Score (%)</th><th>Grade</th><th>Grade point</th></tr>
            </thead>
            <tbody>${rows || '<tr><td colspan="4">No subject snapshots recorded.</td></tr>'}</tbody>
          </table>
        </section>`;
    })
    .join('');

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Report card batch</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, 'Times New Roman', serif; margin: 0; padding: 24px; color: #17251d; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  .batch-head { margin-bottom: 20px; border-bottom: 2px solid #14532d; padding-bottom: 12px; }
  .card { border: 1px solid #d6d3c8; border-radius: 10px; padding: 20px; margin-bottom: 24px; page-break-after: always; }
  .card:last-child { page-break-after: auto; }
  header { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #e8e4d8; padding-bottom: 12px; }
  h2 { font-size: 18px; margin: 0 0 4px; }
  p { margin: 0; font-size: 12px; color: #5c5a50; }
  .meta p { text-align: right; }
  .totals { display: flex; gap: 24px; margin: 16px 0; }
  .totals div { background: #f4f1e8; border-radius: 8px; padding: 10px 14px; min-width: 110px; }
  .totals span { display: block; font-size: 10px; text-transform: uppercase; letter-spacing: .06em; color: #6b6a60; }
  .totals strong { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; text-transform: uppercase; font-size: 10px; letter-spacing: .05em; color: #6b6a60; border-bottom: 1px solid #d6d3c8; padding: 8px 6px; }
  td { padding: 8px 6px; border-bottom: 1px solid #efecdf; }
  @media print { body { padding: 0; } .card { border: none; padding: 0; } }
</style>
</head>
<body>
  <div class="batch-head">
    <h1>Report card batch</h1>
    <p>${heading}</p>
  </div>
  ${body}
</body>
</html>`;
}
