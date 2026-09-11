'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Mail, ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setSuccess(true);
    } catch (err: any) {
      alert(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-6 animate-in zoom-in-95">
        <div className="mx-auto w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
          <CheckCircle2 size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-gray-900">Check your inbox</h2>
          <p className="text-sm font-medium text-gray-500">If an account is associated with {email}, you'll receive instructions shortly.</p>
        </div>
        <Link href="/login" className="block w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
      <div className="text-center">
        <h2 className="text-2xl font-black text-gray-900 tracking-tight">Forgot password?</h2>
        <p className="text-sm font-medium text-gray-500 mt-1">No problem, we'll send you reset instructions.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-gray-400">
              <Mail size={18} />
            </div>
            <input
              type="email"
              required
              className="block w-full pl-12 pr-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600/10 focus:bg-white transition-all text-sm"
              placeholder="name@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 py-5 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={20} /> : <>Reset Password <ArrowRight size={18} /></>}
        </button>
      </form>

      <div className="pt-2 text-center">
        <Link href="/login" className="text-sm font-bold text-gray-500 hover:text-gray-700 inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
