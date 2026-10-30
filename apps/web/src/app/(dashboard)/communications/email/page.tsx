'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { apiFetch, ApiError } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { collectUserRoles } from '@/lib/auth/roles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert } from '@/components/ui/alert';
import { ArrowLeft, Mail, Send, Loader2, Users, AlertCircle } from 'lucide-react';

export default function EmailPage() {
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
          Only school administrators, principals, and receptionists can send emails.
        </p>
        <Link href="/dashboard/communications/delivery" className="text-sm font-semibold text-forest-700 underline">
          <ArrowLeft size={16} /> View message history
        </Link>
      </div>
    );
  }

  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null);

  const [form, setForm] = useState({
    recipient: '',
    subject: '',
    message: '',
  });

  useEffect(() => {
    apiFetch('/integrations/status?service=EMAIL')
      .then((data: any) => {
        setEmailConfigured(data?.data?.configured ?? false);
      })
      .catch(() => {
        setEmailConfigured(false);
      });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(null);

    if (!form.recipient.trim()) {
      setError('Please enter a recipient email address.');
      return;
    }
    if (!form.subject.trim()) {
      setError('Please enter a subject line.');
      return;
    }
    if (!form.message.trim()) {
      setError('Please enter a message.');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.recipient.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      await apiFetch('/communications/send-direct', {
        method: 'POST',
        body: JSON.stringify({
          to: form.recipient.trim(),
          channel: 'EMAIL',
          subject: form.subject.trim(),
          content: form.message.trim(),
          recipientName: 'Recipient',
        }),
      });
      setSuccess('Email message queued for delivery. You can track its status in Message History.');
      setForm({ recipient: '', subject: '', message: '' });
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.isServiceUnconfigured()) {
          setError('Email service is not configured. Please ask your administrator to set up SMTP credentials.');
        } else if (err.isPermissionDenied()) {
          setError('You do not have permission to send email messages.');
        } else if (err.isServiceUnavailable()) {
          setError('Email service is temporarily unavailable. Please try again later.');
        } else {
          setError(err.message || 'Failed to send email message.');
        }
      } else {
        setError('Failed to send email message. Please check your connection and try again.');
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
            <Mail className="mr-2 h-5 w-5 text-forest-700" />
            Email Messages
          </h1>
          <p className="mt-0.5 text-xs font-medium text-warm-500 sm:text-sm">
            Send emails with subjects to guardians, staff, or other contacts. Messages are delivered
            through your school&rsquo;s configured email provider and delivery status is tracked.
          </p>
        </div>
        <Link
          href="/dashboard/communications/delivery"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-forest-800 px-4 py-2.5 text-sm font-semibold text-ivory-50 shadow-xs transition-colors hover:bg-forest-900 sm:w-auto"
        >
          <ArrowLeft size={16} />
          View message history
        </Link>
      </div>

      {emailConfigured === false && (
        <Alert type="warning" title="Email service not configured">
          Email messaging is not yet configured for this school. An administrator needs to set up
          SMTP credentials before messages can be sent. You can still draft messages, but they will
          not be delivered until configuration is complete.
        </Alert>
      )}

      <div className="rounded-xl border border-warm-200 bg-card p-6 shadow-xs">
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-600 uppercase tracking-wide">
                Recipient email *
              </label>
              <Input
                type="email"
                placeholder="guardian@school.edu.gh"
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
                leftIcon={<Mail size={16} />}
                helperText="Enter the recipient&rsquo;s email address."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-600 uppercase tracking-wide">
                Subject *
              </label>
              <Input
                type="text"
                placeholder="e.g. Term 2 fee reminder"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                leftIcon={<Users size={16} />}
                helperText="A clear subject helps recipients understand the message."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-semibold text-warm-600 uppercase tracking-wide">
                Message *
              </label>
              <textarea
                rows={6}
                placeholder="Type your email message here…"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-none rounded-xl border border-warm-300 bg-card px-4 py-3 text-sm text-charcoal-900 outline-none transition-colors focus-visible:border-forest-600 focus-visible:ring-2 focus-visible:ring-forest-600/15"
              />
              <div className="flex justify-end">
                <span className="text-[10px] text-warm-400">
                  {form.message.length} characters
                </span>
              </div>
            </div>

            <div className="pt-4">
              <Button
                type="submit"
                isLoading={sending}
                disabled={sending || !form.recipient.trim() || !form.subject.trim() || !form.message.trim()}
                leftIcon={<Send size={16} />}
                className="w-full sm:w-auto"
              >
                {sending ? 'Sending…' : 'Send Email'}
              </Button>
            </div>
          </form>

          {success && (
            <Alert type="success" title="Email queued for delivery">
              {success}
            </Alert>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-warm-200 bg-card p-6 shadow-xs">
        <h3 className="text-sm font-bold text-charcoal-900 mb-4">Best practices</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-warm-100 bg-ivory-50 p-4">
            <span className="text-warm-400 text-xs font-bold uppercase">Clear subject</span>
            <p className="mt-1 text-xs text-warm-600">
              Use a descriptive subject so recipients know what the email is about.
            </p>
          </div>
          <div className="rounded-lg border border-warm-100 bg-ivory-50 p-4">
            <span className="text-forest-600 text-xs font-bold uppercase">Keep it concise</span>
            <p className="mt-1 text-xs text-warm-600">
              Short, clear messages are easier to read on mobile devices.
            </p>
          </div>
          <div className="rounded-lg border border-warm-100 bg-ivory-50 p-4">
            <span className="text-emerald-600 text-xs font-bold uppercase">Track delivery</span>
            <p className="mt-1 text-xs text-warm-600">
              Check Message History to see delivery status for each recipient.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}