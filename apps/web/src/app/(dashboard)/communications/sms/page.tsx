'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { ArrowLeft, Smartphone, Send, Loader2, Users, AlertCircle } from 'lucide-react';

export default function SmsPage() {
  const { activeSchoolId } = useAuth();
  const roles = collectUserRoles(undefined, activeSchoolId);
  const canManage = roles.some((role) =>
    ['SCHOOL_ADMIN', 'PRINCIPAL', 'RECEPTIONIST'].includes(role),
  );

  if (!canManage) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 py-12 text-center">
        <h1 className="text-xl font-bold text-charcoal-900">Not available for your role</h1>
        <p className="text-sm text-warm-500">
          Only school administrators, principals, and receptionists can send SMS messages.
        </p>
        <Link href="/communications/delivery" className="text-sm font-semibold text-forest-700 underline">
          <ArrowLeft size={16} /> View message history
        </Link>
      </div>
    );
  }

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [smsConfigured, setSmsConfigured] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    recipientType: 'INDIVIDUAL', // INDIVIDUAL | GROUP
    recipient: '', // phone number or group name
    message: '',
  });

  // GSM-7 vs UCS-2 segment accounting so the character count, segment count
  // and estimated credit cost match what the backend will charge.
  const GSM7_ALLOWED =
    "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà|^€{}[]~\\";
  const isGsm7 = [...form.message].every((ch) => GSM7_ALLOWED.includes(ch));
  const charLimit = isGsm7 ? 160 : 70;
  const multiLimit = isGsm7 ? 153 : 67;
  const len = form.message.length;
  const segments = len === 0 ? 0 : len <= charLimit ? 1 : Math.ceil(len / multiLimit);

  useEffect(() => {
    // Check SMS configuration status
    apiFetch('/integrations/status?service=SMS')
      .then((data: any) => {
        setSmsConfigured(data?.data?.configured ?? false);
      })
      .catch(() => {
        setSmsConfigured(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!form.recipient.trim()) {
      setError('Please enter a recipient phone number.');
      return;
    }
    if (!form.message.trim()) {
      setError('Please enter a message.');
      return;
    }

    // Validate phone number format
    const phoneRegex = /^\+?[\d\s\-()]{7,}$/;
    if (!phoneRegex.test(form.recipient.trim())) {
      setError('Please enter a valid phone number.');
      return;
    }

    setSending(true);
    try {
      await apiFetch('/communications/send-direct', {
        method: 'POST',
        body: JSON.stringify({
          to: form.recipient.trim(),
          channel: 'SMS',
          content: form.message.trim(),
          recipientName: form.recipientType === 'INDIVIDUAL' ? 'Recipient' : undefined,
        }),
      });
      setSuccess('SMS accepted and queued. Its status (sent → delivered) is tracked in Message History.');
      setForm({ ...form, message: '' });
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.isServiceUnconfigured()) {
          setError('SMS service is not configured. Please ask your administrator to set up SMS provider credentials.');
        } else if (err.isPermissionDenied()) {
          setError('You do not have permission to send SMS messages.');
        } else if (err.isServiceUnavailable()) {
          setError('SMS service is temporarily unavailable. Please try again later.');
        } else {
          setError(err.message || 'Failed to send SMS message.');
        }
      } else {
        setError('Failed to send SMS message. Please check your connection and try again.');
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-charcoal-900 sm:text-3xl">
            <Smartphone className="mr-2 h-5 w-5 text-forest-700" />
            SMS Messages
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Send SMS messages to guardians, staff, or other contacts. Messages are handed to your
            school&rsquo;s configured SMS provider; delivery is confirmed only when the provider
            reports it back.
          </p>
        </div>
        <Link
          href="/communications/delivery"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-ivory-50 shadow-xs transition-colors hover:bg-forest-900 sm:w-auto"
        >
          <ArrowLeft size={16} />
          View message history
        </Link>
      </div>

      {smsConfigured === false && (
        <Alert type="warning" title="SMS service not configured">
          SMS messaging is not yet configured for this school. An administrator needs to set up
          SMS provider credentials (Twilio, Arkesel, or Hubtel) before messages can be sent.
          You can still draft messages, but they will not be delivered until configuration is complete.
        </Alert>
      )}

      <div className="rounded-xl border border-warm-200 bg-card p-6 shadow-xs">
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-warm-600 uppercase tracking-wide">
                  Recipient type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, recipientType: 'INDIVIDUAL', recipient: '' })}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      form.recipientType === 'INDIVIDUAL'
                        ? 'border-forest-700 bg-forest-50 text-forest-700'
                        : 'border-warm-200 bg-card text-warm-600 hover:border-sage-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Individual</span>
                    <Users size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, recipientType: 'GROUP', recipient: '' })}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                      form.recipientType === 'GROUP'
                        ? 'border-forest-700 bg-forest-50 text-forest-700'
                        : 'border-warm-200 bg-card text-warm-600 hover:border-sage-200'
                    }`}
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-wide">Group</span>
                    <Smartphone size={12} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-warm-600 uppercase tracking-wide">
                  Phone number *
                </label>
                <Input
                  type="tel"
                  placeholder="+233 20 000 0000"
                  value={form.recipient}
                  onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                  leftIcon={<Smartphone size={16} />}
                  helperText="Enter the recipient&rsquo;s phone number with country code."
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-600 uppercase tracking-wide">
                Message *
              </label>
              <textarea
                rows={4}
                placeholder="Type your SMS message here…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-none rounded-xl border border-warm-300 bg-card px-4 py-3 text-sm text-charcoal-900 outline-none transition-colors focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/15"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-warm-500">
                  {isGsm7 ? 'Standard text (GSM-7)' : 'Special characters (Unicode) — smaller limit'}
                </span>
                <span className="text-[10px] text-warm-400">
                  {len} characters · {segments} SMS segment{segments === 1 ? '' : 's'} ·{' '}
                  ~{segments} credit{segments === 1 ? '' : 's'}
                </span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                isLoading={sending}
                disabled={sending || !form.recipient.trim() || !form.message.trim()}
                leftIcon={<Send size={16} />}
                className="w-full sm:w-auto"
              >
                {sending ? 'Sending…' : 'Send SMS'}
              </Button>
            </div>
          </form>

          {success && (
            <Alert type="success" title="SMS queued for delivery">
              {success}
            </Alert>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-warm-200 bg-card p-6 shadow-xs">
        <h3 className="text-sm font-bold text-charcoal-900 mb-4">What happens after you send</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-warm-100 bg-ivory-50 p-4">
            <span className="text-warm-400 text-xs font-bold uppercase">Queued</span>
            <p className="mt-1 text-xs text-warm-600">
              Your message is accepted and waiting to be sent.
            </p>
          </div>
          <div className="rounded-lg border border-warm-100 bg-ivory-50 p-4">
            <span className="text-forest-600 text-xs font-bold uppercase">Sent</span>
            <p className="mt-1 text-xs text-warm-600">
              The message has been handed to the SMS provider.
            </p>
          </div>
          <div className="rounded-lg border border-warm-100 bg-ivory-50 p-4">
            <span className="text-emerald-600 text-xs font-bold uppercase">Delivered</span>
            <p className="mt-1 text-xs text-warm-600">
              The provider has reported back that the message reached the recipient. This is only
              shown once a delivery receipt is received — it is never assumed from a successful send.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}