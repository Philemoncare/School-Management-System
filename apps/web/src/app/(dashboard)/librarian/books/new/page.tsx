'use client';

import { showFeedback } from '@/components/layout/global-feedback';
import { Select } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  ChevronLeft,
  Loader2,
  Book,
  AlertCircle,
  CheckCircle,
  Globe,
  Hash,
  Plus,
} from 'lucide-react';

export default function NewBookPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [lookupModal, setLookupModal] = useState<'author' | 'publisher' | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    isbn: '',
    edition: '',
    publicationYear: String(new Date().getFullYear()),
    language: 'English',
    description: '',
    categoryId: '',
    publisherId: '',
    authorIds: [] as string[],
  });

  useEffect(() => {
    loadOptions();
  }, []);

  async function loadOptions() {
    setLoading(true);
    setLoadError('');
    try {
      const [catData, authData, pubData] = await Promise.all([
        apiFetch('/library/categories'),
        apiFetch('/library/authors'),
        apiFetch('/library/publishers'),
      ]);
      setCategories(Array.isArray(catData) ? catData : []);
      setAuthors(Array.isArray(authData) ? authData : []);
      setPublishers(Array.isArray(pubData) ? pubData : []);
    } catch (err: any) {
      setLoadError(err?.message || 'Could not load the catalog lookups.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!formData.title.trim()) {
      setFormError('Enter the book title.');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Select a category.');
      return;
    }
    const year = Number(formData.publicationYear);
    if (formData.publicationYear && (!Number.isInteger(year) || year < 1000 || year > 3000)) {
      setFormError('Enter a valid four-digit publication year.');
      return;
    }
    setSaving(true);
    setFormError('');
    try {
      await apiFetch('/library/books', {
        method: 'POST',
        body: JSON.stringify({
          title: formData.title.trim(),
          subtitle: formData.subtitle.trim() || undefined,
          isbn: formData.isbn.trim() || undefined,
          edition: formData.edition.trim() || undefined,
          publicationYear: formData.publicationYear ? year : undefined,
          language: formData.language.trim() || undefined,
          description: formData.description.trim() || undefined,
          categoryId: formData.categoryId,
          publisherId: formData.publisherId || undefined,
          authorIds: formData.authorIds,
        }),
      });
      showFeedback('SUCCESS', 'Book title added to the catalogue.');
      router.push('/librarian/books');
    } catch (err: any) {
      setFormError(err?.message || 'Could not create the book title.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 p-20 text-sm font-medium text-warm-500">
        <Loader2 className="h-5 w-5 animate-spin text-forest-700" /> Loading catalogue options…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Go back"
          className="rounded-2xl border border-warm-200 bg-card p-2.5 text-warm-500 shadow-sm transition-colors hover:bg-ivory-50"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-charcoal-900 sm:text-3xl">
            New title
          </h1>
          <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-warm-500">
            Create a bibliographic record in the library catalogue
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

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="space-y-6 rounded-xl border border-warm-200 bg-card p-5 shadow-sm sm:p-8">
            {formError && (
              <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
                {formError}
              </p>
            )}

            <InputGroup
              label="Book title"
              value={formData.title}
              onChange={(v) => setFormData({ ...formData, title: v })}
              placeholder="e.g. Introduction to Algorithms"
              icon={<Book size={16} />}
            />
            <InputGroup
              label="Subtitle (optional)"
              value={formData.subtitle}
              onChange={(v) => setFormData({ ...formData, subtitle: v })}
              placeholder="e.g. A comprehensive guide"
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <InputGroup
                label="ISBN"
                value={formData.isbn}
                onChange={(v) => setFormData({ ...formData, isbn: v })}
                placeholder="978-0…"
                icon={<Hash size={16} />}
              />
              <div>
                <label className="mb-3 block px-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                  Category *
                </label>
                <Select
                  required
                  className="w-full rounded-2xl border-none bg-ivory-50 px-5 py-3.5 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                >
                  <option value="">Select category…</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="border-t border-ivory-50 pt-6">
              <label className="mb-5 block px-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                Bibliographic details
              </label>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                <InputGroup
                  label="Edition"
                  value={formData.edition}
                  onChange={(v) => setFormData({ ...formData, edition: v })}
                  placeholder="3rd ed."
                />
                <InputGroup
                  label="Year"
                  value={formData.publicationYear}
                  onChange={(v) => setFormData({ ...formData, publicationYear: v })}
                  type="number"
                />
                <InputGroup
                  label="Language"
                  value={formData.language}
                  onChange={(v) => setFormData({ ...formData, language: v })}
                  icon={<Globe size={16} />}
                />
              </div>
            </div>

            <div className="border-t border-ivory-50 pt-6">
              <label className="mb-3 block px-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
                Description / abstract
              </label>
              <textarea
                rows={4}
                className="w-full rounded-2xl border-none bg-ivory-50 px-6 py-4 text-sm font-bold text-charcoal-900 focus:ring-2 focus:ring-forest-700"
                placeholder="Brief summary of the book content…"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-charcoal-900 p-6 text-white shadow-sm sm:p-8">
            <h3 className="mb-6 text-lg font-semibold tracking-tight">Relationships</h3>
            <div className="space-y-6">
              <div>
                <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                  Authors
                </label>
                {authors.length === 0 ? (
                  <p className="rounded-xl border border-white/10 p-3 text-[11px] font-semibold text-warm-400">
                    No authors yet. Add one below.
                  </p>
                ) : (
                  <div className="custom-scrollbar max-h-52 space-y-2 overflow-y-auto pr-2">
                    {authors.map((a) => (
                      <label
                        key={a.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/5 bg-card/5 p-3 transition-colors hover:bg-card/10"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-white/10 bg-transparent text-forest-700"
                          checked={formData.authorIds.includes(a.id)}
                          onChange={(e) => {
                            const ids = e.target.checked
                              ? [...formData.authorIds, a.id]
                              : formData.authorIds.filter((id) => id !== a.id);
                            setFormData({ ...formData, authorIds: ids });
                          }}
                        />
                        <span className="text-xs font-bold">{a.name}</span>
                      </label>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setLookupModal('author')}
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sage-400 hover:text-sage-300"
                >
                  <Plus size={12} /> New author
                </button>
              </div>

              <div>
                <label className="mb-3 block text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                  Publisher
                </label>
                <Select
                  className="w-full rounded-xl border border-white/10 bg-card/5 px-4 py-3 text-xs font-bold text-white focus:ring-2 focus:ring-forest-700"
                  value={formData.publisherId}
                  onChange={(e) => setFormData({ ...formData, publisherId: e.target.value })}
                >
                  <option value="" className="bg-charcoal-900 text-white">
                    No publisher
                  </option>
                  {publishers.map((p) => (
                    <option key={p.id} value={p.id} className="bg-charcoal-900 text-white">
                      {p.name}
                    </option>
                  ))}
                </Select>
                <button
                  type="button"
                  onClick={() => setLookupModal('publisher')}
                  className="mt-4 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-sage-400 hover:text-sage-300"
                >
                  <Plus size={12} /> New publisher
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-forest-700 p-5 text-sm font-semibold uppercase tracking-wide text-white shadow-sm transition-all hover:bg-forest-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
            {saving ? 'Saving…' : 'Create title'}
          </button>
        </div>
      </form>

      {lookupModal && (
        <LookupModal
          kind={lookupModal}
          onClose={() => setLookupModal(null)}
          onCreated={(created) => {
            if (lookupModal === 'author') {
              setAuthors((current) =>
                [...current, created].sort((a, b) => String(a.name).localeCompare(String(b.name))),
              );
              setFormData((current) => ({
                ...current,
                authorIds: [...current.authorIds, created.id],
              }));
            } else {
              setPublishers((current) =>
                [...current, created].sort((a, b) => String(a.name).localeCompare(String(b.name))),
              );
              setFormData((current) => ({ ...current, publisherId: created.id }));
            }
            setLookupModal(null);
          }}
        />
      )}
    </div>
  );
}

function LookupModal({
  kind,
  onClose,
  onCreated,
}: {
  kind: 'author' | 'publisher';
  onClose: () => void;
  onCreated: (record: any) => void;
}) {
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const copy =
    kind === 'author'
      ? { title: 'New author', detailLabel: 'Biography (optional)', endpoint: '/library/authors', detailKey: 'biography' }
      : { title: 'New publisher', detailLabel: 'Website (optional)', endpoint: '/library/publishers', detailKey: 'website' };

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setError('Enter a name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const created = await apiFetch(copy.endpoint, {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          ...(detail.trim() ? { [copy.detailKey]: detail.trim() } : {}),
        }),
      });
      showFeedback('SUCCESS', `${copy.title} created.`);
      onCreated(created);
    } catch (err: any) {
      setError(err?.message || 'Could not save this record.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      title={copy.title}
      footerActions={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="lookup-form" isLoading={saving}>
            Save
          </Button>
        </>
      }
    >
      <form id="lookup-form" onSubmit={submit} className="space-y-4">
        {error && (
          <p role="alert" className="rounded-lg bg-danger-50 p-3 text-xs font-semibold text-danger-700">
            {error}
          </p>
        )}
        <InputGroup label="Name *" value={name} onChange={setName} placeholder="Enter name" />
        <InputGroup label={copy.detailLabel} value={detail} onChange={setDetail} />
      </form>
    </Modal>
  );
}

function InputGroup({
  label,
  value,
  onChange,
  placeholder,
  icon,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-3 block px-1 text-[11px] font-semibold uppercase tracking-wide text-warm-400">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-warm-400">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          className={`w-full rounded-2xl border-none bg-ivory-50 ${
            icon ? 'pl-11' : 'px-6'
          } py-3.5 pr-4 text-sm font-bold text-charcoal-900 transition-all focus:ring-2 focus:ring-forest-700`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}
