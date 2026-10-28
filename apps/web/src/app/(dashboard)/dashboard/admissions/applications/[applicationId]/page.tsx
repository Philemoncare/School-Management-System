'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  User,
  Briefcase,
  Calendar,
  Clock,
  FileText,
  Mail,
  Phone,
  Building,
  ShieldCheck,
  ChevronLeft,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Download,
  MoreVertical,
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import Link from 'next/link';

export default function ApplicationDetailPage() {
  const { applicationId } = useParams();
  const [application, setApplication] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadApplication();
  }, [applicationId]);

  async function loadApplication() {
    setLoading(true);
    try {
      const data = await apiFetch(`/admissions/applications/${applicationId}`);
      setApplication(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDecision(decision: string) {
    if (!confirm(`Are you sure you want to ${decision.toLowerCase()} this application?`)) return;
    setSubmitting(true);
    try {
      await apiFetch(`/admissions/applications/${applicationId}/decision`, {
        method: 'POST',
        body: JSON.stringify({ decision })
      });
      await loadApplication();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleConfirmAdmission() {
    if (!confirm('This will create an official student record and enrollment. Proceed?')) return;
    setSubmitting(true);
    try {
      await apiFetch(`/admissions/applications/${applicationId}/confirm`, { method: 'POST' });
      await loadApplication();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/admissions/applications" className="p-3 bg-card border border-warm-200 rounded-2xl text-warm-400 hover:text-forest-700 transition-all shadow-sm">
            <ChevronLeft size={20}/>
          </Link>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight">{application.firstName} {application.lastName}</h1>
               <StatusBadge status={application.status} />
            </div>
            <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-[11px] flex items-center gap-2">
               Ref: <span className="text-forest-700 font-mono">{application.reference}</span> • Submitted {new Date(application.submissionDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
           {application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW' ? (
              <>
                 <button onClick={() => handleDecision('REJECT')} disabled={submitting} className="px-6 py-3 bg-card border border-danger-200 text-danger-600 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-danger-50 transition-all">
                    Reject
                 </button>
                 <button onClick={() => handleDecision('ADMIT')} disabled={submitting} className="bg-forest-700 text-white px-6 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 transition-all shadow-xs shadow-sage-200">
                    Recommend Admission
                 </button>
              </>
           ) : application.status === 'ACCEPTED' ? (
              <button onClick={handleConfirmAdmission} disabled={submitting} className="bg-success-600 text-white px-8 py-3 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-success-700 transition-all shadow-xs shadow-success-200">
                 Complete Final Enrollment
              </button>
           ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Applicant Profile */}
           <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-8 flex items-center gap-2">
                 <User size={16} className="text-forest-700" /> Applicant Bio-data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                 <ProfileField label="Full Name" value={`${application.firstName} ${application.middleName || ''} ${application.lastName}`} />
                 <ProfileField label="Date of Birth" value={new Date(application.dateOfBirth).toLocaleDateString()} />
                 <ProfileField label="Gender" value={application.gender} />
                 <ProfileField label="Requested Class" value={application.class.name} />
                 <ProfileField label="Academic Year" value={application.academicYear.name} />
                 <ProfileField label="Admission Campaign" value={application.campaign.name} />
              </div>
           </section>

           {/* Guardians */}
           <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-8 flex items-center gap-2">
                 <Users size={16} className="text-terracotta-600" /> Guardian Contacts
              </h3>
              <div className="space-y-6">
                 {application.guardians.map((g: any) => (
                    <div key={g.id} className="flex items-center justify-between p-6 bg-ivory-50 rounded-xl border border-warm-100">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-card rounded-2xl flex items-center justify-center text-warm-400 shadow-sm font-semibold text-xs">
                             {g.firstName[0]}{g.lastName[0]}
                          </div>
                          <div>
                             <p className="text-sm font-semibold text-charcoal-900">{g.firstName} {g.lastName}</p>
                             <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight">{g.relationship} {g.isPrimary && '• Primary'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="text-[11px] font-semibold text-charcoal-900">{g.email}</p>
                             <p className="text-[11px] font-bold text-warm-400 uppercase">{g.phone}</p>
                          </div>
                          <button className="p-3 bg-card rounded-xl text-warm-400 hover:text-forest-700 transition-all shadow-sm"><MoreVertical size={16}/></button>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>

        <div className="space-y-8">
           {/* Document Checklist */}
           <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                 <FileText size={16} className="text-warning-600" /> Documents
              </h3>
              <div className="space-y-4">
                 {application.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-ivory-50 rounded-2xl border border-warm-100">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-card rounded-lg text-warm-400"><FileText size={14}/></div>
                          <p className="text-xs font-bold text-warm-700">{doc.title}</p>
                       </div>
                       <button className="text-forest-700 hover:scale-110 transition-transform"><Download size={14}/></button>
                    </div>
                 ))}
                 {application.documents.length === 0 && (
                    <div className="py-8 text-center bg-ivory-50 rounded-2xl border border-dashed border-warm-200">
                       <p className="text-[11px] font-bold text-warm-400 uppercase tracking-wide">No documents uploaded</p>
                    </div>
                 )}
              </div>
           </section>

           {/* Timeline / Status History */}
           <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
              <h3 className="text-lg font-semibold mb-8 tracking-tight">Processing Pipeline</h3>
              <div className="space-y-8">
                 <TimelineItem active label="Submission Received" time={new Date(application.submissionDate).toLocaleString()} />
                 <TimelineItem active={!!application.decisions.length} label="Initial Screening" />
                 <TimelineItem active={application.status === 'OFFERED' || application.status === 'ACCEPTED' || application.status === 'ENROLLED'} label="Admission Offer" />
                 <TimelineItem active={application.status === 'ENROLLED'} label="Enrolled Student" last />
              </div>
           </section>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: any = {
    SUBMITTED: 'bg-sage-50 text-forest-800',
    UNDER_REVIEW: 'bg-warning-50 text-warning-700',
    DOCUMENTS_REQUIRED: 'bg-danger-50 text-danger-700',
    OFFERED: 'bg-terracotta-50 text-terracotta-700',
    ACCEPTED: 'bg-sage-50 text-forest-700',
    REJECTED: 'bg-warm-100 text-warm-500',
    ENROLLED: 'bg-success-600 text-white shadow-md'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide ${styles[status] || 'bg-ivory-50 text-warm-500'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ProfileField({ label, value }: any) {
  return (
    <div className="space-y-1.5">
       <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{label}</p>
       <p className="text-lg font-semibold text-charcoal-900">{value || '—'}</p>
    </div>
  );
}

function TimelineItem({ label, time, active, last }: any) {
  return (
    <div className="flex gap-4 relative">
       {!last && <div className={`absolute left-2.5 top-5 bottom-0 w-0.5 ${active ? 'bg-forest-500' : 'bg-card/10'}`} />}
       <div className={`w-5 h-5 rounded-full z-10 flex items-center justify-center border-4 ${
          active ? 'bg-forest-500 border-forest-500/20 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-charcoal-900 border-white/10'
       }`} />
       <div className="-mt-0.5">
          <p className={`text-xs font-semibold uppercase tracking-wide ${active ? 'text-white' : 'text-warm-500'}`}>{label}</p>
          {time && <p className="text-[11px] font-bold text-warm-400 mt-1 uppercase">{time}</p>}
       </div>
    </div>
  );
}

function Users(props: any) {
   return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
