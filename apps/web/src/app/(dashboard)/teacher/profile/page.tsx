'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  BadgeCheck,
  BookMarked,
  Calendar,
  ChevronRight,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

type Profile = {
  id: string;
  firstName: string;
  lastName: string;
  employeeId?: string | null;
  designation?: string | null;
  status?: string;
  department?: { name: string } | null;
  position?: { title: string } | null;
  user?: { email?: string; phone?: string | null; createdAt?: string } | null;
};

type Assignment = {
  id: string;
  subject: { name: string };
  section: { name: string; class: { name: string } };
};

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([apiFetch('/staff/me'), apiFetch('/teacher-portal/assignments')])
      .then(([staff, teaching]) => {
        setProfile(staff);
        setAssignments(teaching);
      })
      .catch((err) => setError(err.message || 'Unable to load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={40} /></div>;

  if (error) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-5 text-danger-700">
          <AlertCircle size={20} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const uniqueSections = new Set(assignments.map((item) => `${item.section.class.name}-${item.section.name}`));
  const uniqueSubjects = new Set(assignments.map((item) => item.subject.name));

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <div className="flex items-center gap-8">
        <div className="w-32 h-32 rounded-xl bg-forest-700 text-white flex items-center justify-center font-semibold text-4xl">
          {profile.firstName?.[0]}{profile.lastName?.[0]}
        </div>
        <div>
          <h1 className="text-4xl font-semibold text-charcoal-900 tracking-tight">{profile.firstName} {profile.lastName}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <span className="bg-sage-50 text-forest-800 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide">{profile.designation || 'Faculty Member'}</span>
            <span className="text-warm-400 font-bold uppercase tracking-wide text-[11px]">ID: {profile.employeeId || profile.id.slice(0, 8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-charcoal-900 mb-8 flex items-center gap-3"><ShieldCheck className="text-forest-700" /> Account Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <ProfileItem label="Official Email" value={profile.user?.email} icon={<Mail size={16} />} />
              <ProfileItem label="Phone Number" value={profile.user?.phone || 'Not provided'} icon={<Phone size={16} />} />
              <ProfileItem label="Department" value={profile.department?.name || 'Not assigned'} icon={<BookMarked size={16} />} />
              <ProfileItem label="Joined Date" value={profile.user?.createdAt ? new Date(profile.user.createdAt).toLocaleDateString() : 'N/A'} icon={<Calendar size={16} />} />
            </div>
          </section>

          <section className="bg-card border border-warm-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-semibold text-charcoal-900 mb-8 flex items-center gap-3"><BadgeCheck className="text-forest-700" /> Teaching Assignments</h3>
            {assignments.length === 0 ? (
              <p className="text-sm font-medium text-warm-400">No teaching assignments have been recorded.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {Array.from(uniqueSubjects).map((subject) => (
                  <span key={subject} className="px-4 py-2 bg-ivory-50 border border-warm-100 rounded-xl text-xs font-bold text-warm-700">{subject}</span>
                ))}
              </div>
            )}
          </section>
        </div>

        <div className="space-y-8">
          <div className="bg-charcoal-900 rounded-xl p-8 shadow-xs text-white">
            <h3 className="font-bold text-lg mb-6">Profile Controls</h3>
            <div className="space-y-4">
              <ActionLink label="Edit Personal Info" href="/teacher/settings" />
              <ActionLink label="Security & Password" href="/teacher/settings" />
            </div>
          </div>

          <div className="bg-sage-50 border border-sage-100 rounded-xl p-8">
            <h4 className="text-forest-950 font-semibold text-sm uppercase tracking-wide mb-4">Teaching Load</h4>
            <p className="text-forest-800 text-sm font-medium leading-relaxed">
              You are assigned to {uniqueSections.size} class section{uniqueSections.size === 1 ? '' : 's'} across {uniqueSubjects.size} subject{uniqueSubjects.size === 1 ? '' : 's'}.
            </p>
            <Link href="/teacher/assignments" className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-forest-700 uppercase tracking-wide hover:underline">
              View Assignments <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProfileItem({ label, value, icon }: { label: string; value?: string | null; icon: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 bg-ivory-50 rounded-xl text-warm-400">{icon}</div>
      <div>
        <p className="text-[11px] font-semibold text-warm-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-charcoal-900 mt-0.5">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

function ActionLink({ label, href }: { label: string; href: string }) {
  return (
    <Link href={href} className="flex items-center justify-between p-4 bg-card/5 rounded-xl hover:bg-card/10 transition-all border border-white/5">
      <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      <ChevronRight size={14} className="text-forest-500" />
    </Link>
  );
}
