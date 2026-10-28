'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Heart,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApi } from '@/hooks/use-api';
import { Input, Select } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function NewClinicVisit() {
  const api = useApi();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    studentId: '',
    visitType: 'ROUTINE',
    reason: '',
    symptoms: '',
    observations: '',
    treatment: '',
    outcome: '',
    status: 'TREATED'
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/health/visits', formData);
      router.push('/dashboard/health');
    } catch (error) {
      console.error('Failed to create visit', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" /> Back to Health
      </Button>

      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">New Clinic Visit</h1>
        <div className="flex gap-2">
            {[1, 2, 3].map(i => (
                <div key={i} className={`w-3 h-3 rounded-full ${step >= i ? 'bg-forest-500' : 'bg-muted'}`}></div>
            ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1 && "1. Student & Reason"}
            {step === 2 && "2. Assessment & Observations"}
            {step === 3 && "3. Treatment & Outcome"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === 1 && (
            <>
              <div className="space-y-2">
                <Label>Student ID / Search</Label>
                <Input
                    placeholder="Enter Student UUID..."
                    value={formData.studentId}
                    onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Visit Type</Label>
                    <Select
                        className="w-full p-2 border rounded-md"
                        value={formData.visitType}
                        onChange={(e) => setFormData({...formData, visitType: e.target.value})}
                    >
                        <option value="ROUTINE">Routine</option>
                        <option value="ILLNESS">Illness</option>
                        <option value="INJURY">Injury</option>
                        <option value="FIRST_AID">First Aid</option>
                        <option value="EMERGENCY">Emergency</option>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>Reason for Visit</Label>
                    <Input
                        placeholder="e.g. Headache, Fall..."
                        value={formData.reason}
                        onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="space-y-2">
                <Label>Symptoms</Label>
                <Textarea
                    placeholder="Describe symptoms reported by student..."
                    value={formData.symptoms}
                    onChange={(e) => setFormData({...formData, symptoms: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Clinical Observations</Label>
                <Textarea
                    placeholder="Record your assessment..."
                    value={formData.observations}
                    onChange={(e) => setFormData({...formData, observations: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                 {/* Vital placeholders */}
                 <div className="space-y-1">
                    <Label className="text-xs">Temp (°C)</Label>
                    <Input placeholder="36.5" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-xs">Pulse</Label>
                    <Input placeholder="72" />
                 </div>
                 <div className="space-y-1">
                    <Label className="text-xs">BP</Label>
                    <Input placeholder="120/80" />
                 </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="space-y-2">
                <Label>Treatment / Action Taken</Label>
                <Textarea
                    placeholder="e.g. Administered Paracetamol, Applied dressing..."
                    value={formData.treatment}
                    onChange={(e) => setFormData({...formData, treatment: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Outcome</Label>
                <Select
                    className="w-full p-2 border rounded-md"
                    value={formData.outcome}
                    onChange={(e) => setFormData({...formData, outcome: e.target.value})}
                >
                    <option value="">Select Outcome...</option>
                    <option value="RETURN_TO_CLASS">Returned to Class</option>
                    <option value="SENT_HOME">Sent Home</option>
                    <option value="OBSERVATION">Kept for Observation</option>
                    <option value="REFERRED">Referred to Hospital</option>
                </Select>
              </div>
              <div className="p-4 bg-sage-50 border border-sage-200 rounded-lg flex gap-3">
                 <CheckCircle className="w-5 h-5 text-forest-700" />
                 <div className="text-sm text-forest-900">
                    Guardians will be automatically notified upon completion if the outcome is 'Sent Home' or 'Referred'.
                 </div>
              </div>
            </>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            Previous
          </Button>
          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)}>Next Step</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading || !formData.studentId}>
              {loading ? "Recording..." : "Complete & Record Visit"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

