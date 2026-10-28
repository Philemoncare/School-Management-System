'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
  GraduationCap,
  Award,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  CheckCircle,
  XCircle,
  Clock3
} from 'lucide-react';
import Link from 'next/link';

export default function StaffProfilePage() {
  const { staffId } = useParams();
  const searchParams = useSearchParams();
  const type = searchParams.get('type');

  const [staff, setStaff] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch(`/staff/${staffId}`), // Standard staff findOne
      apiFetch(`/hr/staff/${staffId}/documents?type=${type}`)
    ])
    .then(([staffData, docs]) => {
      setStaff(staffData);
      setDocuments(docs);
    })
    .catch(console.error)
    .finally(() => setLoading(false));
  }, [staffId, type]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;

  return (
    <div className="p-8 space-y-10">
      <div className="flex items-center gap-6">
        <Link href="/dashboard/hr/staff" className="p-3 bg-card border border-warm-200 rounded-2xl text-warm-400 hover:text-forest-700 transition-all shadow-sm">
          <ChevronLeft size={20}/>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
            {staff.firstName} {staff.lastName}
            <span className="px-3 py-1 bg-sage-50 text-forest-700 text-[11px] font-semibold uppercase rounded-full tracking-wide">{type}</span>
          </h1>
          <p className="text-warm-500 font-bold mt-1 uppercase tracking-wide text-xs flex items-center gap-2">
            <Briefcase size={14} className="text-warm-400" /> {staff.position?.name || staff.designation || 'Unassigned Position'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-8">
          {/* Contact Card */}
          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <div className="w-24 h-24 bg-ivory-50 border-4 border-white shadow-xs rounded-3xl flex items-center justify-center text-warm-200 mb-8 overflow-hidden">
               <User size={64} />
            </div>
            <div className="space-y-6">
               <ContactItem icon={<Mail size={16}/>} label="Email Address" value={staff.user?.email || 'N/A'} />
               <ContactItem icon={<Phone size={16}/>} label="Phone Number" value={staff.user?.phone || 'N/A'} />
               <ContactItem icon={<Building size={16}/>} label="Department" value={staff.department?.name || 'General'} />
               <ContactItem icon={<ShieldCheck size={16}/>} label="Staff Number" value={staff.employeeId || 'STF-PENDING'} />
            </div>
          </section>

          {/* Quick Metrics */}
          <section className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
            <h3 className="text-lg font-semibold mb-6 tracking-tight">Workforce Pulse</h3>
            <div className="grid grid-cols-2 gap-4">
               <div className="p-4 bg-card/5 rounded-2xl border border-white/5">
                  <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">Attendance</p>
                  <p className="text-xl font-semibold">98.4%</p>
               </div>
               <div className="p-4 bg-card/5 rounded-2xl border border-white/5">
                  <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-1">Leave Days</p>
                  <p className="text-xl font-semibold">12/20</p>
               </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-2 space-y-8">
          {/* Tabs */}
          <div className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
             <div className="flex border-b border-warm-100 gap-8 mb-8 overflow-x-auto pb-4">
                <TabLink active label="Employment" />
                <TabLink label="Qualifications" />
                <TabLink label="Documents" />
                <TabLink label="Attendance" />
                <TabLink label="Leave History" />
             </div>

             <div className="space-y-10">
                <section>
                   <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 mb-6 flex items-center gap-2">
                      <Briefcase size={16} className="text-forest-700"/> Employment Details
                   </h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-ivory-50 p-8 rounded-xl border border-warm-100">
                      <ProfileField label="Employment Type" value="Full-Time Permanent" />
                      <ProfileField label="Joined Date" value={new Date(staff.createdAt).toLocaleDateString()} />
                      <ProfileField label="Probation End" value="Mar 12, 2027" />
                      <ProfileField label="Work Location" value="Main Campus" />
                      <ProfileField label="Reporting Manager" value="Alice Johnson (Principal)" />
                      <ProfileField label="Payroll ID" value="PR-84729-3" />
                   </div>
                </section>

                <section>
                   <div className="flex justify-between items-center mb-6">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-charcoal-900 flex items-center gap-2">
                        <FileText size={16} className="text-terracotta-600"/> Verified Documents
                      </h3>
                      <button className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide border border-sage-200 px-3 py-1.5 rounded-lg hover:bg-sage-50 transition-all">Upload New</button>
                   </div>
                   <div className="space-y-4">
                      {documents.map((doc) => (
                        <div key={doc.id} className="flex items-center justify-between p-4 bg-card border border-warm-100 rounded-2xl hover:shadow-md transition-all">
                           <div className="flex items-center gap-4">
                              <div className="p-3 bg-ivory-50 rounded-xl text-warm-400"><FileText size={18}/></div>
                              <div>
                                 <p className="text-xs font-semibold text-charcoal-900">{doc.title}</p>
                                 <p className="text-[11px] font-bold text-warm-400 uppercase tracking-tight">{doc.documentType} • {new Date(doc.createdAt).toLocaleDateString()}</p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold uppercase ${
                                 doc.verificationStatus === 'VERIFIED' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                              }`}>{doc.verificationStatus}</span>
                              <button className="p-2 hover:bg-ivory-50 rounded-xl text-warm-400 transition-all"><ChevronRight size={16}/></button>
                           </div>
                        </div>
                      ))}
                      {documents.length === 0 && (
                        <div className="py-12 text-center border-2 border-dashed border-warm-100 rounded-xl">
                           <FileText className="mx-auto text-warm-200 mb-4" size={40} />
                           <p className="text-warm-400 font-bold uppercase tracking-wide text-xs">No documents uploaded</p>
                        </div>
                      )}
                   </div>
                </section>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ContactItem({ icon, label, value }: any) {
  return (
    <div className="flex items-center gap-4">
       <div className="p-2.5 bg-ivory-50 rounded-xl text-warm-400">{icon}</div>
       <div>
          <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide mb-0.5">{label}</p>
          <p className="text-xs font-bold text-warm-700">{value}</p>
       </div>
    </div>
  );
}

function TabLink({ label, active }: any) {
  return (
    <button className={`text-[11px] font-semibold uppercase tracking-wide pb-4 border-b-2 transition-all ${
       active ? 'border-forest-700 text-forest-700' : 'border-transparent text-warm-400 hover:text-warm-600'
    }`}>{label}</button>
  );
}

function ProfileField({ label, value }: any) {
  return (
    <div className="space-y-1.5">
       <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{label}</p>
       <p className="text-sm font-bold text-warm-700">{value}</p>
    </div>
  );
}
