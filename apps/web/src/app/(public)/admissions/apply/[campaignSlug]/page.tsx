'use client';

import { Select } from '@/components/ui/input';
import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { apiFetch } from '@/lib/api/client';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  Loader2,
  ShieldCheck,
  User,
  Users,
} from 'lucide-react';

type Campaign = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  instructions?: string | null;
  academicYearId: string;
  academicYear: { name: string; code: string };
  school: { name: string; slug: string; logo?: string | null; currency?: string };
  applicationCloseDate: string;
  classes: Array<{ id: string; name: string; code: string; level: number }>;
};

type Guardian = {
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
  address: string;
};

export default function PublicAdmissionPage() {
  const params = useParams();
  const campaignSlug = params?.campaignSlug as string;

  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loadError, setLoadError] = useState('');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    dateOfBirth: '',
    gender: '',
    classId: '',
    guardians: [
      {
        firstName: '',
        lastName: '',
        relationship: '',
        email: '',
        phone: '',
        address: '',
      },
    ],
  });

  useEffect(() => {
    let active = true;

    apiFetch(`/admissions/public/campaigns/${campaignSlug}`)
      .then((data) => {
        if (!active) return;
        setCampaign(data);
        if (data.classes?.length === 1) {
          setFormData((current) => ({ ...current, classId: data.classes[0].id }));
        }
      })
      .catch((error) => {
        if (!active) return;
        setLoadError(error.message || 'This admissions campaign is not available.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [campaignSlug]);

  function updateGuardian(field: keyof Guardian, value: string) {
    const guardians = [...formData.guardians];
    guardians[0] = { ...guardians[0], [field]: value };
    setFormData({ ...formData, guardians });
  }

  function validateApplicant() {
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setSubmitError('Enter the applicant first and last name.');
      return false;
    }
    if (!formData.dateOfBirth) {
      setSubmitError('Enter the applicant date of birth.');
      return false;
    }
    if (!formData.gender) {
      setSubmitError('Select the applicant gender.');
      return false;
    }
    if (!formData.classId) {
      setSubmitError('Select the class being applied for.');
      return false;
    }
    setSubmitError('');
    return true;
  }

  function validateGuardian() {
    const guardian = formData.guardians[0];
    if (!guardian.firstName.trim() || !guardian.lastName.trim()) {
      setSubmitError('Enter the guardian first and last name.');
      return false;
    }
    if (!guardian.relationship.trim()) {
      setSubmitError('Enter the guardian relationship to the applicant.');
      return false;
    }
    if (!guardian.email.trim() || !guardian.email.includes('@')) {
      setSubmitError('Enter a valid guardian email address.');
      return false;
    }
    if (!guardian.phone.trim()) {
      setSubmitError('Enter the guardian phone number.');
      return false;
    }
    setSubmitError('');
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!campaign) return;
    if (!validateApplicant()) {
      setStep(1);
      return;
    }
    if (!validateGuardian()) {
      setStep(2);
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const result = await apiFetch(`/admissions/public/campaigns/${campaignSlug}/apply`, {
        method: 'POST',
        body: JSON.stringify({
          campaignId: campaign.id,
          academicYearId: campaign.academicYearId,
          classId: formData.classId,
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          middleName: formData.middleName.trim() || undefined,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          guardians: [
            {
              ...formData.guardians[0],
              firstName: formData.guardians[0].firstName.trim(),
              lastName: formData.guardians[0].lastName.trim(),
              relationship: formData.guardians[0].relationship.trim(),
              email: formData.guardians[0].email.trim(),
              phone: formData.guardians[0].phone.trim(),
              address: formData.guardians[0].address.trim() || undefined,
              isPrimary: true,
            },
          ],
        }),
      });
      setSuccess(result.reference || result.applicationNumber);
    } catch (error: any) {
      setSubmitError(error.message || 'Your application could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-forest-700" size={40} />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card rounded-xl p-10 shadow-xs text-center space-y-5 border border-warm-200/80">
          <AlertCircle className="mx-auto text-danger-600" size={44} />
          <h1 className="text-2xl font-semibold text-charcoal-900">Applications are not available</h1>
          <p className="text-sm font-medium text-warm-500">{loadError}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-ivory-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-card rounded-xl p-10 shadow-xs text-center space-y-6">
          <div className="w-20 h-20 bg-sage-50 rounded-2xl flex items-center justify-center text-forest-600 border border-sage-200 mx-auto">
            <CheckCircle2 size={44} />
          </div>
          <h2 className="text-3xl font-semibold text-charcoal-900 tracking-tight">Application submitted</h2>
          <p className="text-warm-500 font-medium">
            Your application is in the review queue. Save the reference number below.
          </p>
          <div className="bg-sage-50/70 p-6 rounded-xl border border-sage-200">
            <p className="text-[11px] font-semibold text-forest-800 uppercase tracking-wide mb-1">Application reference</p>
            <p className="text-2xl font-mono font-semibold text-forest-800">{success}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  return (
    <div className="min-h-screen bg-ivory-50 py-16 px-4 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <p className="text-[11px] font-semibold text-forest-700 uppercase tracking-wide">{campaign.school.name}</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-charcoal-900 tracking-tight">{campaign.name}</h1>
          <p className="text-sm font-medium text-warm-500">
            {campaign.academicYear.name} intake. Applications close on{' '}
            {new Date(campaign.applicationCloseDate).toLocaleDateString()}.
          </p>
        </div>

        {campaign.instructions && (
          <div className="bg-sage-50 border border-sage-200 rounded-xl p-5 flex items-start gap-3">
            <FileText className="text-forest-700 shrink-0 mt-0.5" size={18} />
            <p className="text-xs font-medium text-forest-900 leading-relaxed">{campaign.instructions}</p>
          </div>
        )}

        <div className="bg-card rounded-xl shadow-xs overflow-hidden border border-warm-200/80">
          <div className="bg-charcoal-950 p-5 sm:p-8 text-white">
            <StepIndicator current={step} />
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-10 space-y-8">
            {submitError && (
              <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
                <AlertCircle className="shrink-0 mt-0.5" size={18} />
                <p className="text-xs font-semibold leading-relaxed">{submitError}</p>
              </div>
            )}

            {step === 1 && (
              <section className="space-y-7">
                <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
                  <User className="text-forest-700" size={20} /> Applicant information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="First name *" required value={formData.firstName} onChange={(value: string) => setFormData({ ...formData, firstName: value })} />
                  <InputField label="Last name *" required value={formData.lastName} onChange={(value: string) => setFormData({ ...formData, lastName: value })} />
                  <InputField label="Middle name" value={formData.middleName} onChange={(value: string) => setFormData({ ...formData, middleName: value })} />
                  <InputField label="Date of birth *" type="date" required value={formData.dateOfBirth} onChange={(value: string) => setFormData({ ...formData, dateOfBirth: value })} />
                  <div>
                    <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2 ml-1">Gender *</label>
                    <Select
                      label="Gender *"
                      value={formData.gender}
                      placeholder="Select gender"
                      required
                      options={[
                        { value: '', label: 'Select gender' },
                        { value: 'MALE', label: 'Male' },
                        { value: 'FEMALE', label: 'Female' },
                        { value: 'OTHER', label: 'Other' },
                      ]}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2 ml-1">Class applying for *</label>
                    <Select
                      label="Class applying for *"
                      value={formData.classId}
                      placeholder="Select class"
                      required
                      options={[
                        { value: '', label: 'Select class' },
                        ...campaign.classes.map((schoolClass) => ({
                          value: schoolClass.id,
                          label: schoolClass.name,
                        })),
                      ]}
                      onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                    />
                  </div>
                </div>
                {campaign.classes.length === 0 && (
                  <p className="text-xs font-semibold text-danger-600">No classes are currently open for this campaign. Contact the school.</p>
                )}
                <div className="pt-4 border-t border-warm-100 flex justify-end">
                  <button type="button" onClick={() => { if (validateApplicant()) setStep(2); }} className="bg-forest-700 text-white px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-forest-800 transition-all flex items-center gap-2">
                    Next step <ArrowRight size={17} />
                  </button>
                </div>
              </section>
            )}

            {step === 2 && (
              <section className="space-y-7">
                <h3 className="text-xl font-semibold text-charcoal-900 tracking-tight flex items-center gap-3">
                  <Users className="text-forest-700" size={20} /> Parent or guardian
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <InputField label="Guardian first name *" required value={formData.guardians[0].firstName} onChange={(value: string) => updateGuardian('firstName', value)} />
                  <InputField label="Guardian last name *" required value={formData.guardians[0].lastName} onChange={(value: string) => updateGuardian('lastName', value)} />
                  <InputField label="Relationship *" placeholder="e.g. Mother" required value={formData.guardians[0].relationship} onChange={(value: string) => updateGuardian('relationship', value)} />
                  <InputField label="Email address *" type="email" required value={formData.guardians[0].email} onChange={(value: string) => updateGuardian('email', value)} />
                  <InputField label="Phone number *" required value={formData.guardians[0].phone} onChange={(value: string) => updateGuardian('phone', value)} />
                  <InputField label="Residential address" value={formData.guardians[0].address} onChange={(value: string) => updateGuardian('address', value)} />
                </div>
                <div className="pt-4 border-t border-warm-100 flex justify-between items-center">
                  <button type="button" onClick={() => { setSubmitError(''); setStep(1); }} className="text-warm-500 font-semibold text-xs uppercase tracking-wide hover:text-warm-700 transition-all">Back</button>
                  <button type="button" onClick={() => { if (validateGuardian()) setStep(3); }} className="bg-forest-700 text-white px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-forest-800 transition-all flex items-center gap-2">
                    Review application <ChevronRight size={17} />
                  </button>
                </div>
              </section>
            )}

            {step === 3 && (
              <section className="space-y-7">
                <div className="bg-sage-50/70 p-6 rounded-xl border border-sage-200">
                  <h3 className="text-lg font-semibold text-forest-900 tracking-tight mb-2">Review and submit</h3>
                  <p className="text-forest-700 font-medium text-sm">Confirm that the details below are correct before submitting.</p>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
                  <SummaryItem label="Applicant" value={`${formData.firstName} ${formData.lastName}`} />
                  <SummaryItem label="Class" value={campaign.classes.find((item) => item.id === formData.classId)?.name || 'Not selected'} />
                  <SummaryItem label="Date of birth" value={formData.dateOfBirth} />
                  <SummaryItem label="Guardian" value={`${formData.guardians[0].firstName} ${formData.guardians[0].lastName}`} />
                  <SummaryItem label="Guardian email" value={formData.guardians[0].email} />
                  <SummaryItem label="Guardian phone" value={formData.guardians[0].phone} />
                </dl>

                <div className="flex items-start gap-3 p-4 bg-ivory-50 rounded-lg border border-warm-100">
                  <ShieldCheck className="text-forest-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs font-medium text-warm-600 leading-relaxed">By submitting, you confirm that the information provided is true and correct.</p>
                </div>

                <div className="pt-4 border-t border-warm-100 flex justify-between items-center">
                  <button type="button" onClick={() => { setSubmitError(''); setStep(2); }} className="text-warm-500 font-semibold text-xs uppercase tracking-wide hover:text-warm-700 transition-all">Back</button>
                  <button type="submit" disabled={submitting || campaign.classes.length === 0} className="bg-forest-700 text-white px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-forest-800 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed">
                    {submitting ? <Loader2 className="animate-spin" size={17} /> : <CheckCircle2 size={17} />}
                    {submitting ? 'Submitting...' : 'Confirm and submit'}
                  </button>
                </div>
              </section>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-between w-full text-[11px] font-semibold uppercase tracking-wide">
      <span className={current >= 1 ? 'text-sage-300' : 'text-warm-500'}>1. Applicant</span>
      <ChevronRight size={14} className="text-warm-600" />
      <span className={current >= 2 ? 'text-sage-300' : 'text-warm-500'}>2. Guardian</span>
      <ChevronRight size={14} className="text-warm-600" />
      <span className={current >= 3 ? 'text-sage-300' : 'text-warm-500'}>3. Review</span>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-warm-100 bg-ivory-50 p-4">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">{label}</dt>
      <dd className="mt-1 font-semibold text-charcoal-900">{value || 'Not provided'}</dd>
    </div>
  );
}

function InputField({ label, type = 'text', required, value, onChange, placeholder }: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2 ml-1">{label}</label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-ivory-50 border border-warm-200 rounded-lg p-4 text-sm font-medium text-charcoal-900 focus:ring-2 focus:ring-forest-600/20 transition-all outline-none"
      />
    </div>
  );
}
