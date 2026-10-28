'use client';

import React, { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import {
  ArrowRight,
  CheckCircle,
  KeyRound,
  Mail,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { OtpCodeInput } from '@/components/auth/otp-code-input';
import { useOtpTimer } from '@/components/auth/use-otp-timer';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [notice, setNotice] = useState('');
  const otpTimer = useOtpTimer();

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    if (verifying) return;
    if (!email.trim()) {
      setError('Enter the email address you registered with.');
      return;
    }
    if (code.length !== 5) {
      setError('Enter the 5-digit code from your email.');
      return;
    }

    setVerifying(true);
    setError('');
    setNotice('');
    try {
      await apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'That code is invalid or has expired.');
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    if (!email.trim() || resending) return;
    setResending(true);
    setError('');
    setNotice('');
    try {
      await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      setCode('');
      otpTimer.reset();
      setNotice('A new 5-digit code is on its way. It expires in 5 minutes.');
    } catch (err: any) {
      setError(err.message || 'We could not resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-6 text-center animate-in fade-in duration-500">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-sage-200 bg-sage-50 text-forest-600 shadow-inner ring-8 ring-sage-50/50">
            <CheckCircle size={44} />
          </div>
        </div>

        <div className="space-y-3 px-2">
          <p className="text-[11px] font-bold uppercase tracking-wide text-success-700">
            Verified
          </p>
          <h2 className="font-sans text-2xl font-semibold tracking-tight text-charcoal-900">
            Your email is verified
          </h2>
          <p className="mx-auto max-w-sm text-sm font-medium leading-relaxed text-warm-500">
            Your administrator account is active. Sign in with your password and a fresh
            5-digit email code.
          </p>
        </div>

        <Link href="/login">
          <Button
            size="lg"
            className="w-full rounded-2xl text-xs font-semibold uppercase tracking-wide"
            rightIcon={<ArrowRight size={18} />}
          >
            Continue to sign in
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="space-y-2 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-sage-300 bg-sage-100 text-forest-700">
          <KeyRound size={26} />
        </div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-terracotta-600">
          Verify your email
        </p>
        <h2 className="font-sans text-2xl font-semibold tracking-tight text-charcoal-900">
          Enter your 5-digit code
        </h2>
        <p className="mx-auto max-w-sm text-sm font-medium leading-relaxed text-warm-500">
          Use the code from your SchooMA email. It expires in 5 minutes and can only be
          used once.
        </p>
      </div>

      {error && <Alert type="error">{error}</Alert>}
      {notice && <Alert type="success">{notice}</Alert>}

      <form onSubmit={handleVerify} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          required
          placeholder="admin@school.edu.gh"
          leftIcon={<Mail size={16} />}
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError('');
          }}
          autoComplete="email"
        />

        <OtpCodeInput
          value={code}
          onChange={(value) => {
            setCode(value);
            setError('');
          }}
          disabled={verifying}
          autoFocus={Boolean(email)}
          error=""
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <span
            className={`text-[11px] font-bold uppercase tracking-wide ${
              otpTimer.expired ? 'text-danger-600' : 'text-warm-500'
            }`}
          >
            {otpTimer.expired ? 'Code expired' : `Expires in ${otpTimer.formattedExpiry}`}
          </span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || !otpTimer.canResend}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-forest-800 transition-colors hover:text-terracotta-600 disabled:cursor-not-allowed disabled:text-warm-400"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${resending ? 'animate-spin' : ''}`} />
            {resending
              ? 'Sending'
              : otpTimer.canResend
                ? 'Send a new code'
                : `Resend in ${otpTimer.resendIn}s`}
          </button>
        </div>

        <Button
          type="submit"
          isLoading={verifying}
          size="lg"
          className="w-full rounded-2xl text-xs font-semibold uppercase tracking-wide"
          disabled={otpTimer.expired}
          rightIcon={<ArrowRight size={18} />}
        >
          Verify email
        </Button>
      </form>

      <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-warm-400">
        <ShieldCheck size={12} className="shrink-0 text-forest-600" />
        <span>Single-use code · expires in 5 minutes</span>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-forest-600 border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
