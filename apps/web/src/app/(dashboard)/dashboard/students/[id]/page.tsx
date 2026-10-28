'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  User,
  Users,
  Calendar,
  BookOpen,
  ClipboardCheck,
  CreditCard,
  History,
  FileText,
  ShieldAlert
} from 'lucide-react';

export default function StudentProfilePage() {
  const { id } = useParams();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch(`/students/${id}`)
      .then(setStudent)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="p-8 text-center">Loading Student Profile...</div>;
  if (!student) return <div className="p-8 text-center text-danger-500">Student not found</div>;

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header Profile Card */}
      <div className="bg-card border border-warm-200 rounded-3xl p-6 lg:p-8 shadow-sm flex flex-col md:flex-row gap-8 items-center md:items-start">
        <div className="w-32 h-32 rounded-3xl bg-sage-100 flex items-center justify-center text-forest-700 text-4xl font-semibold shrink-0 shadow-inner">
          {student.firstName[0]}{student.lastName[0]}
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center gap-2 mb-2">
            <h1 className="text-3xl font-semibold text-charcoal-900">{student.firstName} {student.middleName || ''} {student.lastName}</h1>
            <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-[11px] font-semibold uppercase tracking-wide w-fit mx-auto md:mx-0">
              {student.status}
            </span>
          </div>
          <p className="text-warm-500 font-bold flex flex-wrap justify-center md:justify-start gap-4 uppercase tracking-tighter text-sm">
            <span>Student ID: <span className="text-charcoal-900">{student.studentNumber}</span></span>
            <span>Admission: <span className="text-charcoal-900">{student.admissionNumber || 'N/A'}</span></span>
            <span>DOB: <span className="text-charcoal-900">{new Date(student.dateOfBirth).toLocaleDateString()}</span></span>
          </p>
          <div className="mt-6 flex flex-wrap justify-center md:justify-start gap-3">
             <button className="bg-forest-700 text-white px-6 py-2 rounded-xl font-bold hover:bg-forest-800 transition-all text-sm shadow-lg shadow-sage-200">Edit Profile</button>
             <button className="bg-card border border-warm-200 text-warm-700 px-6 py-2 rounded-xl font-bold hover:bg-ivory-50 transition-all text-sm shadow-sm">View Documents</button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Academic Context */}
        <div className="lg:col-span-2 space-y-8">
           <div className="bg-card border border-warm-200 rounded-3xl p-6 lg:p-8 shadow-sm">
             <h3 className="text-xl font-bold text-charcoal-900 mb-6 flex items-center gap-2">
               <BookOpen size={22} className="text-forest-700" /> Current Enrollment
             </h3>
             {student.enrollments?.[0] ? (
               <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                  <ContextItem label="Academic Year" value={student.enrollments[0].academicYear.name} />
                  <ContextItem label="Class" value={student.enrollments[0].class.name} />
                  <ContextItem label="Section" value={student.enrollments[0].section?.name || 'N/A'} />
               </div>
             ) : (
               <div className="py-10 text-center bg-ivory-50 rounded-2xl border border-dashed border-warm-200">
                  <ShieldAlert className="mx-auto text-warm-300 mb-2" size={32} />
                  <p className="text-warm-400 font-bold">No active enrollment found</p>
               </div>
             )}
           </div>

           {/* Tabs section for details */}
           <div className="bg-card border border-warm-200 rounded-3xl shadow-sm overflow-hidden">
              <div className="flex border-b border-warm-100 overflow-x-auto">
                 <TabButton label="Attendance" active />
                 <TabButton label="Assessments" />
                 <TabButton label="Finance" />
                 <TabButton label="Activity" />
              </div>
              <div className="p-8">
                 <div className="flex flex-col items-center justify-center py-20 text-warm-400">
                    <History size={48} className="mb-4 text-warm-200" />
                    <p className="font-bold text-lg text-warm-300 uppercase tracking-wide">Historical Data Loading...</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar: Guardians & Contact */}
        <div className="space-y-8">
           <div className="bg-card border border-warm-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-charcoal-900 mb-6 flex items-center gap-2">
                <Users size={18} className="text-forest-700" /> Guardians
              </h3>
              <div className="space-y-4">
                 {student.guardians?.map((link: any) => (
                   <div key={link.guardian.id} className="p-4 bg-ivory-50 rounded-2xl border border-warm-100">
                      <p className="text-sm font-semibold text-charcoal-900 leading-tight">{link.guardian.firstName} {link.guardian.lastName}</p>
                      <p className="text-[11px] font-semibold text-forest-700 uppercase tracking-wider mt-1">{link.relation} {link.isPrimary ? '• Primary' : ''}</p>
                      <div className="mt-3 text-xs font-bold text-warm-500 flex flex-col gap-1">
                         <span>{link.guardian.phone || 'No Phone'}</span>
                         <span>{link.guardian.email || 'No Email'}</span>
                      </div>
                   </div>
                 ))}
                 {!student.guardians?.length && <p className="text-sm text-warm-400 font-medium italic">No guardians linked yet</p>}
              </div>
              <button className="w-full mt-6 py-3 border-2 border-dashed border-warm-200 rounded-2xl text-xs font-bold text-warm-400 hover:border-sage-400 hover:text-forest-700 transition-all uppercase tracking-wide">
                + Link Guardian
              </button>
           </div>

           <div className="bg-charcoal-900 rounded-3xl p-6 shadow-xs text-white overflow-hidden relative">
              <CreditCard className="absolute -bottom-6 -right-6 text-white/5" size={120} />
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-6">Financial Overview</h3>
                <div className="space-y-2 mb-6">
                   <p className="text-warm-400 text-xs font-bold uppercase tracking-wide">Outstanding Balance</p>
                   <p className="text-3xl font-semibold">GH₵ 0.00</p>
                </div>
                <button className="w-full py-3 bg-card text-charcoal-900 rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-warm-100 transition-colors">
                  Generate Statement
                </button>
              </div>
           </div>

           <div className="bg-card border border-warm-200 rounded-3xl p-6 shadow-sm">
              <h3 className="font-bold text-charcoal-900 mb-6 flex items-center gap-2">
                <ShieldAlert size={18} className="text-danger-600" /> Lifecycle Actions
              </h3>
              <div className="space-y-3">
                 <LifecycleButton label="Withdraw Student" status="WITHDRAWN" color="text-danger-600 border-danger-100 bg-danger-50 hover:bg-danger-100" />
                 <LifecycleButton label="Mark Graduated" status="GRADUATED" color="text-forest-700 border-sage-100 bg-sage-50 hover:bg-sage-100" />
                 <LifecycleButton label="Initiate Transfer" status="TRANSFERRED" color="text-warning-600 border-warning-100 bg-warning-50 hover:bg-warning-100" />
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function LifecycleButton({ label, status, color }: any) {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);

  async function handleAction() {
    if (!confirm(`Are you sure you want to change student status to ${status}?`)) return;
    setLoading(false);
    try {
      await apiFetch(`/students/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status, reason: 'Administrative update' })
      });
      window.location.reload();
    } catch (err) {
      console.error(err);
      alert('Status update failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleAction}
      disabled={loading}
      className={`w-full py-3 border rounded-2xl text-[11px] font-semibold uppercase tracking-wide transition-all ${color} disabled:opacity-50`}
    >
      {loading ? 'Processing...' : label}
    </button>
  );
}

function ContextItem({ label, value }: any) {
  return (
    <div>
      <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm font-semibold text-charcoal-900">{value}</p>
    </div>
  );
}

function TabButton({ label, active = false }: any) {
  return (
    <button className={`px-6 py-4 text-xs font-semibold uppercase tracking-wide border-b-2 transition-all shrink-0 ${
      active ? 'border-forest-700 text-forest-700 bg-sage-50/30' : 'border-transparent text-warm-400 hover:text-warm-600'
    }`}>
      {label}
    </button>
  );
}
