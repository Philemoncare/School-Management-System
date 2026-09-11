'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  Building2,
  User,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Globe,
  Coins
} from 'lucide-react';
import Link from 'next/link';

export default function RegisterSchoolPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    school: {
      name: '',
      code: '',
      slug: '',
      email: '',
      phone: '',
      address: '',
      timezone: 'UTC',
      currency: 'USD'
    },
    admin: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: ''
    }
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setLoading(true);
    try {
      await apiFetch('/auth/register-school', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="mx-auto w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center">
          <CheckCircle2 size={48} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900">Registration Received</h2>
          <p className="text-sm font-medium text-gray-500">We've sent a verification link to <span className="font-bold text-gray-900">{formData.admin.email}</span>. Please verify your email to activate your workspace.</p>
        </div>
        <Link href="/login" className="block w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
          Continue to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center px-1">
         <div className="flex gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-8 bg-blue-600' : 'w-2 bg-gray-100'}`} />
            ))}
         </div>
         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Step {step} of 3</span>
      </div>

      <div className="space-y-1">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
          {step === 1 ? 'School Information' : step === 2 ? 'Administrator Account' : 'Final Review'}
        </h2>
        <p className="text-sm font-medium text-gray-500">
          {step === 1 ? 'Let\'s start with your institution details.' : step === 2 ? 'Create the master administrator account.' : 'Check everything is correct before we deploy.'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
             <AuthInput label="School Name" placeholder="e.g. St. Peters Academy" value={formData.school.name} onChange={v => setFormData({...formData, school: {...formData.school, name: v}})} />
             <div className="grid grid-cols-2 gap-4">
                <AuthInput label="School Code" placeholder="SPA" value={formData.school.code} onChange={v => setFormData({...formData, school: {...formData.school, code: v}})} />
                <AuthInput label="URL Slug" placeholder="st-peters" value={formData.school.slug} onChange={v => setFormData({...formData, school: {...formData.school, slug: v}})} />
             </div>
             <AuthInput label="Institute Email" type="email" placeholder="contact@school.edu" value={formData.school.email} onChange={v => setFormData({...formData, school: {...formData.school, email: v}})} />
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Currency</label>
                   <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold" value={formData.school.currency} onChange={e => setFormData({...formData, school: {...formData.school, currency: e.target.value}})}>
                      <option value="USD">USD ($)</option>
                      <option value="GHS">GHS (₵)</option>
                      <option value="EUR">EUR (€)</option>
                   </select>
                </div>
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Timezone</label>
                   <select className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-xs font-bold" value={formData.school.timezone} onChange={e => setFormData({...formData, school: {...formData.school, timezone: e.target.value}})}>
                      <option value="UTC">UTC (GMT)</option>
                      <option value="Africa/Accra">Africa/Accra</option>
                      <option value="America/New_York">America/NY</option>
                   </select>
                </div>
             </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
             <div className="grid grid-cols-2 gap-4">
                <AuthInput label="First Name" placeholder="John" value={formData.admin.firstName} onChange={v => setFormData({...formData, admin: {...formData.admin, firstName: v}})} />
                <AuthInput label="Last Name" placeholder="Doe" value={formData.admin.lastName} onChange={v => setFormData({...formData, admin: {...formData.admin, lastName: v}})} />
             </div>
             <AuthInput label="Work Email" type="email" placeholder="j.doe@school.edu" value={formData.admin.email} onChange={v => setFormData({...formData, admin: {...formData.admin, email: v}})} />
             <AuthInput label="Password" type="password" placeholder="••••••••" value={formData.admin.password} onChange={v => setFormData({...formData, admin: {...formData.admin, password: v}})} />
             <AuthInput label="Confirm Password" type="password" placeholder="••••••••" value={formData.admin.confirmPassword} onChange={v => setFormData({...formData, admin: {...formData.admin, confirmPassword: v}})} />
          </div>
        )}

        {step === 3 && (
          <div className="bg-gray-50 border border-gray-100 rounded-3xl p-6 space-y-6">
             <div className="flex gap-4 items-start">
                <div className="bg-white p-2 rounded-xl border border-gray-200"><Building2 className="text-blue-600" size={20}/></div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">School</p>
                   <p className="text-sm font-bold text-gray-900">{formData.school.name} ({formData.school.code})</p>
                </div>
             </div>
             <div className="flex gap-4 items-start border-t border-gray-200 pt-6">
                <div className="bg-white p-2 rounded-xl border border-gray-200"><User className="text-indigo-600" size={20}/></div>
                <div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Admin</p>
                   <p className="text-sm font-bold text-gray-900">{formData.admin.firstName} {formData.admin.lastName}</p>
                   <p className="text-xs text-gray-500 font-medium">{formData.admin.email}</p>
                </div>
             </div>
             <div className="bg-blue-600/5 rounded-2xl p-4 border border-blue-600/10 flex gap-3 items-center">
                <ShieldCheck className="text-blue-600" size={20} />
                <p className="text-[10px] font-bold text-blue-800 leading-tight">By clicking Register, you agree to our platform data processing and security policies.</p>
             </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="p-5 bg-white border border-gray-200 rounded-2xl text-gray-500 hover:bg-gray-50 transition-all">
               <ArrowLeft size={20} />
            </button>
          )}
          <button type="submit" disabled={loading} className="flex-1 flex justify-center items-center gap-2 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin" size={20} /> : step === 3 ? 'Finalize Registration' : <>Continue <ArrowRight size={18} /></>}
          </button>
        </div>
      </form>

      <div className="pt-2 text-center">
        <p className="text-sm font-bold text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-blue-600 hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

function AuthInput({ label, type = 'text', placeholder, value, onChange }: any) {
  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
      <input
        type={type}
        required
        className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white focus:border-blue-600/30 transition-all text-sm"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
