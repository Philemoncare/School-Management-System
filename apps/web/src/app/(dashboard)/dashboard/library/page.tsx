'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Book as BookIcon,
  Search,
  Plus,
  ArrowLeftRight,
  History,
  AlertCircle,
  ChevronRight,
  Loader2,
  BookMarked,
  Layers,
  Users,
  Bookmark,
  DollarSign,
  MapPin,
  PenTool,
  Building,
  RefreshCw,
  CheckCircle,
  XCircle,
  Calendar,
  Info
} from 'lucide-react';

export default function LibraryManagementPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'catalog' | 'circulation' | 'reservations' | 'fines' | 'members' | 'setup'>('overview');

  // Data States
  const [metrics, setMetrics] = useState<any>(null);
  const [books, setBooks] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  // Lookup States
  const [categories, setCategories] = useState<any[]>([]);
  const [authors, setAuthors] = useState<any[]>([]);
  const [publishers, setPublishers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form States
  const [bookForm, setBookForm] = useState({
    title: '', subtitle: '', isbn: '', edition: '', publicationYear: '',
    language: 'English', description: '', categoryId: '', publisherId: '', authorIds: [] as string[]
  });
  const [copyForm, setCopyForm] = useState({
    bookId: '', accessionNumber: '', barcode: '', condition: 'NEW', locationId: '', shelf: ''
  });
  const [issueForm, setIssueForm] = useState({
    membershipId: '', bookCopyId: '', dueDate: ''
  });
  const [categoryForm, setCategoryForm] = useState({ name: '', code: '', description: '' });
  const [authorForm, setAuthorForm] = useState({ name: '', biography: '' });
  const [publisherForm, setPublisherForm] = useState({ name: '', website: '' });
  const [locationForm, setLocationForm] = useState({ name: '', description: '' });
  const [memberForm, setMemberForm] = useState({ userId: '' });

  // Filtering / Searching states
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadAllData();
  }, [activeTab]);

  async function loadAllData() {
    setLoading(true);
    setErrorMsg('');
    try {
      if (activeTab === 'overview') {
        const res = await apiFetch('/library/dashboard');
        setMetrics(res.metrics);
        // Load recent loans
        const recentLoans = await apiFetch('/library/loans');
        setLoans(recentLoans);
      } else if (activeTab === 'catalog') {
        const res = await apiFetch('/library/books');
        setBooks(res);
        // Pre-fetch lookups for creation forms
        const [cats, auths, pubs, locs] = await Promise.all([
          apiFetch('/library/categories'),
          apiFetch('/library/authors'),
          apiFetch('/library/publishers'),
          apiFetch('/library/locations')
        ]);
        setCategories(cats);
        setAuthors(auths);
        setPublishers(pubs);
        setLocations(locs);
      } else if (activeTab === 'circulation') {
        const activeLoans = await apiFetch('/library/loans');
        setLoans(activeLoans);
        // Load members & books for reference if needed
        const [mems, bks] = await Promise.all([
          apiFetch('/library/members'),
          apiFetch('/library/books')
        ]);
        setMembers(mems);
        setBooks(bks);
      } else if (activeTab === 'reservations') {
        const res = await apiFetch('/library/reservations');
        setReservations(res);
      } else if (activeTab === 'fines') {
        const res = await apiFetch('/library/fines');
        setFines(res);
      } else if (activeTab === 'members') {
        const res = await apiFetch('/library/members');
        setMembers(res);
      } else if (activeTab === 'setup') {
        const [cats, auths, pubs, locs] = await Promise.all([
          apiFetch('/library/categories'),
          apiFetch('/library/authors'),
          apiFetch('/library/publishers'),
          apiFetch('/library/locations')
        ]);
        setCategories(cats);
        setAuthors(auths);
        setPublishers(pubs);
        setLocations(locs);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to load library resources from database.');
    } finally {
      setLoading(false);
    }
  }

  // Submit Handlers
  async function handleCreateBook(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...bookForm,
        publicationYear: bookForm.publicationYear ? parseInt(bookForm.publicationYear) : undefined,
        categoryId: bookForm.categoryId || undefined,
        publisherId: bookForm.publisherId || undefined,
      };
      await apiFetch('/library/books', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSuccessMsg('Book title successfully registered in the catalog.');
      setBookForm({
        title: '', subtitle: '', isbn: '', edition: '', publicationYear: '',
        language: 'English', description: '', categoryId: '', publisherId: '', authorIds: []
      });
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create book record.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateCopy(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...copyForm,
        locationId: copyForm.locationId || undefined,
      };
      await apiFetch('/library/copies', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSuccessMsg(`Physical copy ${copyForm.accessionNumber} successfully added.`);
      setCopyForm({ bookId: '', accessionNumber: '', barcode: '', condition: 'NEW', locationId: '', shelf: '' });
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add book copy.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleIssueBook(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const payload = {
        ...issueForm,
        dueDate: issueForm.dueDate ? new Date(issueForm.dueDate) : undefined
      };
      await apiFetch('/library/loans/issue', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setSuccessMsg('Book successfully issued to member.');
      setIssueForm({ membershipId: '', bookCopyId: '', dueDate: '' });
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to issue book copy.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReturnBook(loanId: string) {
    if (!confirm('Are you sure you want to mark this book as returned?')) return;
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiFetch(`/library/loans/${loanId}/return`, {
        method: 'POST',
        body: JSON.stringify({ notes: 'Returned at counter' })
      });
      setSuccessMsg('Book returned and copy availability updated.');
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to process return.');
    }
  }

  async function handleRenewBook(loanId: string) {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiFetch(`/library/loans/${loanId}/renew`, {
        method: 'POST'
      });
      setSuccessMsg('Loan extended successfully according to school library policy.');
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to renew loan.');
    }
  }

  async function handleCancelReservation(resId: string) {
    if (!confirm('Cancel this reservation hold?')) return;
    try {
      await apiFetch(`/library/reservations/${resId}/cancel`, { method: 'POST' });
      setSuccessMsg('Reservation canceled successfully.');
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to cancel reservation.');
    }
  }

  async function handleRegisterMember(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiFetch('/library/members', {
        method: 'POST',
        body: JSON.stringify(memberForm)
      });
      setSuccessMsg('Library member card registered successfully.');
      setMemberForm({ userId: '' });
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register library membership.');
    } finally {
      setSubmitting(false);
    }
  }

  // Setup Form Handlers
  async function createLookup(type: 'category' | 'author' | 'publisher' | 'location', body: any, clearFn: () => void) {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await apiFetch(`/library/${type === 'category' ? 'categories' : type + 's'}`, {
        method: 'POST',
        body: JSON.stringify(body)
      });
      setSuccessMsg(`New library ${type} created successfully.`);
      clearFn();
      loadAllData();
    } catch (err: any) {
      setErrorMsg(err.message || `Failed to create ${type}.`);
    }
  }

  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.isbn?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 lg:p-8 space-y-8 bg-ivory-50/30 min-h-screen">
      {/* Upper banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-warm-200 pb-6">
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            <BookMarked size={36} className="text-forest-700" />
            Librarian Command Center
          </h1>
          <p className="text-warm-500 mt-1 font-medium text-sm">
            Institutional Catalog Management, Circulation Control, Reserves & Fine Audits.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['overview', 'catalog', 'circulation', 'reservations', 'fines', 'members', 'setup'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-charcoal-900 text-white shadow-lg'
                  : 'bg-card border border-warm-200 text-warm-600 hover:bg-ivory-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Global alert messages */}
      {errorMsg && (
        <div className="p-4 bg-danger-50 border border-danger-200 rounded-2xl flex items-center gap-3 text-danger-700 text-xs font-bold animate-fadeIn">
          <AlertCircle size={18} className="shrink-0" />
          <p>{errorMsg}</p>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-success-50 border border-success-200 rounded-2xl flex items-center gap-3 text-success-700 text-xs font-bold animate-fadeIn">
          <CheckCircle size={18} className="shrink-0" />
          <p>{successMsg}</p>
        </div>
      )}

      {/* Main Tab views */}
      {loading ? (
        <div className="py-20 text-center">
          <Loader2 className="animate-spin mx-auto text-forest-700" size={48} />
          <p className="text-warm-400 text-xs font-bold uppercase tracking-wide mt-4">Connecting to PostgreSQL database...</p>
        </div>
      ) : (
        <>
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
                <MiniKpiCard title="Total Books" value={metrics?.totalBooks || 0} icon={<BookIcon className="text-forest-700" size={16}/>} color="bg-sage-50" />
                <MiniKpiCard title="Total Copies" value={metrics?.totalCopies || 0} icon={<Layers className="text-forest-600" size={16}/>} color="bg-sage-50" />
                <MiniKpiCard title="Available Now" value={metrics?.availableCopies || 0} icon={<CheckCircle className="text-success-600" size={16}/>} color="bg-success-50" />
                <MiniKpiCard title="On Loan" value={metrics?.borrowedCopies || 0} icon={<ArrowLeftRight className="text-warning-600" size={16}/>} color="bg-warning-50" />
                <MiniKpiCard title="Overdue Active" value={metrics?.overdueLoans || 0} icon={<AlertCircle className="text-danger-600" size={16}/>} color="bg-danger-50" />
                <MiniKpiCard title="Active Members" value={metrics?.activeMembers || 0} icon={<Users className="text-terracotta-600" size={16}/>} color="bg-terracotta-50" />
              </div>

              {/* Quick Activities */}
              <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                  <History size={16} className="text-warm-400" /> Recent Borrowing Activities
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-warm-100 text-warm-400 uppercase tracking-wide font-semibold text-[11px]">
                        <th className="pb-3">Book Title</th>
                        <th className="pb-3">Member</th>
                        <th className="pb-3">Checkout Date</th>
                        <th className="pb-3">Due Date</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                      {loans.slice(0, 10).map((loan) => (
                        <tr key={loan.id} className="hover:bg-ivory-50/50">
                          <td className="py-3.5 font-bold text-charcoal-900">{loan.bookCopy?.book?.title}</td>
                          <td className="py-3.5">{loan.membership?.user?.firstName} {loan.membership?.user?.lastName} <span className="text-[11px] text-warm-400 block font-mono">{loan.membership?.membershipNumber}</span></td>
                          <td className="py-3.5 text-warm-500">{new Date(loan.loanDate).toLocaleDateString()}</td>
                          <td className="py-3.5 text-warm-500">{new Date(loan.dueDate).toLocaleDateString()}</td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                              loan.status === 'RETURNED' ? 'bg-success-50 text-success-700' :
                              loan.status === 'OVERDUE' || new Date(loan.dueDate) < new Date() ? 'bg-danger-50 text-danger-700' : 'bg-sage-50 text-forest-800'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            {loan.status === 'ACTIVE' && (
                              <div className="flex justify-end gap-2">
                                <button onClick={() => handleRenewBook(loan.id)} className="px-2 py-1 bg-warm-100 hover:bg-warm-200 text-charcoal-800 rounded font-semibold text-[11px] uppercase">Renew</button>
                                <button onClick={() => handleReturnBook(loan.id)} className="px-2 py-1 bg-success-600 hover:bg-success-700 text-white rounded font-semibold text-[11px] uppercase">Return</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {loans.length === 0 && (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-warm-400 font-bold">No recent borrowing found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Left columns: Title list & copy adding */}
              <div className="xl:col-span-2 space-y-6">
                <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-center gap-4 mb-6">
                    <div className="flex-1 bg-ivory-50 px-4 py-2 rounded-xl flex items-center border border-warm-200">
                      <Search size={16} className="text-warm-400 mr-2" />
                      <input
                        type="text"
                        placeholder="Search catalog titles by keyword or ISBN..."
                        className="bg-transparent text-xs w-full focus:outline-none font-bold"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-xs text-left">
                      <thead>
                        <tr className="border-b border-warm-100 text-warm-400 uppercase tracking-wide font-semibold text-[11px]">
                          <th className="pb-3">Title Details</th>
                          <th className="pb-3">ISBN / Language</th>
                          <th className="pb-3">Category</th>
                          <th className="pb-3">Copies Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-100 text-warm-700 font-medium">
                        {filteredBooks.map((b) => (
                          <tr key={b.id} className="hover:bg-ivory-50/50">
                            <td className="py-3.5">
                              <p className="font-semibold text-charcoal-900 text-sm">{b.title}</p>
                              {b.subtitle && <p className="text-warm-400 text-[11px] font-bold">{b.subtitle}</p>}
                              <p className="text-[11px] text-warm-500 font-semibold mt-0.5">By {b.authors?.map((a: any) => a.author.name).join(', ') || 'Unknown Author'}</p>
                            </td>
                            <td className="py-3.5">
                              <p className="font-mono text-charcoal-900 font-bold">{b.isbn || '—'}</p>
                              <p className="text-[11px] text-warm-400 uppercase font-semibold">{b.language}</p>
                            </td>
                            <td className="py-3.5">
                              <span className="px-2 py-0.5 bg-warm-100 rounded text-[11px] font-bold text-warm-600">{b.category?.name || 'General'}</span>
                            </td>
                            <td className="py-3.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-charcoal-900 text-sm">{b._count?.copies || b.copies?.length || 0}</span>
                                <button
                                  onClick={() => setCopyForm(prev => ({ ...prev, bookId: b.id }))}
                                  className="p-1 text-forest-700 hover:bg-sage-50 rounded border border-sage-200 flex items-center gap-1 text-[11px] font-semibold uppercase"
                                >
                                  <Plus size={10}/> Add Copy
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {filteredBooks.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-12 text-center text-warm-400 font-bold">No records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Add copy form */}
                {copyForm.bookId && (
                  <div className="bg-card border-2 border-forest-500 rounded-xl p-6 shadow-xs animate-fadeIn">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-forest-800 mb-4 flex items-center gap-2">
                      <Layers size={16} /> Register Physical Copy for Selected Title
                    </h3>
                    <form onSubmit={handleCreateCopy} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Accession Number (Unique Code)</label>
                        <input
                          type="text" required placeholder="e.g. ACC-2024-001"
                          className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                          value={copyForm.accessionNumber}
                          onChange={(e) => setCopyForm({...copyForm, accessionNumber: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Barcode / RF Identifier</label>
                        <input
                          type="text" placeholder="e.g. BARCODE8473"
                          className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                          value={copyForm.barcode}
                          onChange={(e) => setCopyForm({...copyForm, barcode: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Initial Condition</label>
                        <Select
                          className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3"
                          value={copyForm.condition}
                          onChange={(e) => setCopyForm({...copyForm, condition: e.target.value})}
                        >
                          <option value="NEW">NEW</option>
                          <option value="GOOD">GOOD</option>
                          <option value="FAIR">FAIR</option>
                          <option value="POOR">POOR</option>
                          <option value="DAMAGED">DAMAGED</option>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Library Location / Room</label>
                        <Select
                          className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3"
                          value={copyForm.locationId}
                          onChange={(e) => setCopyForm({...copyForm, locationId: e.target.value})}
                        >
                          <option value="">Choose room/section...</option>
                          {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </Select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Shelf Number / Row</label>
                        <input
                          type="text" placeholder="e.g. Shelf B-3"
                          className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                          value={copyForm.shelf}
                          onChange={(e) => setCopyForm({...copyForm, shelf: e.target.value})}
                        />
                      </div>
                      <div className="flex items-end gap-2">
                        <button
                          type="submit" disabled={submitting}
                          className="flex-1 bg-forest-700 text-white rounded-xl p-3 font-semibold text-xs uppercase tracking-wider hover:bg-forest-800 disabled:opacity-50"
                        >
                          {submitting ? 'Saving...' : 'Save Physical Copy'}
                        </button>
                        <button
                          type="button" onClick={() => setCopyForm({...copyForm, bookId: ''})}
                          className="bg-warm-100 hover:bg-warm-200 rounded-xl p-3 text-xs font-bold text-warm-500"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Right column: Create Book Title bibliographic record */}
              <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm h-fit">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                  <Plus size={16} className="text-forest-700" /> Catalog New Bibliographic Title
                </h3>
                <form onSubmit={handleCreateBook} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Book Title *</label>
                    <input
                      type="text" required placeholder="e.g. Advanced Calculus"
                      className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                      value={bookForm.title}
                      onChange={(e) => setBookForm({...bookForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Subtitle</label>
                    <input
                      type="text" placeholder="e.g. Theory & 500 Solved Problems"
                      className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                      value={bookForm.subtitle}
                      onChange={(e) => setBookForm({...bookForm, subtitle: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">ISBN Number</label>
                      <input
                        type="text" placeholder="978-3-16-148410-0"
                        className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                        value={bookForm.isbn}
                        onChange={(e) => setBookForm({...bookForm, isbn: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Edition</label>
                      <input
                        type="text" placeholder="e.g. 4th Edition"
                        className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                        value={bookForm.edition}
                        onChange={(e) => setBookForm({...bookForm, edition: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Publication Year</label>
                      <input
                        type="number" placeholder="2023"
                        className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                        value={bookForm.publicationYear}
                        onChange={(e) => setBookForm({...bookForm, publicationYear: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Language</label>
                      <input
                        type="text" placeholder="English"
                        className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                        value={bookForm.language}
                        onChange={(e) => setBookForm({...bookForm, language: e.target.value})}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Category Lookup</label>
                    <Select
                      className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3"
                      value={bookForm.categoryId}
                      onChange={(e) => setBookForm({...bookForm, categoryId: e.target.value})}
                    >
                      <option value="">Select category...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name} ({c.code})</option>)}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Publisher Lookup</label>
                    <Select
                      className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3"
                      value={bookForm.publisherId}
                      onChange={(e) => setBookForm({...bookForm, publisherId: e.target.value})}
                    >
                      <option value="">Select publisher...</option>
                      {publishers.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Primary Author *</label>
                    <Select
                      required
                      className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3"
                      value={bookForm.authorIds[0] || ''}
                      onChange={(e) => setBookForm({...bookForm, authorIds: e.target.value ? [e.target.value] : []})}
                    >
                      <option value="">Select author...</option>
                      {authors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Brief Abstract / Summary Description</label>
                    <textarea
                      rows={3} placeholder="Provide bibliographic summary or description..."
                      className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3"
                      value={bookForm.description}
                      onChange={(e) => setBookForm({...bookForm, description: e.target.value})}
                    />
                  </div>

                  <button
                    type="submit" disabled={submitting}
                    className="w-full bg-charcoal-900 text-white rounded-xl p-4 font-semibold text-xs uppercase tracking-wider hover:bg-charcoal-950 transition-all disabled:opacity-50"
                  >
                    {submitting ? 'Registering Title...' : 'Register Bibliographic Record'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'circulation' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Counter Issue Form */}
              <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm h-fit">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                  <ArrowLeftRight size={16} className="text-forest-700" /> Live Circulation Checkout Counter
                </h3>
                <form onSubmit={handleIssueBook} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Select Active Member Card *</label>
                    <Select
                      required
                      className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3"
                      value={issueForm.membershipId}
                      onChange={(e) => setIssueForm({...issueForm, membershipId: e.target.value})}
                    >
                      <option value="">Choose library member...</option>
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.membershipNumber} — {m.user?.firstName} {m.user?.lastName}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Select Specific Book Copy Title *</label>
                    <Select
                      required
                      className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3"
                      value={issueForm.bookCopyId}
                      onChange={(e) => setIssueForm({...issueForm, bookCopyId: e.target.value})}
                    >
                      <option value="">Choose physical copy barcode/accession...</option>
                      {books.flatMap(b => b.copies || []).filter((c: any) => c.status === 'AVAILABLE').map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.accessionNumber} [{c.barcode || 'No barcode'}] — {books.find(bk => bk.id === c.bookId)?.title}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Custom Due Date (Optional, defaults to policy days)</label>
                    <input
                      type="date"
                      className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                      value={issueForm.dueDate}
                      onChange={(e) => setIssueForm({...issueForm, dueDate: e.target.value})}
                    />
                  </div>

                  <button
                    type="submit" disabled={submitting}
                    className="w-full bg-forest-700 text-white rounded-xl p-4 font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-md disabled:opacity-50"
                  >
                    {submitting ? 'Validating rules...' : 'Issue Book / Checkout'}
                  </button>
                </form>
              </div>

              {/* Outstanding Loans Table */}
              <div className="xl:col-span-2 bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6">All Tracked Institutional Library Loans</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-warm-100 text-warm-400 uppercase tracking-wide font-semibold text-[11px]">
                        <th className="pb-3">Accession Code / Title</th>
                        <th className="pb-3">Borrower Name</th>
                        <th className="pb-3">Timeline</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                      {loans.map((loan) => (
                        <tr key={loan.id} className="hover:bg-ivory-50/50">
                          <td className="py-3.5">
                            <p className="font-bold text-charcoal-900">{loan.bookCopy?.book?.title || 'Unknown Title'}</p>
                            <p className="text-[11px] text-warm-400 font-mono">Accession: {loan.bookCopy?.accessionNumber}</p>
                          </td>
                          <td className="py-3.5">
                            <p className="font-semibold text-charcoal-800">{loan.membership?.user?.firstName} {loan.membership?.user?.lastName}</p>
                            <p className="text-[11px] text-warm-400 font-mono">{loan.membership?.membershipNumber}</p>
                          </td>
                          <td className="py-3.5">
                            <p className="text-warm-500">Issued: {new Date(loan.loanDate).toLocaleDateString()}</p>
                            <p className="text-danger-500 font-bold">Due: {new Date(loan.dueDate).toLocaleDateString()}</p>
                          </td>
                          <td className="py-3.5">
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase ${
                              loan.status === 'RETURNED' ? 'bg-success-50 text-success-700' :
                              loan.status === 'OVERDUE' || new Date(loan.dueDate) < new Date() ? 'bg-danger-50 text-danger-700 animate-pulse' : 'bg-sage-50 text-forest-800'
                            }`}>
                              {loan.status}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            {(loan.status === 'ACTIVE' || loan.status === 'OVERDUE') && (
                              <div className="flex justify-end gap-1.5">
                                <button onClick={() => handleRenewBook(loan.id)} className="px-2 py-1 bg-warm-100 hover:bg-warm-200 text-charcoal-800 rounded font-semibold text-[11px] uppercase">Extend/Renew</button>
                                <button onClick={() => handleReturnBook(loan.id)} className="px-2 py-1 bg-success-600 hover:bg-success-700 text-white rounded font-semibold text-[11px] uppercase">Accept Return</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                      {loans.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-warm-400 font-bold">No active loan circulation records.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reservations' && (
            <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                <Bookmark size={16} className="text-forest-700" /> Active Reserve Hold Queue
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-warm-100 text-warm-400 uppercase tracking-wide font-semibold text-[11px]">
                      <th className="pb-3">Book Requested</th>
                      <th className="pb-3">Member Name</th>
                      <th className="pb-3">Request Date</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                    {reservations.map((res) => (
                      <tr key={res.id} className="hover:bg-ivory-50/50">
                        <td className="py-3.5 font-bold text-charcoal-900">{res.book?.title}</td>
                        <td className="py-3.5">{res.membership?.user?.firstName} {res.membership?.user?.lastName} ({res.membership?.membershipNumber})</td>
                        <td className="py-3.5 text-warm-500">{new Date(res.requestDate).toLocaleString()}</td>
                        <td className="py-3.5">
                          <span className="px-2 py-0.5 bg-warning-50 text-warning-700 font-semibold rounded-full uppercase text-[11px]">{res.status}</span>
                        </td>
                        <td className="py-3.5 text-right">
                          {res.status === 'PENDING' && (
                            <button onClick={() => handleCancelReservation(res.id)} className="px-2 py-1 bg-danger-50 text-danger-600 hover:bg-danger-100 rounded text-[11px] font-semibold uppercase">Cancel Hold</button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {reservations.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-warm-400 font-bold">No pending library reservations found in database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'fines' && (
            <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                <DollarSign size={16} className="text-danger-600" /> Outstanding Library Penalty Fines Ledgers
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-warm-100 text-warm-400 uppercase tracking-wide font-semibold text-[11px]">
                      <th className="pb-3">Member Number & Name</th>
                      <th className="pb-3">Reason</th>
                      <th className="pb-3">Total Penalty</th>
                      <th className="pb-3">Outstanding Balance</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                    {fines.map((fine) => (
                      <tr key={fine.id} className="hover:bg-ivory-50/50">
                        <td className="py-3.5 font-bold text-charcoal-900">
                          {fine.membership?.user?.firstName} {fine.membership?.user?.lastName}
                          <span className="text-[11px] font-mono text-warm-400 block">{fine.membership?.membershipNumber}</span>
                        </td>
                        <td className="py-3.5 text-warm-600">{fine.reason}</td>
                        <td className="py-3.5 font-semibold text-charcoal-900">GH₵ {parseFloat(fine.amount).toFixed(2)}</td>
                        <td className="py-3.5 font-semibold text-danger-600">GH₵ {parseFloat(fine.balance).toFixed(2)}</td>
                        <td className="py-3.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold uppercase ${
                            fine.status === 'PAID' ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
                          }`}>{fine.status}</span>
                        </td>
                      </tr>
                    ))}
                    {fines.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-warm-400 font-bold">No outstanding library penalty fines recorded.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 bg-card border border-warm-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6">Registered Library Memberships</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-warm-100 text-warm-400 uppercase tracking-wide font-semibold text-[11px]">
                        <th className="pb-3">Membership ID</th>
                        <th className="pb-3">Full Name</th>
                        <th className="pb-3">Email Address</th>
                        <th className="pb-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-100 font-medium text-warm-700">
                      {members.map((m) => (
                        <tr key={m.id} className="hover:bg-ivory-50/50">
                          <td className="py-3.5 font-mono font-semibold text-forest-700">{m.membershipNumber}</td>
                          <td className="py-3.5 font-bold text-charcoal-900">{m.user?.firstName} {m.user?.lastName}</td>
                          <td className="py-3.5 text-warm-500">{m.user?.email}</td>
                          <td className="py-3.5">
                            <span className="px-2 py-0.5 bg-success-50 text-success-700 rounded text-[11px] font-semibold uppercase">{m.status}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Register member card */}
              <div className="bg-card border border-warm-200 rounded-xl p-6 shadow-sm h-fit">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                  <Users size={16} className="text-terracotta-600" /> Provision Library Account
                </h3>
                <form onSubmit={handleRegisterMember} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase text-warm-400 tracking-wider mb-1">Enter Existing School User ID</label>
                    <input
                      type="text" required placeholder="Paste user uuid token..."
                      className="w-full text-xs font-bold border border-warm-200 rounded-xl p-3 focus:ring-2 focus:ring-forest-700/20"
                      value={memberForm.userId}
                      onChange={(e) => setMemberForm({ userId: e.target.value })}
                    />
                    <p className="text-[11px] text-warm-400 font-medium mt-1 leading-normal">
                      Maps any student, teacher or staff membership account directly into the library registry with an autonomous barcode index.
                    </p>
                  </div>
                  <button
                    type="submit" disabled={submitting}
                    className="w-full bg-terracotta-600 text-white font-semibold text-xs uppercase p-3 rounded-xl tracking-wider hover:bg-terracotta-700 disabled:opacity-50"
                  >
                    {submitting ? 'Processing...' : 'Authorize Membership Card'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'setup' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Categories lookups */}
              <div className="bg-card border border-warm-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-charcoal-900 flex items-center gap-1.5">
                  <Layers size={14} className="text-forest-500" /> Book Categories
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  createLookup('category', categoryForm, () => setCategoryForm({ name: '', code: '', description: '' }));
                }} className="space-y-3">
                  <input type="text" placeholder="Category Name" required className="w-full p-2.5 border border-warm-200 rounded-lg text-xs font-bold" value={categoryForm.name} onChange={(e)=>setCategoryForm({...categoryForm, name: e.target.value})} />
                  <input type="text" placeholder="Short Code (e.g. MATH)" required className="w-full p-2.5 border border-warm-200 rounded-lg text-xs font-bold" value={categoryForm.code} onChange={(e)=>setCategoryForm({...categoryForm, code: e.target.value})} />
                  <button type="submit" className="w-full bg-forest-700 text-white py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider">Save Category</button>
                </form>
                <div className="pt-2 max-h-40 overflow-y-auto divide-y divide-ivory-50 text-[11px] font-semibold text-warm-600">
                  {categories.map(c => <div key={c.id} className="py-1.5 flex justify-between"><span>{c.name}</span><span className="font-mono text-warm-400">{c.code}</span></div>)}
                </div>
              </div>

              {/* Authors lookups */}
              <div className="bg-card border border-warm-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-charcoal-900 flex items-center gap-1.5">
                  <PenTool size={14} className="text-forest-500" /> Authors Index
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  createLookup('author', authorForm, () => setAuthorForm({ name: '', biography: '' }));
                }} className="space-y-3">
                  <input type="text" placeholder="Author Full Name" required className="w-full p-2.5 border border-warm-200 rounded-lg text-xs font-bold" value={authorForm.name} onChange={(e)=>setAuthorForm({...authorForm, name: e.target.value})} />
                  <button type="submit" className="w-full bg-forest-600 text-white py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider">Save Author</button>
                </form>
                <div className="pt-2 max-h-40 overflow-y-auto divide-y divide-ivory-50 text-[11px] font-semibold text-warm-600">
                  {authors.map(a => <div key={a.id} className="py-1.5 text-charcoal-800">{a.name}</div>)}
                </div>
              </div>

              {/* Publishers lookups */}
              <div className="bg-card border border-warm-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-charcoal-900 flex items-center gap-1.5">
                  <Building size={14} className="text-warning-500" /> Publishers
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  createLookup('publisher', publisherForm, () => setPublisherForm({ name: '', website: '' }));
                }} className="space-y-3">
                  <input type="text" placeholder="Publisher Name" required className="w-full p-2.5 border border-warm-200 rounded-lg text-xs font-bold" value={publisherForm.name} onChange={(e)=>setPublisherForm({...publisherForm, name: e.target.value})} />
                  <button type="submit" className="w-full bg-warning-600 text-white py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider">Save Publisher</button>
                </form>
                <div className="pt-2 max-h-40 overflow-y-auto divide-y divide-ivory-50 text-[11px] font-semibold text-warm-600">
                  {publishers.map(p => <div key={p.id} className="py-1.5 text-charcoal-800">{p.name}</div>)}
                </div>
              </div>

              {/* Locations lookups */}
              <div className="bg-card border border-warm-200 rounded-xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-charcoal-900 flex items-center gap-1.5">
                  <MapPin size={14} className="text-terracotta-500" /> Rooms / Locations
                </h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  createLookup('location', locationForm, () => setLocationForm({ name: '', description: '' }));
                }} className="space-y-3">
                  <input type="text" placeholder="Room/Section Name" required className="w-full p-2.5 border border-warm-200 rounded-lg text-xs font-bold" value={locationForm.name} onChange={(e)=>setLocationForm({...locationForm, name: e.target.value})} />
                  <button type="submit" className="w-full bg-terracotta-600 text-white py-2 rounded-lg text-[11px] font-semibold uppercase tracking-wider">Save Location</button>
                </form>
                <div className="pt-2 max-h-40 overflow-y-auto divide-y divide-ivory-50 text-[11px] font-semibold text-warm-600">
                  {locations.map(l => <div key={l.id} className="py-1.5 text-charcoal-800">{l.name}</div>)}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MiniKpiCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-card border border-warm-200 rounded-2xl p-5 shadow-sm flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-xl font-semibold text-charcoal-900">{value}</p>
      </div>
      <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
    </div>
  );
}
