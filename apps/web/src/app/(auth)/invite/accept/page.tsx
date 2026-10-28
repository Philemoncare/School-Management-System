'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { Lock, ArrowRight, Loader2, CheckCircle, ShieldAlert, Eye, EyeOff, Building2 } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<any>(null);
  const [error, setError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    let strength = 0;
    if (password.length >= 12) strength += 1;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^a-zA-Z\d]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation link.');
      setLoading(false);
      return;
    }

    apiFetch(`/auth/invite/details?token=${token}`)
      .then(setInvitation)
      .catch(err => setError(err.message || 'Invitation not found or has expired.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');

    if (password.length < 12) {
      setFormError('Password must be at least 12 characters long.');
      return;
    }
    if (passwordStrength < 4) {
      setFormError('Password must contain uppercase, lowercase, numbers and symbols.');
      return;
    }
    if (password !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch('/auth/invite/accept', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      setSuccess(true);
    } catch (err: any) {
      setFormError(err.message || 'Failed to accept invitation.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center space-y-3">
        <Loader2 className="animate-spin mx-auto text-forest-700" size={36} />
        <p className="text-xs font-bold text-warm-400 uppercase tracking-wider">Checking invitation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="mx-auto w-16 h-16 bg-danger-50 text-danger-600 rounded-2xl flex items-center justify-center">
          <ShieldAlert size={36} />
        </div>
        <div className="space-y-2">
          <h2 className="font-sans text-xl font-semibold text-charcoal-900 tracking-tight">Invitation unavailable</h2>
          <p className="text-xs font-medium text-warm-500 max-w-xs mx-auto">{error}</p>
        </div>
        <Link href="/login" className="block w-full py-3 bg-charcoal-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wide hover:bg-charcoal-950 transition-colors">
          Return to Sign In
        </Link>
      </div>
    );
  }

  if (success) {
    return (
      <div className="text-center space-y-6 animate-in zoom-in-95 duration-500 py-4">
        <div className="mx-auto w-20 h-20 bg-sage-50 text-forest-600 rounded-3xl flex items-center justify-center shadow-inner">
          <CheckCircle size={44} />
        </div>
        <div className="space-y-2">
          <h2 className="font-sans text-2xl font-semibold text-charcoal-900 tracking-tight">Welcome to {invitation?.school?.name}</h2>
          <p className="text-sm font-medium text-warm-500 leading-relaxed">
            Your account is ready and linked to this school workspace.
          </p>
        </div>
        <Link href="/login" className="block w-full py-3.5 bg-forest-700 text-white rounded-2xl font-semibold text-xs uppercase tracking-wide hover:bg-forest-800 shadow-lg shadow-forest-700/20 transition-colors">
          Sign in to workspace
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 bg-sage-50 text-forest-800 border border-sage-200 px-3 py-1 rounded-full text-xs font-bold mb-1">
          <Building2 size={14} />
          <span>{invitation?.school?.name}</span>
        </div>
        <h2 className="font-sans text-2xl font-semibold text-charcoal-900 tracking-tight">Join your school</h2>
        <p className="text-xs text-warm-500 font-medium">
          You've been invited as a <span className="font-bold text-forest-700 uppercase">{invitation?.role?.name}</span>.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError && (
          <Alert type="error" title="Could not join workspace">
            {formError}
          </Alert>
        )}

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold text-warm-400 uppercase tracking-wide ml-1">Email address</label>
          <input
            disabled
            className="w-full px-4 py-3 bg-warm-100 border border-warm-200 rounded-2xl text-warm-600 font-mono font-bold text-xs"
            value={invitation?.email || ''}
          />
        </div>

        <Input
          label="Create a password *"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder="Enter a strong password"
          leftIcon={<Lock size={18} />}
          rightIcon={
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-warm-400 hover:text-warm-600">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        <Input
          label="Confirm Password *"
          type={showConfirmPassword ? 'text' : 'password'}
          required
          placeholder="Enter a strong password"
          leftIcon={<Lock size={18} />}
          rightIcon={
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="text-warm-400 hover:text-warm-600">
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
        />

        {/* Strength meter */}
        <div className="bg-ivory-50 border border-warm-200/80 rounded-2xl p-4 space-y-2">
           <div className="flex justify-between items-center text-xs font-bold">
             <span className="text-warm-400 uppercase tracking-wider text-[11px]">Password Strength</span>
             <span className={`uppercase font-semibold ${
               passwordStrength <= 1 ? 'text-danger-500' :
               passwordStrength === 2 ? 'text-warning-500' :
               passwordStrength === 3 ? 'text-terracotta-600' : 'text-forest-600'
             }`}>
               {passwordStrength <= 1 ? 'Weak' : passwordStrength === 2 ? 'Moderate' : passwordStrength === 3 ? 'Strong' : 'Exceptional'}
             </span>
           </div>
           <div className="flex gap-1.5 h-1.5">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className={`flex-1 rounded-full transition-all duration-300 ${
                  passwordStrength >= i
                    ? (passwordStrength <= 1 ? 'bg-danger-500' : passwordStrength === 2 ? 'bg-warning-500' : passwordStrength === 3 ? 'bg-terracotta-600' : 'bg-forest-500')
                    : 'bg-warm-200'
                }`} />
              ))}
           </div>
        </div>

        <Button
          type="submit"
          isLoading={submitting}
          variant="primary"
          size="lg"
          className="w-full rounded-2xl uppercase tracking-wide text-xs font-semibold shadow-lg shadow-forest-700/20 py-3.5 bg-forest-700 hover:bg-forest-800 text-white"
          rightIcon={<ArrowRight size={18} />}
          disabled={submitting}
        >
          Join workspace
        </Button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="text-center p-12"><Loader2 className="animate-spin mx-auto text-forest-600" size={36} /></div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
