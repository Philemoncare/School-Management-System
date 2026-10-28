'use client';

import React, { useEffect, useState } from 'react';
import { useAuth, getRoleLanding } from '@/context/auth-context';
import {
  Mail,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import Link from 'next/link';
import { apiFetch } from '@/lib/api/client';
import { toast } from 'sonner';
import { OtpCodeInput } from '@/components/auth/otp-code-input';
import { useOtpTimer } from '@/components/auth/use-otp-timer';

type LoginChallenge = {
  token: string;
  email: string;
  codeLength: number;
  emailDelivery: 'sent' | 'pending' | 'failed';
};

export default function LoginPage() {
  const { login, user, activeSchoolId } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [challenge, setChallenge] = useState<LoginChallenge | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resending, setResending] = useState(false);
  const otpTimer = useOtpTimer();

  // The middleware no longer redirects signed-in users away from /login (it
  // cannot verify the cookie). Do it here, once /auth/me has proven the
  // session is valid.
  useEffect(() => {
    if (user && !challenge) {
      window.location.href = getRoleLanding(user, activeSchoolId);
    }
  }, [user, activeSchoolId, challenge]);

  function completeSignIn(data: any) {
    localStorage.setItem('token', data.access_token);

    const memberships = data.user?.memberships || [];
    const schoolId = memberships.length === 1 ? memberships[0].schoolId : null;

    if (schoolId) {
      localStorage.setItem('schoolId', schoolId);
    }

    window.location.href =
      memberships.length > 1
        ? '/select-school'
        : getRoleLanding(data.user, schoolId);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setVerificationRequired(false);
    setOtpError('');

    try {
      if (challenge) {
        if (otpCode.length !== challenge.codeLength) {
          setOtpError(`Enter the ${challenge.codeLength}-digit code from your email.`);
          return;
        }

        const data = await apiFetch('/auth/login/otp', {
          method: 'POST',
          body: JSON.stringify({ otpToken: challenge.token, code: otpCode }),
        });

        if (data.access_token) {
          completeSignIn(data);
        }
      } else {
        const result = await login(email, password);
        if (result?.otpRequired) {
          setChallenge({
            token: result.otp_token,
            email: result.email,
            codeLength: result.codeLength || 5,
            emailDelivery: result.emailDelivery || 'sent',
          });
          setOtpCode('');
          otpTimer.reset();
          toast.success('We sent a 5-digit sign-in code to your email.');
        }
      }
    } catch (err: any) {
      const message =
        err.message || 'We could not sign you in. Check your details and try again.';
      if (challenge) {
        setOtpError(message);
      } else {
        setError(message);
        setVerificationRequired(
          err?.code === 'EMAIL_VERIFICATION_REQUIRED' ||
            /verify your email/i.test(message),
        );
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function resendCode() {
    if (!challenge || resending) return;
    setResending(true);
    setOtpError('');
    try {
      const data = await apiFetch('/auth/login/resend', {
        method: 'POST',
        body: JSON.stringify({ otpToken: challenge.token }),
      });
      setChallenge({
        token: data.otp_token,
        email: data.email,
        codeLength: data.codeLength || 5,
        emailDelivery: data.emailDelivery || 'sent',
      });
      setOtpCode('');
      otpTimer.reset();
      toast.success('A new sign-in code has been sent.');
    } catch (err: any) {
      setOtpError(err.message || 'We could not resend the code. Please try again.');
    } finally {
      setResending(false);
    }
  }

  if (challenge) {
    return (
      <div className="w-full space-y-5 animate-in fade-in duration-300">
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">
            Email verification
          </p>
          <h2 className="text-2xl font-semibold leading-tight text-charcoal-950">
            Enter the code sent to your email
          </h2>
          <p className="text-xs leading-relaxed text-warm-600">
            We sent a fresh 5-digit sign-in code to{' '}
            <span className="font-semibold text-charcoal-900">{challenge.email}</span>. It
            expires in 5 minutes.
          </p>
        </div>

        {challenge.emailDelivery !== 'sent' && (
          <Alert
            type={challenge.emailDelivery === 'failed' ? 'warning' : 'info'}
            title={
              challenge.emailDelivery === 'failed'
                ? 'Code delivery was not confirmed'
                : 'Your code is on the way'
            }
          >
            {challenge.emailDelivery === 'failed'
              ? 'Request a new code below. If it still does not arrive, check your spam folder or contact support.'
              : 'Give it a moment, then request a new code if it does not arrive.'}
          </Alert>
        )}

        <form className="space-y-5" onSubmit={handleSubmit}>
          <OtpCodeInput
            value={otpCode}
            onChange={(value) => {
              setOtpCode(value);
              setOtpError('');
            }}
            length={challenge.codeLength}
            disabled={isLoading}
            autoFocus
            error={otpError}
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
              onClick={resendCode}
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
            isLoading={isLoading}
            variant="primary"
            size="lg"
            className="w-full"
            disabled={otpTimer.expired}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Verify and sign in
          </Button>

          <button
            type="button"
            onClick={() => {
              setChallenge(null);
              setOtpCode('');
              setOtpError('');
              setPassword('');
            }}
            className="w-full py-2 text-[11px] font-bold uppercase tracking-wide text-warm-500 transition-colors hover:text-forest-800"
          >
            Use a different account
          </button>
        </form>

        <p className="text-center text-[11px] font-medium text-warm-500">
          Every sign-in requires your password and a single-use email code.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-500">
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">
          Sign in
        </p>
        <h2 className="text-2xl font-semibold leading-tight tracking-tight text-charcoal-950">
          Welcome back
        </h2>
        <p className="text-xs leading-relaxed text-warm-600">
          Enter your password, then confirm the 5-digit code we email you.
        </p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        {error && (
          <Alert
            type={verificationRequired ? 'warning' : 'error'}
            title={verificationRequired ? 'Verify your email first' : 'Unable to sign in'}
          >
            <div className="space-y-2">
              <p>{error}</p>
              {verificationRequired && (
                <Link
                  href={`/verify-email?email=${encodeURIComponent(email.trim().toLowerCase())}`}
                  className="inline-flex items-center gap-1.5 font-bold text-forest-800 underline decoration-forest-300 underline-offset-2 hover:text-forest-950"
                >
                  Open email verification
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </Alert>
        )}

        <Input
          label="Email address"
          type="email"
          required
          autoComplete="email"
          placeholder="name@school.edu.gh"
          leftIcon={<Mail className="w-4 h-4 text-warm-400" />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="space-y-1">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            required
            autoComplete="current-password"
            placeholder="Enter your password"
            leftIcon={<Lock className="w-4 h-4 text-warm-400" />}
            rightIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg p-1.5 text-warm-400 transition-colors hover:text-warm-700"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex justify-end px-0.5 pt-0.5">
            <Link
              href="/forgot-password"
              className="py-1 text-[11px] font-bold uppercase tracking-wide text-warm-500 transition-colors hover:text-forest-700"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={isLoading}
          variant="primary"
          size="lg"
          className="w-full"
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          Continue with email code
        </Button>
      </form>

      <div className="rounded-lg border border-warm-200 bg-ivory-100 px-4 py-3 text-center">
        <p className="text-[11px] text-warm-600">
          Setting up a new school?{' '}
          <Link
            href="/register-school"
            className="font-semibold text-forest-800 underline decoration-warm-300 underline-offset-2 hover:text-forest-950"
          >
            Create a workspace
          </Link>
        </p>
      </div>

      <p className="pt-1 text-center text-[11px] font-medium leading-relaxed text-warm-500">
        Sessions are encrypted and school records remain isolated.
      </p>
    </div>
  );
}
