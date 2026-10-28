'use client';

import { Select } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { AlertCircle, Filter, Loader2, Plus, Search, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

type Incident = {
  id: string;
  incidentDate: string;
  category: string;
  severity: string;
  status: string;
  description: string;
  location?: string | null;
  immediateAction?: string | null;
  profile: { student: { firstName: string; lastName: string; studentNumber: string } };
};

type Student = { id: string; firstName: string; lastName: string; studentNumber: string };

export default function HealthIncidents() {
  const api = useApi();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [selected, setSelected] = useState<Incident | null>(null);
  const [form, setForm] = useState({
    studentId: '',
    category: '',
    severity: 'MEDIUM',
    incidentDate: new Date().toISOString().slice(0, 10),
    location: '',
    description: '',
    immediateAction: '',
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set('search', search.trim());
      if (status) params.set('status', status);
      if (severity) params.set('severity', severity);
      setLoading(true);
      setError('');
      api.get(`/health/incidents${params.toString() ? `?${params.toString()}` : ''}`)
        .then(setIncidents)
        .catch((err: any) => setError(err.message || 'Failed to fetch incidents.'))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [api, search, status, severity]);

  async function openForm() {
    setShowForm(true);
    setFormError('');
    if (students.length === 0) {
      try {
        const response = await api.get('/students?limit=100');
        setStudents(response.items || []);
      } catch (err: any) {
        setFormError(err.message || 'Unable to load students.');
      }
    }
  }

  async function submitIncident(event: React.FormEvent) {
    event.preventDefault();
    setFormError('');
    if (!form.studentId || !form.category.trim() || !form.description.trim()) {
      setFormError('Student, category and description are required.');
      return;
    }
    setSubmitting(true);
    try {
      const created = await api.post('/health/incidents', {
        ...form,
        incidentDate: new Date(form.incidentDate).toISOString(),
      });
      setIncidents((current) => [created, ...current]);
      setShowForm(false);
      setForm({ studentId: '', category: '', severity: 'MEDIUM', incidentDate: new Date().toISOString().slice(0, 10), location: '', description: '', immediateAction: '' });
    } catch (err: any) {
      setFormError(err.message || 'The incident could not be reported.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <AlertCircle className="text-danger-500" /> Health Incidents
        </h1>
        <Button className="gap-2" onClick={openForm}>
          <Plus className="w-4 h-4" /> Report Incident
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-danger-200 bg-danger-50 p-4 text-danger-700">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-card text-sm font-medium outline-none" placeholder="Search by student name or number..." />
        </div>
        <Select value={status} onChange={(event) => setStatus(event.target.value)} className="px-3 py-2.5 border border-border rounded-lg bg-card text-sm font-medium">
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </Select>
        <Select value={severity} onChange={(event) => setSeverity(event.target.value)} className="px-3 py-2.5 border border-border rounded-lg bg-card text-sm font-medium">
          <option value="">All severities</option>
          <option value="MILD">Mild</option>
          <option value="MEDIUM">Medium</option>
          <option value="SEVERE">Severe</option>
          <option value="LIFE_THREATENING">Life threatening</option>
          <option value="UNKNOWN">Unknown</option>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-12"><Loader2 className="animate-spin mx-auto text-forest-700" size={28} /></TableCell></TableRow>
              ) : incidents.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No incidents match these filters.</TableCell></TableRow>
              ) : incidents.map((incident) => (
                <TableRow key={incident.id}>
                  <TableCell className="text-sm">{format(new Date(incident.incidentDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="font-medium">{incident.profile.student.firstName} {incident.profile.student.lastName}</TableCell>
                  <TableCell>{incident.category}</TableCell>
                  <TableCell>
                    <Badge variant={incident.severity === 'SEVERE' || incident.severity === 'LIFE_THREATENING' ? 'destructive' : incident.severity === 'MEDIUM' ? 'warning' : 'outline'}>
                      {incident.severity.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant="outline">{incident.status.replace(/_/g, ' ')}</Badge></TableCell>
                  <TableCell className="text-right"><Button variant="ghost" size="sm" onClick={() => setSelected(incident)}>View</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-charcoal-900">Incident Details</h2>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg text-warm-400 hover:bg-ivory-50"><X size={20} /></button>
            </div>
            <div className="space-y-3 text-sm">
              <DetailRow label="Student" value={`${selected.profile.student.firstName} ${selected.profile.student.lastName}`} />
              <DetailRow label="Date" value={format(new Date(selected.incidentDate), 'MMM d, yyyy')} />
              <DetailRow label="Category" value={selected.category} />
              <DetailRow label="Severity" value={selected.severity.replace(/_/g, ' ')} />
              <DetailRow label="Status" value={selected.status.replace(/_/g, ' ')} />
              {selected.location && <DetailRow label="Location" value={selected.location} />}
              <DetailRow label="Description" value={selected.description} />
              {selected.immediateAction && <DetailRow label="Immediate action" value={selected.immediateAction} />}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-charcoal-950/50 p-4">
          <div className="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-charcoal-900">Report Incident</h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg text-warm-400 hover:bg-ivory-50"><X size={20} /></button>
            </div>
            <form onSubmit={submitIncident} className="space-y-4">
              {formError && <div className="rounded-lg border border-danger-200 bg-danger-50 p-3 text-xs font-semibold text-danger-700">{formError}</div>}
              <div>
                <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Student</label>
                <Select value={form.studentId} onChange={(event) => setForm({ ...form, studentId: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium">
                  <option value="">Select student</option>
                  {students.map((student) => <option key={student.id} value={student.id}>{student.firstName} {student.lastName} - {student.studentNumber}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Category</label>
                  <input value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none" placeholder="e.g. Injury" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Severity</label>
                  <Select value={form.severity} onChange={(event) => setForm({ ...form, severity: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium">
                    <option value="MILD">Mild</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="SEVERE">Severe</option>
                    <option value="LIFE_THREATENING">Life threatening</option>
                    <option value="UNKNOWN">Unknown</option>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Date</label>
                  <input type="date" value={form.incidentDate} onChange={(event) => setForm({ ...form, incidentDate: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Location</label>
                  <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none" placeholder="Optional" />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Description</label>
                <textarea rows={3} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none resize-none" />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-warm-500 uppercase tracking-wide mb-2">Immediate action</label>
                <textarea rows={2} value={form.immediateAction} onChange={(event) => setForm({ ...form, immediateAction: event.target.value })} className="w-full rounded-lg border border-warm-200 bg-ivory-50 p-3 text-sm font-medium outline-none resize-none" placeholder="Optional" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                <Button type="submit" disabled={submitting} className="gap-2">
                  {submitting && <Loader2 size={16} className="animate-spin" />} Report incident
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground mt-0.5">{value}</p>
    </div>
  );
}
