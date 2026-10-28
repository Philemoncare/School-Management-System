'use client';

import React, { useState, Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { Lock, ArrowRight, CheckCircle, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { toast } from 'sonner';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      setError('This reset link is missing its token.');
      return;
    }
    if (password.length < 12) {
      setError('Password must be at least 12 characters long.');
      return;
    }
    if (passwordStrength < 4) {
      setError('Password must include uppercase, lowercase, numbers and special characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiFetch('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
      });
      setSuccess(true);
      toast.success('Password updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update credentials. Reset link may be expired.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-8 animate-in zoom-in-95 duration-500 py-4">
        <div className="mx-auto w-20 h-20 bg-sage-50 text-forest-600 rounded-3xl flex items-center justify-center shadow-inner">
          <CheckCircle size={44} />
        </div>
        <div className="space-y-3">
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-charcoal-900">Password updated</h2>
          <p className="text-sm font-medium text-warm-500 leading-relaxed px-2">
            Your security credentials have been updated successfully. You can now log in with your new password.
          </p>
        </div>
        <div className="pt-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full rounded-2xl uppercase tracking-wide text-xs font-semibold shadow-xs shadow-sage-100"
            onClick={() => window.location.href = '/login'}
          >
             Sign In with New Password
          </Button>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="text-center space-y-6 py-4">
        <div className="mx-auto w-16 h-16 bg-danger-50 text-danger-600 rounded-2xl flex items-center justify-center">
          <ShieldAlert size={32} />
        </div>
        <div className="space-y-2">
          <h2 className="font-sans text-xl font-semibold text-charcoal-900">Reset link unavailable</h2>
          <p className="text-xs text-warm-500">This link is missing a valid reset token.</p>
        </div>
        <Link href="/forgot-password" className="block w-full py-3 bg-charcoal-900 text-white rounded-2xl font-bold text-xs uppercase tracking-wider">
          Request New Reset Link
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="font-sans text-2xl font-semibold tracking-tight text-charcoal-900">Choose a new password</h2>
        <p className="text-xs sm:text-sm font-medium text-warm-500">Use at least 12 characters with uppercase, lowercase, a number and a symbol.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <Alert type="error" title="Reset Failed">
            {error}
          </Alert>
        )}

        <Input
          label="New Password *"
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
          onChange={(e) => setPassword(e.target.value)}
        />

        <Input
          label="Confirm New Password *"
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
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {/* Entropy Meter */}
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
          isLoading={loading}
          variant="primary"
          size="lg"
          className="w-full rounded-2xl uppercase tracking-wide text-xs font-semibold shadow-lg shadow-forest-700/20 py-3.5 bg-forest-700 hover:bg-forest-800 text-white"
          rightIcon={<ArrowRight size={18} />}
          disabled={loading}
        >
          Update password
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-center p-12"><div className="w-10 h-10 border-4 border-forest-600 border-t-transparent rounded-full animate-spin mx-auto" /></div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}
