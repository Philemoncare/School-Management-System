'use client';

import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { useAuth } from '@/context/auth-context';
import { User, Loader2, Contact } from 'lucide-react';

export default function StudentProfile() {
  const { activeSchoolId } = useAuth();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeSchoolId) return;
    apiFetch('/student/profile')
      .then(setStudent)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [activeSchoolId]);

  if (loading) return <div className="p-20 text-center"><Loader2 className="animate-spin mx-auto text-forest-700" size={48} /></div>;
  if (!student) return <div className="p-8 text-center text-danger-500">Failed to load profile context.</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-2xl border border-warm-100 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 bg-sage-50 text-forest-700 rounded-full flex items-center justify-center border border-sage-100 shadow-inner">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-charcoal-900">{student.firstName} {student.lastName}</h1>
          <p className="text-warm-500 text-sm">Official Student Records Dashboard profile</p>
        </div>
      </div>

      <div className="bg-card rounded-2xl p-6 border border-warm-100 shadow-sm space-y-6">
        <h3 className="text-lg font-bold text-charcoal-900 flex items-center gap-2">
          <Contact size={18} className="text-forest-700" />
          Identification & Core Bio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-sm text-warm-700 font-medium">
          <div className="p-3 bg-ivory-50 rounded-xl border border-warm-100/50">
            <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider mb-1">Student ID Number</p>
            <p className="text-charcoal-900 font-semibold">{student.studentNumber}</p>
          </div>

          <div className="p-3 bg-ivory-50 rounded-xl border border-warm-100/50">
            <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider mb-1">Admission Registry Number</p>
            <p className="text-charcoal-900 font-semibold">{student.admissionNumber || 'N/A'}</p>
          </div>

          <div className="p-3 bg-ivory-50 rounded-xl border border-warm-100/50">
            <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider mb-1">Date of Admission</p>
            <p className="text-charcoal-900 font-bold">{new Date(student.admissionDate).toLocaleDateString()}</p>
          </div>

          <div className="p-3 bg-ivory-50 rounded-xl border border-warm-100/50">
            <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider mb-1">Date of Birth</p>
            <p className="text-charcoal-900 font-bold">{new Date(student.dateOfBirth).toLocaleDateString()}</p>
          </div>

          <div className="p-3 bg-ivory-50 rounded-xl border border-warm-100/50">
            <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider mb-1">Gender</p>
            <p className="text-charcoal-900 font-bold uppercase">{student.gender || 'Not specified'}</p>
          </div>

          <div className="p-3 bg-ivory-50 rounded-xl border border-warm-100/50">
            <p className="text-[11px] text-warm-400 font-bold uppercase tracking-wider mb-1">Account Lifecycle Status</p>
            <span className="px-2 py-0.5 text-xs font-bold bg-success-50 text-success-700 rounded-md uppercase">{student.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
