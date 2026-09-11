'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import { CheckCircle2, XCircle, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('Missing verification token.');
      return;
    }

    apiFetch('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token })
    })
    .then(() => setStatus('success'))
    .catch((err) => {
      setStatus('error');
      setError(err.message || 'Verification failed.');
    });
  }, [token]);

  return (
    <div className="text-center space-y-8 animate-in fade-in">
      <div className="flex justify-center">
        {status === 'verifying' && <Loader2 className="animate-spin text-blue-600" size={48} />}
        {status === 'success' && <CheckCircle2 className="text-green-600" size={48} />}
        {status === 'error' && <XCircle className="text-red-600" size={48} />}
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-black text-gray-900">
          {status === 'verifying' ? 'Verifying your email...' :
           status === 'success' ? 'Email Verified' : 'Verification Failed'}
        </h2>
        <p className="text-sm font-medium text-gray-500">
          {status === 'verifying' ? 'Please wait while we validate your credentials.' :
           status === 'success' ? 'Your account is now active. You can proceed to your workspace.' :
           error}
        </p>
      </div>

      {status !== 'verifying' && (
        <Link href="/login" className="block w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all">
          {status === 'success' ? 'Sign In' : 'Try Again'}
        </Link>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="text-center p-20"><Loader2 className="animate-spin mx-auto text-blue-600" size={48} /></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
