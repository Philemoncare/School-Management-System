'use client';

import React, { useState } from 'react';
import { GraduationCap, Mail, Lock, User, Building2, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    schoolName: '',
    schoolCode: '',
    adminEmail: '',
    adminFirstName: '',
    adminLastName: '',
    password: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step < 2) {
      setStep(step + 1);
      return;
    }

    setIsLoading(true);
    try {
      await apiFetch('/public/schools/register', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setStep(3); // Success
    } catch (err: any) {
      alert(err.message || 'Failed to register school');
    } finally {
      setIsLoading(false);
    }
  }

  if (step === 3) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="text-green-600" size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Registration Successful!</h2>
          <p className="mt-4 text-gray-600 font-medium">Your school "{formData.schoolName}" has been provisioned. Please check your email to verify your account.</p>
          <div className="mt-10">
            <Link href="/login" className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-200">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-xl shadow-blue-200">
            <GraduationCap className="text-white" size={40} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-gray-900 tracking-tight">
          {step === 1 ? 'Tell us about your school' : 'Create your admin account'}
        </h2>
        <div className="mt-4 flex justify-center gap-2">
          <div className={`w-10 h-1.5 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          <div className={`w-10 h-1.5 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-2xl shadow-gray-200/50 sm:rounded-3xl sm:px-12 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">School Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Building2 size={18} /></div>
                    <input
                      type="text"
                      required
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      placeholder="e.g. Greenwood Academy"
                      value={formData.schoolName}
                      onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">School Code (Short ID)</label>
                  <input
                    type="text"
                    required
                    className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all font-mono"
                    placeholder="e.g. GRW-001"
                    value={formData.schoolCode}
                    onChange={(e) => setFormData({...formData, schoolCode: e.target.value.toUpperCase()})}
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">First Name</label>
                    <input
                      type="text"
                      required
                      className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      value={formData.adminFirstName}
                      onChange={(e) => setFormData({...formData, adminFirstName: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Last Name</label>
                    <input
                      type="text"
                      required
                      className="block w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      value={formData.adminLastName}
                      onChange={(e) => setFormData({...formData, adminLastName: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Work Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Mail size={18} /></div>
                    <input
                      type="email"
                      required
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 px-1">Secure Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400"><Lock size={18} /></div>
                    <input
                      type="password"
                      required
                      className="block w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl text-gray-900 font-bold focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-4">
              {step > 1 && (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex-1 py-4 border border-gray-100 rounded-2xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                >
                  Back
                </button>
              )}
              <button
                type="submit"
                disabled={isLoading}
                className="flex-[2] flex justify-center items-center gap-2 py-4 px-4 border border-transparent rounded-2xl shadow-xl shadow-blue-200 text-lg font-black text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>{step === 1 ? 'Next' : 'Create School'} <ArrowRight size={20} /></>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-gray-100 text-center">
             <p className="text-sm text-gray-500 font-medium">Already have an account? <Link href="/login" className="font-bold text-blue-600 hover:underline">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
