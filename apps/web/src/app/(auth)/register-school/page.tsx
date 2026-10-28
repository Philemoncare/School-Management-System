'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ShieldCheck,
  User,
} from 'lucide-react';
import { apiFetch, ApiError } from '@/lib/api/client';
import { Input, Select } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { OtpCodeInput } from '@/components/auth/otp-code-input';
import { useOtpTimer } from '@/components/auth/use-otp-timer';

const SCHOOL_TYPES = [
  'Basic School (Primary & JHS)',
  'Primary School Only',
  'Junior High School (JHS)',
  'Senior High School (SHS)',
  'TVET / Technical & Vocational',
  'Nursery / Preschool / Kindergarten',
  'International / Private School',
];

const STEP_META = [
  { title: 'School details', caption: 'Tell us about the school' },
  { title: 'Administrator', caption: 'Create the first admin account' },
  { title: 'Review', caption: 'Confirm and create the workspace' },
];

type FormState = {
  school: {
    name: string;
    type: string;
    country: string;
    region: string;
    city: string;
    district: string;
    address: string;
    phone: string;
    email: string;
  };
  admin: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  consentToTerms: boolean;
};

type RegistrationResult = {
  success: true;
  message: string;
  requiresVerification: boolean;
  emailSent: boolean;
  emailDelivery: 'sent' | 'pending' | 'failed' | 'skipped';
  verificationCodeLength: number;
  verificationExpiresInSeconds: number;
  school: {
    id: string;
    name: string;
    code: string;
    slug: string;
    email: string;
    status: string;
  };
  administrator: {
    id: string;
    fullName: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'SCHOOL_ADMIN';
    accountState: string;
  };
};

const INITIAL_FORM: FormState = {
  school: {
    name: '',
    type: 'Basic School (Primary & JHS)',
    country: 'Ghana',
    region: '',
    city: '',
    district: '',
    address: '',
    phone: '',
    email: '',
  },
  admin: {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  consentToTerms: false,
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^a-zA-Z\d]/.test(password)) score += 1;
  return score;
}

function passwordProblem(password: string) {
  if (password.length < 12) return 'Use at least 12 characters.';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) {
    return 'Include both uppercase and lowercase letters.';
  }
  if (!/\d/.test(password)) return 'Include at least one number.';
  if (!/[^a-zA-Z\d]/.test(password)) return 'Include at least one special character.';
  return '';
}

export default function RegisterSchoolPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showContactDetails, setShowContactDetails] = useState(false);
  const [result, setResult] = useState<RegistrationResult | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);
  const otpTimer = useOtpTimer();

  const score = useMemo(() => passwordScore(form.admin.password), [form.admin.password]);
  const progress = Math.round((step / STEP_META.length) * 100);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [step, result]);

  const updateSchool = (field: keyof FormState['school'], value: string) => {
    setForm((current) => ({
      ...current,
      school: { ...current.school, [field]: value },
    }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setApiError('');
  };

  const updateAdmin = (field: keyof FormState['admin'], value: string) => {
    setForm((current) => ({
      ...current,
      admin: { ...current.admin, [field]: value },
    }));
    setErrors((current) => ({ ...current, [field]: '' }));
    setApiError('');
  };

  const validateSchool = () => {
    const next: Record<string, string> = {};
    if (!form.school.name.trim()) next.name = 'Enter the school name.';
    if (!form.school.type) next.type = 'Select a school type.';
    if (!form.school.country.trim()) next.country = 'Enter the country.';
    if (!form.school.region.trim()) next.region = 'Enter the region or state.';
    if (!form.school.city.trim()) next.city = 'Enter the town or district.';
    if (form.school.email.trim() && !EMAIL_PATTERN.test(form.school.email.trim())) {
      next.email = 'Enter a valid school email address.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateAdmin = () => {
    const next: Record<string, string> = {};
    if (!form.admin.fullName.trim()) next.fullName = 'Enter the administrator full name.';
    if (!EMAIL_PATTERN.test(form.admin.email.trim())) {
      next.adminEmail = 'Enter a valid email address.';
    }
    const problem = passwordProblem(form.admin.password);
    if (problem) next.password = problem;
    if (!form.admin.confirmPassword) {
      next.confirmPassword = 'Confirm the administrator password.';
    } else if (form.admin.password !== form.admin.confirmPassword) {
      next.confirmPassword = 'Passwords do not match.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const goNext = () => {
    if (step === 1 && !validateSchool()) return;
    if (step === 2 && !validateAdmin()) return;
    setApiError('');
    setStep((current) => Math.min(3, current + 1));
  };

  const goBack = () => {
    setApiError('');
    setStep((current) => Math.max(1, current - 1));
  };

  const showApiError = (message: string) => {
    setApiError(message);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const submit = async () => {
    if (loading) return;
    if (!validateSchool() || !validateAdmin()) {
      setStep(1);
      return;
    }
    if (!form.consentToTerms) {
      showApiError('Accept the Terms of Service and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      const response = await apiFetch('/auth/school/register', {
        method: 'POST',
        body: JSON.stringify({
          school: {
            name: form.school.name.trim(),
            type: form.school.type,
            country: form.school.country.trim(),
            region: form.school.region.trim(),
            city: form.school.city.trim(),
            district: form.school.district.trim() || undefined,
            address: form.school.address.trim() || undefined,
            phone: form.school.phone.trim() || undefined,
            email: form.school.email.trim() || undefined,
          },
          admin: {
            fullName: form.admin.fullName.trim().replace(/\s+/g, ' '),
            email: form.admin.email.trim().toLowerCase(),
            password: form.admin.password,
          },
          consentToTerms: true,
        }),
      });

      setResult(response as RegistrationResult);
      setVerificationCode('');
      setVerificationError('');
      setVerified(false);
      otpTimer.reset();
    } catch (error) {
      if (error instanceof ApiError) {
        showApiError(error.message);
        if (error.status === 409) {
          setStep(2);
        }
      } else {
        showApiError('We could not create the school workspace. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!result || verifying) return;
    if (verificationCode.length !== result.verificationCodeLength) {
      setVerificationError(`Enter the ${result.verificationCodeLength}-digit code from your email.`);
      return;
    }

    setVerifying(true);
    setVerificationError('');
    try {
      await apiFetch('/auth/verify-email', {
        method: 'POST',
        body: JSON.stringify({
          email: result.administrator.email,
          code: verificationCode,
        }),
      });
      setVerified(true);
    } catch (error) {
      setVerificationError(
        error instanceof ApiError
          ? error.message
          : 'We could not verify that code. Please try again.',
      );
    } finally {
      setVerifying(false);
    }
  };

  const resendCode = async () => {
    if (!result || resending) return;
    setResending(true);
    setVerificationError('');
    try {
      await apiFetch('/auth/resend-verification', {
        method: 'POST',
        body: JSON.stringify({ email: result.administrator.email }),
      });
      setVerificationCode('');
      otpTimer.reset();
    } catch (error) {
      setVerificationError(
        error instanceof ApiError
          ? error.message
          : 'We could not resend the code. Please try again.',
      );
    } finally {
      setResending(false);
    }
  };

  if (result) {
    const needsCode = result.requiresVerification && !verified;

    return (
      <div className="space-y-6">
        {needsCode ? (
          <>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-lg border border-sage-300 bg-sage-100 text-forest-800 shadow-xs">
                <KeyRound className="h-7 w-7" />
              </span>
              <p className="mt-5 text-[11px] font-bold uppercase tracking-wide text-terracotta-600">
                One last step
              </p>
              <h1 className="mt-1.5 font-sans text-3xl tracking-[-0.02em] text-forest-900">
                Enter your 5-digit code
              </h1>
              <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-warm-600">
                We sent a short code to{' '}
                <span className="font-bold text-charcoal-900">{result.administrator.email}</span>.
                Enter it below to verify the administrator and finish setup.
              </p>
            </div>

            {result.emailDelivery !== 'sent' && (
              <Alert
                type={result.emailDelivery === 'failed' ? 'warning' : 'info'}
                title={
                  result.emailDelivery === 'pending'
                    ? 'Your code is on the way'
                    : 'We could not confirm email delivery'
                }
              >
                {result.emailDelivery === 'pending'
                  ? 'The code is still being sent. Give it a moment, then request a new code if it does not arrive.'
                  : 'Request a new code below. If delivery keeps failing, contact support.'}
              </Alert>
            )}

            <div className="rounded-2xl border border-warm-200 bg-ivory-100 p-5 sm:p-6">
              <div className="mb-5 flex items-center justify-between gap-3 rounded-xl border border-warm-200 bg-card px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
                    Code sent to
                  </p>
                  <p className="truncate text-sm font-bold text-charcoal-900">
                    {result.administrator.email}
                  </p>
                </div>
                <Mail className="h-4 w-4 shrink-0 text-forest-700" />
              </div>

              <OtpCodeInput
                value={verificationCode}
                onChange={(value) => {
                  setVerificationCode(value);
                  setVerificationError('');
                }}
                length={result.verificationCodeLength || 5}
                disabled={verifying}
                autoFocus
                error={verificationError}
              />

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-warm-200 pt-4">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wide ${
                    otpTimer.expired ? 'text-danger-600' : 'text-warm-500'
                  }`}
                >
                  {otpTimer.expired
                    ? 'Code expired'
                    : `Expires in ${otpTimer.formattedExpiry}`}
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
            </div>

            <Button
              type="button"
              onClick={() => void verifyCode()}
              isLoading={verifying}
              size="lg"
              disabled={otpTimer.expired}
              className="w-full"
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Verify and finish
            </Button>

            <div className="flex items-start gap-3 rounded-xl border border-sage-200 bg-sage-50 p-3.5 text-left">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-forest-700" />
              <p className="text-[11px] font-medium leading-relaxed text-forest-900">
                The code is single-use and expires after 5 minutes. After verification, every
                sign-in also uses a fresh 5-digit email code.
              </p>
            </div>

            <div className="rounded-xl border border-warm-200 bg-ivory-100 px-4 py-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
                {result.school.name} · {result.school.code}
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="flex flex-col items-center text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-50 text-success-600">
                <CheckCircle2 className="h-7 w-7" />
              </span>
              <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-success-700">
                Registration submitted
              </p>
              <h1 className="mt-1.5 font-sans text-3xl tracking-[-0.02em] text-forest-900">
                Your workspace is pending review
              </h1>
              <p className="mt-2 max-w-md text-sm font-medium leading-relaxed text-warm-600">
                {result.administrator.email} is verified. Platform operations will review the
                school before activation. You can sign in meanwhile with your password and a
                fresh 5-digit code.
              </p>
            </div>

            <div className="rounded-2xl border border-warm-200 bg-ivory-100 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
                    School workspace
                  </p>
                  <p className="mt-1 font-sans text-xl text-forest-900">{result.school.name}</p>
                  <p className="mt-1 text-xs font-semibold text-warm-600">
                    Code {result.school.code} · {result.school.status.toLowerCase()}
                  </p>
                </div>
                <span className="rounded-full border border-sage-300 bg-sage-100 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-forest-800">
                  {result.administrator.role.replace('_', ' ')}
                </span>
              </div>
              <dl className="mt-5 grid gap-4 border-t border-warm-200 pt-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
                    Administrator
                  </dt>
                  <dd className="mt-1 font-semibold text-charcoal-900">
                    {result.administrator.fullName}
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
                    Sign-in email
                  </dt>
                  <dd className="mt-1 break-all font-semibold text-charcoal-900">
                    {result.administrator.email}
                  </dd>
                </div>
              </dl>
            </div>

            <Alert type="info" title="Verification complete">
              Your administrator email is verified. School activation is a separate platform
              review step, and every sign-in will ask for a fresh 5-digit email code.
            </Alert>

            <div className="flex flex-col gap-2.5 sm:flex-row">
              <Link href="/login" className="flex-1">
                <Button className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Go to sign in
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  Back to home
                </Button>
              </Link>
            </div>
          </>
        )}
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">
            Step {step} of {STEP_META.length}
          </p>
          <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-charcoal-950">
            {STEP_META[step - 1].title}
          </h1>
          <p className="mt-1.5 text-xs leading-relaxed text-warm-600">
            {STEP_META[step - 1].caption}
          </p>
          <p className="mt-2 text-[11px] font-medium text-warm-500">
            About 2 minutes · 5-digit email verification
          </p>
        </div>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-warm-200">
          <div
            className="h-full rounded-full bg-forest-700 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <ol className="mt-3 grid grid-cols-3 gap-2" aria-label="Registration progress">
          {STEP_META.map((item, index) => {
            const number = index + 1;
            const active = number === step;
            const complete = number < step;
            return (
              <li
                key={item.title}
                className={`flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide ${
                  active ? 'text-forest-800' : complete ? 'text-success-700' : 'text-warm-400'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                    complete
                      ? 'border-success-300 bg-success-50 text-success-700'
                      : active
                        ? 'border-forest-300 bg-sage-100 text-forest-800'
                        : 'border-warm-200 bg-warm-50 text-warm-400'
                  }`}
                >
                  {complete ? <CheckCircle2 className="h-3 w-3" /> : number}
                </span>
                <span className="hidden truncate sm:block">{item.title}</span>
              </li>
            );
          })}
        </ol>
      </div>

      {apiError && (
        <Alert type="error" title="Could not create the workspace">
          {apiError}
        </Alert>
      )}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (step < 3) {
            goNext();
          } else {
            void submit();
          }
        }}
        className="space-y-5"
      >
        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="School name"
              value={form.school.name}
              onChange={(event) => updateSchool('name', event.target.value)}
              placeholder="e.g. Accra Model Academy"
              leftIcon={<Building2 className="h-4 w-4" />}
              error={errors.name}
              autoComplete="organization"
            />

            <Select
              label="School type"
              value={form.school.type}
              onChange={(event) => updateSchool('type', event.target.value)}
              options={SCHOOL_TYPES.map((type) => ({ value: type, label: type }))}
              error={errors.type}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Country"
                value={form.school.country}
                onChange={(event) => updateSchool('country', event.target.value)}
                leftIcon={<Globe2 className="h-4 w-4" />}
                error={errors.country}
                autoComplete="country-name"
              />
              <Input
                label="Region / State"
                value={form.school.region}
                onChange={(event) => updateSchool('region', event.target.value)}
                placeholder="e.g. Greater Accra"
                leftIcon={<MapPin className="h-4 w-4" />}
                error={errors.region}
                autoComplete="address-level1"
              />
            </div>

            <Input
              label="Town / District"
              value={form.school.city}
              onChange={(event) => updateSchool('city', event.target.value)}
              placeholder="e.g. Accra"
              leftIcon={<MapPin className="h-4 w-4" />}
              error={errors.city}
              autoComplete="address-level2"
            />

            <button
              type="button"
              onClick={() => setShowContactDetails((current) => !current)}
              className="flex w-full items-center justify-between rounded-xl border border-dashed border-warm-300 bg-ivory-100 px-4 py-3 text-left transition-colors hover:border-forest-300 hover:bg-sage-50"
            >
              <span>
                <span className="block text-xs font-bold text-charcoal-900">
                  Add contact and address details
                </span>
                <span className="mt-0.5 block text-[11px] font-medium text-warm-500">
                  Optional, but helps your school profile look complete.
                </span>
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-warm-500 transition-transform ${
                  showContactDetails ? 'rotate-180' : ''
                }`}
              />
            </button>

            {showContactDetails && (
              <div className="space-y-4 rounded-lg border border-warm-200 bg-warm-50 p-4 animate-in fade-in slide-in-from-top-1 duration-200">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Locality (optional)"
                    value={form.school.district}
                    onChange={(event) => updateSchool('district', event.target.value)}
                    placeholder="e.g. Accra Metropolitan"
                  />
                  <Input
                    label="School phone (optional)"
                    value={form.school.phone}
                    onChange={(event) => updateSchool('phone', event.target.value)}
                    placeholder="+233 20 000 0000"
                    leftIcon={<Phone className="h-4 w-4" />}
                    autoComplete="tel"
                  />
                </div>

                <Input
                  label="Street address (optional)"
                  value={form.school.address}
                  onChange={(event) => updateSchool('address', event.target.value)}
                  placeholder="e.g. 12 Independence Avenue"
                  autoComplete="street-address"
                />

                <Input
                  label="School email (optional)"
                  type="email"
                  value={form.school.email}
                  onChange={(event) => updateSchool('email', event.target.value)}
                  placeholder="office@school.edu.gh"
                  leftIcon={<Mail className="h-4 w-4" />}
                  error={errors.email}
                  helperText="Used for school-wide notices, not for signing in."
                  autoComplete="email"
                />
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Alert type="info" title="This account becomes the school administrator">
              You will receive the `SCHOOL_ADMIN` role for this school only. Platform
              administration is never granted through public registration.
            </Alert>

            <Input
              label="Full name"
              value={form.admin.fullName}
              onChange={(event) => updateAdmin('fullName', event.target.value)}
              placeholder="e.g. Ama Mensah"
              leftIcon={<User className="h-4 w-4" />}
              error={errors.fullName}
              autoComplete="name"
            />

            <Input
              label="Email address"
              type="email"
              value={form.admin.email}
              onChange={(event) => updateAdmin('email', event.target.value)}
              placeholder="you@school.edu.gh"
              leftIcon={<Mail className="h-4 w-4" />}
              error={errors.adminEmail}
              autoComplete="email"
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={form.admin.password}
                onChange={(event) => updateAdmin('password', event.target.value)}
                placeholder="At least 12 characters"
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="rounded-md p-0.5 text-muted-foreground hover:text-forest-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                error={errors.password}
                autoComplete="new-password"
              />
              <div className="mt-2 flex items-center gap-2">
                <div className="flex flex-1 gap-1">
                  {[1, 2, 3, 4].map((level) => (
                    <span
                      key={level}
                      className={`h-1.5 flex-1 rounded-full ${
                        score >= level
                          ? score >= 4
                            ? 'bg-success-500'
                            : score >= 3
                              ? 'bg-warning-500'
                              : 'bg-danger-400'
                          : 'bg-warm-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="w-24 text-right text-[11px] font-bold uppercase tracking-wide text-warm-500">
                  {form.admin.password
                    ? score >= 4
                      ? 'Strong'
                      : score >= 3
                        ? 'Good'
                        : 'Weak'
                    : 'Required'}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                12+ characters with uppercase, lowercase, a number and a symbol.
              </p>
            </div>

            <Input
              label="Confirm password"
              type={showConfirm ? 'text' : 'password'}
              value={form.admin.confirmPassword}
              onChange={(event) => updateAdmin('confirmPassword', event.target.value)}
              placeholder="Repeat the password"
              leftIcon={<Lock className="h-4 w-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirm((current) => !current)}
                  className="rounded-md p-0.5 text-muted-foreground hover:text-forest-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30"
                  aria-label={showConfirm ? 'Hide password confirmation' : 'Show password confirmation'}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              }
              error={errors.confirmPassword}
              autoComplete="new-password"
            />
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-warm-200 bg-ivory-100 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-sans text-lg text-forest-900">
                  <Building2 className="h-4 w-4 text-forest-700" />
                  School
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-bold text-forest-800 underline decoration-warm-300 underline-offset-2 hover:text-terracotta-600"
                >
                  Edit
                </button>
              </div>
              <dl className="mt-3 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
                <Summary label="Name" value={form.school.name} />
                <Summary label="Type" value={form.school.type} />
                <Summary label="Country" value={form.school.country} />
                <Summary label="Region / State" value={form.school.region} />
                <Summary label="Town / District" value={form.school.city} />
                <Summary label="Locality" value={form.school.district || 'Not provided'} />
                <Summary label="Phone" value={form.school.phone || 'Not provided'} />
                <Summary label="School email" value={form.school.email || 'Not provided'} />
                <Summary
                  label="Address"
                  value={form.school.address || 'Not provided'}
                  className="sm:col-span-2"
                />
              </dl>
            </div>

            <div className="rounded-2xl border border-warm-200 bg-ivory-100 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 font-sans text-lg text-forest-900">
                  <User className="h-4 w-4 text-forest-700" />
                  Administrator
                </h2>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-bold text-forest-800 underline decoration-warm-300 underline-offset-2 hover:text-terracotta-600"
                >
                  Edit
                </button>
              </div>
              <dl className="mt-3 grid gap-x-5 gap-y-3 text-sm sm:grid-cols-2">
                <Summary label="Full name" value={form.admin.fullName} />
                <Summary label="Email" value={form.admin.email} />
                <Summary label="Role" value="School administrator" />
                <Summary label="Workspace" value="New school workspace" />
              </dl>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-warm-200 bg-card p-4 text-sm">
              <input
                type="checkbox"
                checked={form.consentToTerms}
                onChange={(event) => {
                  setForm((current) => ({
                    ...current,
                    consentToTerms: event.target.checked,
                  }));
                  setApiError('');
                }}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-warm-300 accent-forest-800"
              />
              <span className="text-xs font-medium leading-relaxed text-warm-700">
                I confirm these details are correct and accept SchooMA&apos;s{' '}
                <Link href="/terms" className="font-bold text-forest-800 underline underline-offset-2">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="font-bold text-forest-800 underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <Alert type="info" title="What happens next">
              We create the workspace, then email a 5-digit code to the administrator. The
              code expires in 5 minutes and is the only verification step.
            </Alert>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2.5 border-t border-warm-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          {step > 1 ? (
            <Button
              type="button"
              variant="ghost"
              onClick={goBack}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              disabled={loading}
            >
              Back
            </Button>
          ) : (
            <Link href="/login" className="text-xs font-bold text-forest-800 hover:text-terracotta-600">
              Already have an account? Sign in
            </Link>
          )}

          <Button
            type="button"
            onClick={() => {
              if (step < 3) {
                goNext();
              } else {
                void submit();
              }
            }}
            isLoading={loading}
            rightIcon={step < 3 ? <ArrowRight className="h-4 w-4" /> : undefined}
            className="sm:min-w-40"
          >
            {step < 3 ? 'Continue' : loading ? 'Creating workspace' : 'Create workspace'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function Summary({
  label,
  value,
  className = '',
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
        {label}
      </dt>
      <dd className="mt-0.5 break-words font-semibold text-charcoal-900">{value}</dd>
    </div>
  );
}

