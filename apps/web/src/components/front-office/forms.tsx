'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/input';
import { StudentPicker, type FrontOfficeStudent } from './student-picker';

function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700"
    >
      {message}
    </p>
  );
}

function TextArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-charcoal-800">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="w-full resize-none rounded-lg border border-warm-300 bg-card p-3 text-sm text-charcoal-900 placeholder:text-warm-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
      />
    </div>
  );
}

function FormActions({
  saving,
  onCancel,
  submitLabel,
}: {
  saving: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 border-t border-warm-100 pt-4">
      <Button variant="outline" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      <Button type="submit" isLoading={saving}>
        {submitLabel}
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Visitor registration                                                */
/* ------------------------------------------------------------------ */

export function VisitorForm({
  onSaved,
  onCancel,
}: {
  onSaved: (visitor: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    organization: '',
    visitorType: 'Visitor',
    identificationType: '',
    identificationNumber: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.fullName.trim()) {
      setError('Enter the visitor’s full name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await apiFetch('/front-office/visitors', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          organization: form.organization.trim() || undefined,
          visitorType: form.visitorType,
          identificationType: form.identificationType.trim() || undefined,
          identificationNumber: form.identificationNumber.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message || 'Could not register the visitor.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNotice message={error} />
      <Input
        label="Full name *"
        required
        placeholder="e.g. Ama Mensah"
        value={form.fullName}
        onChange={(event) => setForm({ ...form, fullName: event.target.value })}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Phone"
          type="tel"
          placeholder="024 000 0000"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <Input
          label="Email"
          type="email"
          placeholder="visitor@example.com"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <Input
          label="Organisation"
          placeholder="Company or institution"
          value={form.organization}
          onChange={(event) => setForm({ ...form, organization: event.target.value })}
        />
        <Select
          label="Visitor type"
          value={form.visitorType}
          options={[
            { value: 'Visitor', label: 'General visitor' },
            { value: 'Parent', label: 'Parent / guardian' },
            { value: 'Vendor', label: 'Vendor / supplier' },
            { value: 'Contractor', label: 'Contractor' },
            { value: 'Official', label: 'Government / official' },
            { value: 'Other', label: 'Other' },
          ]}
          onChange={(event) => setForm({ ...form, visitorType: event.target.value })}
        />
        <Input
          label="ID type"
          placeholder="Ghana Card, Passport…"
          value={form.identificationType}
          onChange={(event) => setForm({ ...form, identificationType: event.target.value })}
        />
        <Input
          label="ID number"
          placeholder="GHA-000000000-0"
          value={form.identificationNumber}
          onChange={(event) =>
            setForm({ ...form, identificationNumber: event.target.value })
          }
        />
      </div>
      <TextArea
        id="visitor-notes"
        label="Notes"
        value={form.notes}
        onChange={(value) => setForm({ ...form, notes: value })}
        placeholder="Anything the front desk should know."
      />
      <FormActions saving={saving} onCancel={onCancel} submitLabel="Register visitor" />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Appointment                                                         */
/* ------------------------------------------------------------------ */

function defaultDateTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(0, 0, 0);
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
}

export function AppointmentForm({
  onSaved,
  onCancel,
}: {
  onSaved: (appointment: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    visitorName: '',
    phone: '',
    email: '',
    hostName: '',
    purpose: '',
    dateTime: defaultDateTime(),
    location: 'Reception',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.visitorName.trim()) {
      setError('Enter the visitor’s name.');
      return;
    }
    if (!form.dateTime || Number.isNaN(new Date(form.dateTime).getTime())) {
      setError('Select a valid appointment date and time.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await apiFetch('/front-office/appointments', {
        method: 'POST',
        body: JSON.stringify({
          visitorName: form.visitorName.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          hostName: form.hostName.trim() || undefined,
          purpose: form.purpose.trim() || undefined,
          dateTime: new Date(form.dateTime).toISOString(),
          location: form.location.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message || 'Could not book the appointment.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNotice message={error} />
      <Input
        label="Visitor name *"
        required
        placeholder="e.g. Kofi Boateng"
        value={form.visitorName}
        onChange={(event) => setForm({ ...form, visitorName: event.target.value })}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <Input
          label="Date and time *"
          required
          type="datetime-local"
          value={form.dateTime}
          onChange={(event) => setForm({ ...form, dateTime: event.target.value })}
        />
        <Input
          label="Host"
          placeholder="Who are they meeting?"
          value={form.hostName}
          onChange={(event) => setForm({ ...form, hostName: event.target.value })}
        />
        <Input
          label="Location"
          placeholder="Reception"
          value={form.location}
          onChange={(event) => setForm({ ...form, location: event.target.value })}
        />
        <Input
          label="Purpose"
          placeholder="e.g. Discuss admission"
          value={form.purpose}
          onChange={(event) => setForm({ ...form, purpose: event.target.value })}
        />
      </div>
      <TextArea
        id="appointment-notes"
        label="Notes"
        value={form.notes}
        onChange={(value) => setForm({ ...form, notes: value })}
      />
      <FormActions saving={saving} onCancel={onCancel} submitLabel="Book appointment" />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Enquiry                                                             */
/* ------------------------------------------------------------------ */

export function EnquiryForm({
  onSaved,
  onCancel,
}: {
  onSaved: (enquiry: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    visitorName: '',
    phone: '',
    email: '',
    category: 'General',
    subject: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.visitorName.trim() || !form.subject.trim()) {
      setError('Visitor name and subject are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await apiFetch('/front-office/enquiries', {
        method: 'POST',
        body: JSON.stringify({
          visitorName: form.visitorName.trim(),
          phone: form.phone.trim() || undefined,
          email: form.email.trim() || undefined,
          category: form.category,
          subject: form.subject.trim(),
          description: form.description.trim() || undefined,
        }),
      });
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message || 'Could not log the enquiry.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNotice message={error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Visitor name *"
          required
          value={form.visitorName}
          onChange={(event) => setForm({ ...form, visitorName: event.target.value })}
        />
        <Input
          label="Phone"
          type="tel"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <Select
          label="Category"
          value={form.category}
          options={[
            { value: 'General', label: 'General enquiry' },
            { value: 'Admissions', label: 'Admissions' },
            { value: 'Fees', label: 'Fees and billing' },
            { value: 'Academics', label: 'Academics' },
            { value: 'Transport', label: 'Transport' },
            { value: 'Complaint', label: 'Complaint' },
          ]}
          onChange={(event) => setForm({ ...form, category: event.target.value })}
        />
      </div>
      <Input
        label="Subject *"
        required
        placeholder="Short summary of the enquiry"
        value={form.subject}
        onChange={(event) => setForm({ ...form, subject: event.target.value })}
      />
      <TextArea
        id="enquiry-description"
        label="Details"
        value={form.description}
        onChange={(value) => setForm({ ...form, description: value })}
        placeholder="What did the visitor ask about?"
        rows={4}
      />
      <FormActions saving={saving} onCancel={onCancel} submitLabel="Log enquiry" />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Student checkout                                                    */
/* ------------------------------------------------------------------ */

export function StudentCheckoutForm({
  onSaved,
  onCancel,
}: {
  onSaved: (checkout: any) => void;
  onCancel: () => void;
}) {
  const [student, setStudent] = useState<FrontOfficeStudent | null>(null);
  const [form, setForm] = useState({
    guardianName: '',
    relationship: '',
    reason: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!student) {
      setError('Select the student being collected.');
      return;
    }
    if (!form.guardianName.trim()) {
      setError('Record who collected the student.');
      return;
    }
    if (!form.reason.trim()) {
      setError('Enter the reason for early departure.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await apiFetch('/front-office/students/checkout', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.id,
          guardianName: form.guardianName.trim(),
          relationship: form.relationship.trim() || undefined,
          reason: form.reason.trim(),
          notes: form.notes.trim() || undefined,
        }),
      });
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message || 'Could not record the checkout.');
    } finally {
      setSaving(false);
    }
  }

  const suggestedGuardian = student?.guardians?.[0]?.guardian;

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNotice message={error} />
      <StudentPicker
        selected={student}
        onSelect={(next) => {
          setStudent(next);
          if (next && !form.guardianName) {
            const guardian = next.guardians?.[0]?.guardian;
            if (guardian) {
              setForm((previous) => ({
                ...previous,
                guardianName: `${guardian.firstName ?? ''} ${guardian.lastName ?? ''}`.trim(),
              }));
            }
          }
        }}
        label="Student being collected *"
      />
      {suggestedGuardian && (
        <p className="rounded-lg bg-warm-50 p-2.5 text-[11px] font-medium text-warm-600">
          Registered guardian: {suggestedGuardian.firstName} {suggestedGuardian.lastName}
          {suggestedGuardian.phone ? ` · ${suggestedGuardian.phone}` : ''}
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Collected by *"
          required
          placeholder="Full name of the person collecting"
          value={form.guardianName}
          onChange={(event) => setForm({ ...form, guardianName: event.target.value })}
        />
        <Input
          label="Relationship"
          placeholder="Mother, uncle, driver…"
          value={form.relationship}
          onChange={(event) => setForm({ ...form, relationship: event.target.value })}
        />
      </div>
      <Input
        label="Reason *"
        required
        placeholder="e.g. Medical appointment"
        value={form.reason}
        onChange={(event) => setForm({ ...form, reason: event.target.value })}
      />
      <TextArea
        id="checkout-notes"
        label="Notes"
        value={form.notes}
        onChange={(value) => setForm({ ...form, notes: value })}
      />
      <FormActions saving={saving} onCancel={onCancel} submitLabel="Confirm checkout" />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Late arrival                                                        */
/* ------------------------------------------------------------------ */

export function LateArrivalForm({
  onSaved,
  onCancel,
}: {
  onSaved: (record: any) => void;
  onCancel: () => void;
}) {
  const [student, setStudent] = useState<FrontOfficeStudent | null>(null);
  const [form, setForm] = useState({
    arrivalTime: (() => {
      const date = new Date();
      const offset = date.getTimezoneOffset();
      return new Date(date.getTime() - offset * 60 * 1000).toISOString().slice(0, 16);
    })(),
    reason: 'Traffic',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!student) {
      setError('Select the student who arrived late.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await apiFetch('/front-office/students/late-arrival', {
        method: 'POST',
        body: JSON.stringify({
          studentId: student.id,
          arrivalTime: new Date(form.arrivalTime).toISOString(),
          reason: form.reason,
          notes: form.notes.trim() || undefined,
        }),
      });
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message || 'Could not record the late arrival.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNotice message={error} />
      <StudentPicker selected={student} onSelect={setStudent} label="Late student *" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Arrival time *"
          required
          type="datetime-local"
          value={form.arrivalTime}
          onChange={(event) => setForm({ ...form, arrivalTime: event.target.value })}
        />
        <Select
          label="Reason"
          value={form.reason}
          options={[
            { value: 'Traffic', label: 'Traffic' },
            { value: 'Medical', label: 'Medical appointment' },
            { value: 'Family', label: 'Family matter' },
            { value: 'Transport', label: 'Transport delay' },
            { value: 'Delayed', label: 'Other / unexplained' },
          ]}
          onChange={(event) => setForm({ ...form, reason: event.target.value })}
        />
      </div>
      <TextArea
        id="late-notes"
        label="Notes"
        value={form.notes}
        onChange={(value) => setForm({ ...form, notes: value })}
      />
      <FormActions saving={saving} onCancel={onCancel} submitLabel="Record arrival" />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Delivery                                                            */
/* ------------------------------------------------------------------ */

export function DeliveryForm({
  onSaved,
  onCancel,
}: {
  onSaved: (delivery: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    recipientName: '',
    courierCompany: '',
    referenceNumber: '',
    description: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.recipientName.trim()) {
      setError('Record who the delivery is for.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await apiFetch('/front-office/deliveries', {
        method: 'POST',
        body: JSON.stringify({
          recipientName: form.recipientName.trim(),
          courierCompany: form.courierCompany.trim() || undefined,
          referenceNumber: form.referenceNumber.trim() || undefined,
          description: form.description.trim() || undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message || 'Could not record the delivery.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNotice message={error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Recipient *"
          required
          placeholder="Staff member or department"
          value={form.recipientName}
          onChange={(event) => setForm({ ...form, recipientName: event.target.value })}
        />
        <Input
          label="Courier company"
          placeholder="e.g. DHL"
          value={form.courierCompany}
          onChange={(event) => setForm({ ...form, courierCompany: event.target.value })}
        />
        <Input
          label="Tracking / reference"
          value={form.referenceNumber}
          onChange={(event) => setForm({ ...form, referenceNumber: event.target.value })}
        />
        <Input
          label="Description"
          placeholder="What was delivered?"
          value={form.description}
          onChange={(event) => setForm({ ...form, description: event.target.value })}
        />
      </div>
      <TextArea
        id="delivery-notes"
        label="Notes"
        value={form.notes}
        onChange={(value) => setForm({ ...form, notes: value })}
      />
      <FormActions saving={saving} onCancel={onCancel} submitLabel="Log delivery" />
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Lost and found                                                      */
/* ------------------------------------------------------------------ */

export function LostFoundForm({
  onSaved,
  onCancel,
}: {
  onSaved: (item: any) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    itemName: '',
    category: 'General',
    foundLocation: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!form.itemName.trim()) {
      setError('Enter the item name.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const saved = await apiFetch('/front-office/lost-found', {
        method: 'POST',
        body: JSON.stringify({
          itemName: form.itemName.trim(),
          category: form.category,
          foundLocation: form.foundLocation.trim() || undefined,
          description: form.description.trim() || undefined,
        }),
      });
      onSaved(saved);
    } catch (err: any) {
      setError(err?.message || 'Could not log the item.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorNotice message={error} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Item *"
          required
          placeholder="e.g. Blue water bottle"
          value={form.itemName}
          onChange={(event) => setForm({ ...form, itemName: event.target.value })}
        />
        <Select
          label="Category"
          value={form.category}
          options={[
            { value: 'General', label: 'General' },
            { value: 'Uniform', label: 'Uniform / clothing' },
            { value: 'Electronics', label: 'Electronics' },
            { value: 'Books', label: 'Books / stationery' },
            { value: 'Bags', label: 'Bags' },
            { value: 'Jewellery', label: 'Jewellery / valuables' },
          ]}
          onChange={(event) => setForm({ ...form, category: event.target.value })}
        />
      </div>
      <Input
        label="Found at"
        placeholder="e.g. Playground, JHS 2 block"
        value={form.foundLocation}
        onChange={(event) => setForm({ ...form, foundLocation: event.target.value })}
      />
      <TextArea
        id="lost-found-description"
        label="Description"
        value={form.description}
        onChange={(value) => setForm({ ...form, description: value })}
        placeholder="Colour, distinguishing marks, contents."
      />
      <FormActions saving={saving} onCancel={onCancel} submitLabel="Log item" />
    </form>
  );
}
