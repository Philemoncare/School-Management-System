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

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard/admissions/applications" className="p-3 bg-white border border-gray-200 rounded-2xl text-gray-400 hover:text-blue-600 transition-all shadow-sm">
            <ChevronLeft size={20}/>
          </Link>
          <div>
            <div className="flex items-center gap-3">
               <h1 className="text-3xl font-black text-gray-900 tracking-tight">{application.firstName} {application.lastName}</h1>
               <StatusBadge status={application.status} />
            </div>
            <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-[10px] flex items-center gap-2">
               Ref: <span className="text-blue-600 font-mono">{application.reference}</span> • Submitted {new Date(application.submissionDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
           {application.status === 'SUBMITTED' || application.status === 'UNDER_REVIEW' ? (
              <>
                 <button onClick={() => handleDecision('REJECT')} disabled={submitting} className="px-6 py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-50 transition-all">
                    Reject
                 </button>
                 <button onClick={() => handleDecision('ADMIT')} disabled={submitting} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
                    Recommend Admission
                 </button>
              </>
           ) : application.status === 'ACCEPTED' ? (
              <button onClick={handleConfirmAdmission} disabled={submitting} className="bg-green-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl shadow-green-200">
                 Complete Final Enrollment
              </button>
           ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
           {/* Applicant Profile */}
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8 flex items-center gap-2">
                 <User size={16} className="text-blue-600" /> Applicant Bio-data
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
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-8 flex items-center gap-2">
                 <Users size={16} className="text-purple-600" /> Guardian Contacts
              </h3>
              <div className="space-y-6">
                 {application.guardians.map((g: any) => (
                    <div key={g.id} className="flex items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                       <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-gray-400 shadow-sm font-black text-xs">
                             {g.firstName[0]}{g.lastName[0]}
                          </div>
                          <div>
                             <p className="text-sm font-black text-gray-900">{g.firstName} {g.lastName}</p>
                             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{g.relationship} {g.isPrimary && '• Primary'}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-6">
                          <div className="text-right">
                             <p className="text-[10px] font-black text-gray-900">{g.email}</p>
                             <p className="text-[10px] font-bold text-gray-400 uppercase">{g.phone}</p>
                          </div>
                          <button className="p-3 bg-white rounded-xl text-gray-400 hover:text-blue-600 transition-all shadow-sm"><MoreVertical size={16}/></button>
                       </div>
                    </div>
                 ))}
              </div>
           </section>
        </div>

        <div className="space-y-8">
           {/* Document Checklist */}
           <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
                 <FileText size={16} className="text-amber-600" /> Documents
              </h3>
              <div className="space-y-4">
                 {application.documents.map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                       <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg text-gray-400"><FileText size={14}/></div>
                          <p className="text-xs font-bold text-gray-700">{doc.title}</p>
                       </div>
                       <button className="text-blue-600 hover:scale-110 transition-transform"><Download size={14}/></button>
                    </div>
                 ))}
                 {application.documents.length === 0 && (
                    <div className="py-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">No documents uploaded</p>
                    </div>
                 )}
              </div>
           </section>

           {/* Timeline / Status History */}
           <section className="bg-gray-900 rounded-[2.5rem] p-8 shadow-xl text-white">
              <h3 className="text-lg font-black mb-8 tracking-tight">Processing Pipeline</h3>
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
    SUBMITTED: 'bg-blue-50 text-blue-700',
    UNDER_REVIEW: 'bg-amber-50 text-amber-700',
    DOCUMENTS_REQUIRED: 'bg-red-50 text-red-700',
    OFFERED: 'bg-purple-50 text-purple-700',
    ACCEPTED: 'bg-emerald-50 text-emerald-700',
    REJECTED: 'bg-gray-100 text-gray-500',
    ENROLLED: 'bg-green-600 text-white shadow-md'
  };

  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status] || 'bg-gray-50 text-gray-500'}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function ProfileField({ label, value }: any) {
  return (
    <div className="space-y-1.5">
       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
       <p className="text-lg font-black text-gray-900">{value || '—'}</p>
    </div>
  );
}

function TimelineItem({ label, time, active, last }: any) {
  return (
    <div className="flex gap-4 relative">
       {!last && <div className={`absolute left-2.5 top-5 bottom-0 w-0.5 ${active ? 'bg-blue-500' : 'bg-white/10'}`} />}
       <div className={`w-5 h-5 rounded-full z-10 flex items-center justify-center border-4 ${
          active ? 'bg-blue-500 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-gray-900 border-white/10'
       }`} />
       <div className="-mt-0.5">
          <p className={`text-xs font-black uppercase tracking-widest ${active ? 'text-white' : 'text-gray-500'}`}>{label}</p>
          {time && <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">{time}</p>}
       </div>
    </div>
  );
}

function Users(props: any) {
   return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
