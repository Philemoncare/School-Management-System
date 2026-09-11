'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  User,
  Users,
  Building,
  Calendar,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Mail,
  Phone,
  MapPin,
  ChevronRight
} from 'lucide-react';

export default function PublicApplicationPage() {
  const { campaignSlug } = useParams();
  const [campaign, setCampaign] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '', middleName: '', lastName: '', dateOfBirth: '', gender: '',
    academicYearId: '', classId: '',
    guardians: [
      { firstName: '', lastName: '', relationship: 'Father', email: '', phone: '', address: '', isPrimary: true }
    ]
  });

  useEffect(() => {
    // In a real public app, we'd have a specific public metadata endpoint
    // Here we'll simulate it
    setLoading(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      // In a real app: await apiFetch(`/admissions/apply`, { method: 'POST', body: JSON.stringify({...formData, campaignId: campaign.id}) })
      setSuccess('APP-2027-847291');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;

  if (success) return (
     <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 shadow-2xl text-center space-y-6">
           <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-green-600 mx-auto">
              <CheckCircle2 size={48} />
           </div>
           <h2 className="text-3xl font-black text-gray-900 tracking-tight">Application Submitted!</h2>
           <p className="text-gray-500 font-medium">Your application has been received and is now in the review queue. Please save your reference number.</p>
           <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">Application Reference</p>
              <p className="text-2xl font-mono font-black text-blue-600">{success}</p>
           </div>
           <button onClick={() => window.location.reload()} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all">Done</button>
        </div>
     </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-6">
      <div className="max-w-3xl mx-auto space-y-10">
        <div className="text-center space-y-4">
           <h1 className="text-4xl font-black text-gray-900 tracking-tight">Student Admission Application</h1>
           <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Academic Year 2027/2028 Intake</p>
        </div>

        <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden">
           <div className="flex bg-gray-900 p-8 text-white">
              <StepIndicator current={step} />
           </div>

           <form onSubmit={handleSubmit} className="p-10 space-y-10">
              {step === 1 && (
                 <section className="space-y-8 animate-fadeIn">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                       <User className="text-blue-600" /> Applicant Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <InputField label="First Name *" required value={formData.firstName} onChange={(v) => setFormData({...formData, firstName: v})} />
                       <InputField label="Last Name *" required value={formData.lastName} onChange={(v) => setFormData({...formData, lastName: v})} />
                       <InputField label="Middle Name" value={formData.middleName} onChange={(v) => setFormData({...formData, middleName: v})} />
                       <InputField label="Date of Birth *" type="date" required value={formData.dateOfBirth} onChange={(v) => setFormData({...formData, dateOfBirth: v})} />
                       <div>
                          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 ml-1">Gender *</label>
                          <select className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-600/10 transition-all outline-none" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}>
                             <option value="">Select...</option>
                             <option value="MALE">Male</option>
                             <option value="FEMALE">Female</option>
                             <option value="OTHER">Other</option>
                          </select>
                       </div>
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-end">
                       <button type="button" onClick={() => setStep(2)} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2">
                          Next Step <ArrowRight size={18} />
                       </button>
                    </div>
                 </section>
              )}

              {step === 2 && (
                 <section className="space-y-8 animate-fadeIn">
                    <h3 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                       <Users className="text-purple-600" /> Parent / Guardian Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <InputField label="Guardian First Name *" required value={formData.guardians[0].firstName} onChange={(v) => {
                          const gs = [...formData.guardians];
                          gs[0].firstName = v;
                          setFormData({...formData, guardians: gs});
                       }} />
                       <InputField label="Guardian Last Name *" required value={formData.guardians[0].lastName} onChange={(v) => {
                          const gs = [...formData.guardians];
                          gs[0].lastName = v;
                          setFormData({...formData, guardians: gs});
                       }} />
                       <InputField label="Relationship *" placeholder="e.g. Mother" required value={formData.guardians[0].relationship} onChange={(v) => {
                          const gs = [...formData.guardians];
                          gs[0].relationship = v;
                          setFormData({...formData, guardians: gs});
                       }} />
                       <InputField label="Email Address *" type="email" required value={formData.guardians[0].email} onChange={(v) => {
                          const gs = [...formData.guardians];
                          gs[0].email = v;
                          setFormData({...formData, guardians: gs});
                       }} />
                       <InputField label="Phone Number *" required value={formData.guardians[0].phone} onChange={(v) => {
                          const gs = [...formData.guardians];
                          gs[0].phone = v;
                          setFormData({...formData, guardians: gs});
                       }} />
                       <InputField label="Residential Address" value={formData.guardians[0].address} onChange={(v) => {
                          const gs = [...formData.guardians];
                          gs[0].address = v;
                          setFormData({...formData, guardians: gs});
                       }} />
                    </div>
                    <div className="pt-6 border-t border-gray-100 flex justify-between">
                       <button type="button" onClick={() => setStep(1)} className="text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-all">Back</button>
                       <button type="button" onClick={() => setStep(3)} className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 flex items-center gap-2">
                          Review & Submit <ArrowRight size={18} />
                       </button>
                    </div>
                 </section>
              )}

              {step === 3 && (
                 <section className="space-y-8 animate-fadeIn">
                    <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100">
                       <h3 className="text-xl font-black text-blue-900 tracking-tight mb-2">Final Review</h3>
                       <p className="text-blue-600/70 font-medium text-sm">Please verify that all information provided is accurate before final submission.</p>
                    </div>

                    <div className="space-y-4">
                       <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <CheckCircle2 className="text-green-500 shrink-0 mt-0.5" size={18} />
                          <p className="text-xs font-bold text-gray-700 leading-relaxed">By submitting this application, you agree that the information provided is true and correct to the best of your knowledge.</p>
                       </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex justify-between">
                       <button type="button" onClick={() => setStep(2)} className="text-gray-400 font-black text-xs uppercase tracking-widest hover:text-gray-600 transition-all">Back</button>
                       <button type="submit" disabled={submitting} className="bg-gray-900 text-white px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-black transition-all shadow-2xl flex items-center gap-3">
                          {submitting ? <Loader2 className="animate-spin" size={20}/> : <ShieldCheck size={20}/>} Confirm Submission
                       </button>
                    </div>
                 </section>
              )}
           </form>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  const steps = ['Applicant', 'Guardians', 'Confirmation'];
  return (
    <div className="flex items-center gap-10">
       {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-3">
             <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs border ${
                current === i + 1 ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-white/10 text-white/30'
             }`}>
                {i + 1}
             </div>
             <p className={`text-[10px] font-black uppercase tracking-widest ${
                current === i + 1 ? 'text-white' : 'text-white/20'
             }`}>{s}</p>
             {i < steps.length - 1 && <ChevronRight size={14} className="text-white/10" />}
          </div>
       ))}
    </div>
  );
}

function InputField({ label, ...props }: any) {
  return (
    <div className="space-y-2">
       <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
       <input
          {...props}
          onChange={(e) => props.onChange(e.target.value)}
          className="w-full bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm font-bold focus:ring-2 focus:ring-blue-600/10 transition-all outline-none placeholder:text-gray-300"
       />
    </div>
  );
}
