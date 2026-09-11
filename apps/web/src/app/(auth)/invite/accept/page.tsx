'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { User, Lock, ArrowRight, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return setError('Invalid invitation link.');

    apiFetch(`/auth/invite/details?token=${token}`)
      .then(setInvitation)
      .catch(err => setError(err.message || 'Invitation not found or expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) return alert('Passwords mismatch');

    setSubmitting(true);
    try {
      await apiFetch('/auth/invite/accept', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Failed to accept invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>;

  if (error) return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center"><ShieldCheck size={40}/></div>
      <h2 className="text-2xl font-black text-gray-900">Link Invalid</h2>
      <p className="text-sm font-medium text-gray-500">{error}</p>
      <Link href="/login" className="block w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black">Go to Sign In</Link>
    </div>
  );

  if (success) return (
    <div className="text-center space-y-6 animate-in zoom-in-95">
      <div className="mx-auto w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center"><CheckCircle2 size={40}/></div>
      <h2 className="text-2xl font-black text-gray-900">Welcome to {invitation?.school.name}</h2>
      <p className="text-sm font-medium text-gray-500">Your account has been activated and linked to the school.</p>
      <Link href="/login" className="block w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100">Sign In to Dashboard</Link>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="text-center">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Join {invitation?.school.name}</h2>
        <p className="text-sm font-medium text-gray-500 mt-1">You've been invited as a <span className="font-bold text-blue-600">{invitation?.role.name}</span>.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
           <div className="space-y-2">
             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Email</label>
             <input disabled className="w-full p-4 bg-gray-100 border border-gray-200 rounded-2xl text-gray-500 font-bold text-sm" value={invitation?.email} />
           </div>

           <div className="space-y-2">
             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Create Password</label>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
               <input type="password" required className="block w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-sm" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
             </div>
           </div>

           <div className="space-y-2">
             <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Password</label>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
               <input type="password" required className="block w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-sm" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
             </div>
           </div>
        </div>

        <button type="submit" disabled={submitting} className="w-full flex justify-center items-center gap-2 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all">
          {submitting ? <Loader2 className="animate-spin" size={20} /> : <>Complete Onboarding <ArrowRight size={18} /></>}
        </button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="text-center p-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
