'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import {
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Calendar,
  ShieldCheck,
  Loader2,
  FileText,
  MapPin,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function StaffOwnProfile() {
  const { user } = useAuth();
  const [staff, setStaff] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Determine if user is staff or teacher and fetch profile
    // For now, let's assume we have an endpoint that returns the profile for the logged in user
    apiFetch('/staff/me') // Assuming we add this to staff controller or similar
      .then(setStaff)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  return (
    <div className="p-8 space-y-10 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row items-center gap-10">
         <div className="w-32 h-32 bg-gray-100 rounded-[2.5rem] flex items-center justify-center text-gray-300 shadow-inner">
            <User size={80} />
         </div>
         <div className="text-center md:text-left">
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">{staff.firstName} {staff.lastName}</h1>
            <p className="text-gray-500 font-bold mt-1 uppercase tracking-widest text-xs flex items-center justify-center md:justify-start gap-2">
               <Briefcase size={14} className="text-blue-600" /> {staff.position?.name || staff.designation || 'Staff Member'}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
               <User size={16} className="text-blue-600" /> Personal Identity
            </h3>
            <div className="space-y-6">
               <InfoField label="Staff Identification" value={staff.employeeId || 'NOT_ASSIGNED'} />
               <InfoField label="Primary Email" value={staff.user?.email} />
               <InfoField label="Phone Contact" value={staff.user?.phone || 'N/A'} />
               <InfoField label="Date of Birth" value="October 12, 1988" />
            </div>
         </section>

         <section className="bg-white border border-gray-200 rounded-[2.5rem] p-8 shadow-sm">
            <h3 className="text-sm font-black uppercase tracking-widest text-gray-900 mb-6 flex items-center gap-2">
               <Building size={16} className="text-purple-600" /> Professional Context
            </h3>
            <div className="space-y-6">
               <InfoField label="Department" value={staff.department?.name || 'General Administration'} />
               <InfoField label="Employment Type" value="Full-Time Permanent" />
               <InfoField label="Work Location" value="Main Campus" />
               <InfoField label="Joined School" value={new Date(staff.createdAt).toLocaleDateString()} />
            </div>
         </section>
      </div>

      <section className="bg-gray-900 rounded-[2.5rem] p-10 text-white shadow-xl">
         <h3 className="text-xl font-black mb-8 tracking-tight">Career Credentials</h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <CredentialItem title="B.Sc. Computer Science" sub="University of Technology" icon={<GraduationCap size={24}/>} />
            <CredentialItem title="Microsoft Certified Educator" sub="Valid until 2028" icon={<Award size={24}/>} />
            <CredentialItem title="First Aid Certified" sub="Red Cross Society" icon={<ShieldCheck size={24}/>} />
         </div>
      </section>
    </div>
  );
}

function InfoField({ label, value }: any) {
  return (
    <div className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
       <p className="text-sm font-bold text-gray-700">{value}</p>
    </div>
  );
}

function CredentialItem({ title, sub, icon }: any) {
  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
       <div className="text-blue-400 mb-4 group-hover:scale-110 transition-transform">{icon}</div>
       <p className="text-sm font-black">{title}</p>
       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mt-1">{sub}</p>
    </div>
  );
}

function GraduationCap(props: any) {
   return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-graduation-cap"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
}

function Award(props: any) {
   return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-award"><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>
}
