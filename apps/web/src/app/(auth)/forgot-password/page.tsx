'use client';

import React, { useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Mail, ArrowRight, ArrowLeft, CheckCircle, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your institutional email address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await apiFetch('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      });
      setSuccess(true);
      toast.success('Reset link sent');
    } catch (err: any) {
      setError(err.message || 'Unable to dispatch recovery link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="text-center space-y-8 animate-in zoom-in-95 duration-500 py-4">
        <div className="mx-auto w-20 h-20 bg-sage-50 text-forest-600 border border-sage-200 rounded-3xl flex items-center justify-center shadow-inner">
          <CheckCircle size={44} />
        </div>
        <div className="space-y-3">
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-charcoal-900">Check your inbox</h2>
          <p className="text-sm font-medium text-warm-500 leading-relaxed px-2">
            If an account exists for <span className="font-bold text-charcoal-900">{email}</span>, a password reset link is on its way.
          </p>
        </div>
        <div className="pt-2 border-t border-warm-100">
          <Button
            variant="outline"
            size="lg"
            className="w-full rounded-2xl font-bold uppercase tracking-wider text-xs"
            onClick={() => window.location.href = '/login'}
          >
             Return to Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="font-sans text-2xl font-semibold tracking-tight text-charcoal-900">Reset your password</h2>
        <p className="text-xs sm:text-sm font-medium text-warm-500">Enter the email linked to your SchooMA account and we&apos;ll send you a reset link.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {error && (
          <Alert type="error" title="Recovery Request Failed">
            {error}
          </Alert>
        )}

        <Input
          label="Work email *"
          type="email"
          required
          autoComplete="email"
          placeholder="name@school.edu"
          leftIcon={<Mail size={18} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <Button
          type="submit"
          isLoading={loading}
          variant="primary"
          size="lg"
          className="w-full rounded-2xl uppercase tracking-wide text-xs font-semibold shadow-lg shadow-forest-700/20 py-3.5 bg-forest-700 hover:bg-forest-800 text-white"
          rightIcon={<ArrowRight size={18} />}
          disabled={loading}
        >
          Send reset link
        </Button>
      </form>

      <div className="pt-4 text-center border-t border-warm-100">
        <Link href="/login" className="text-xs font-semibold text-warm-400 hover:text-charcoal-900 transition-colors uppercase tracking-wide inline-flex items-center gap-2">
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </div>
    </div>
  );
}
