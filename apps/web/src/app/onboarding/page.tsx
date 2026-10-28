"use client";

import { Select } from '@/components/ui/input';
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Building,
  User,
  Shield,
  Sliders,
  Check,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { apiFetch } from "@/lib/api/client";

export default function OnboardingWizardPage() {
  const { user, selectSchool } = useAuth();
  const [step, setStep] = useState(1);
  const router = useRouter();

  // Onboarding Form States
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("English");

  const nextStep = () => setStep((s) => Math.min(s + 1, 7));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handleCompleteOnboarding = async () => {
    try {
      await apiFetch("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ firstName, lastName, phone }),
      });

      await apiFetch("/users/me/preferences", {
        method: "PATCH",
        body: JSON.stringify({ key: "timezone", value: timezone }),
      });
      await apiFetch("/users/me/preferences", {
        method: "PATCH",
        body: JSON.stringify({ key: "language", value: language }),
      });

      if (user?.memberships?.length > 0) {
        selectSchool(user.memberships[0].schoolId);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Failed completing onboarding setup", err);
      router.push("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-ivory-50 flex flex-col items-center justify-center p-4 antialiased font-sans">
      <div className="w-full max-w-2xl bg-card border border-warm-200 shadow-xs rounded-xl overflow-hidden transition-all duration-300">

        {/* Step Progress Top Bar Indicator */}
        <div className="bg-charcoal-950 px-8 py-6 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Building className="text-sage-400" size={20} />
            <span className="text-sm font-semibold uppercase tracking-wide text-warm-200">
              User Onboarding Setup
            </span>
          </div>
          <span className="text-xs font-bold bg-card/10 px-3 py-1 rounded-full uppercase tracking-wide text-sage-300">
            Step {step} of 7
          </span>
        </div>

        {/* Dynamic Inner Step Render Layout */}
        <div className="p-8 md:p-12 min-h-[350px] flex flex-col justify-center">
          {step === 1 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-sage-50 text-forest-700 border border-sage-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <Building size={32} />
              </div>
              <h2 className="text-2xl font-sans font-semibold text-charcoal-950 tracking-tight">Welcome to SchooMA</h2>
              <p className="text-sm font-medium text-warm-500 max-w-md mx-auto leading-relaxed">
                Let's set up your profile and preferences so SchooMA fits the way your school works.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-charcoal-950 flex items-center gap-2">
                <User className="text-forest-700" size={20} /> Confirm Personal Information
              </h3>
              <p className="text-xs text-warm-500 font-medium mb-4">Validate that your display identifiers are completely accurate.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">First Name</label>
                  <input
                    type="text"
                    className="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-forest-600 focus:border-transparent transition-all"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">Last Name</label>
                  <input
                    type="text"
                    className="w-full border border-warm-200 rounded-xl px-4 py-2.5 text-sm font-semibold focus:ring-2 focus:ring-forest-600 focus:border-transparent transition-all"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-sage-50 text-forest-700 border border-sage-200 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle size={24} />
              </div>
              <h3 className="text-xl font-semibold text-charcoal-950">Verify Verification Passports</h3>
              <p className="text-sm font-medium text-warm-500 max-w-sm mx-auto">
                Your email identity <span className="font-bold text-charcoal-950">({user?.email || "registered email"})</span> has been successfully authenticated against server records.
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-charcoal-950 flex items-center gap-2">
                <Shield className="text-forest-700" size={20} /> Security & Session Options
              </h3>
              <p className="text-xs text-warm-500 font-medium">Calibrate platform security minimum rules for auditing logins.</p>
              <div className="p-4 bg-ivory-50 border border-warm-100 rounded-2xl flex items-start gap-3">
                <input type="checkbox" defaultChecked disabled className="mt-1 rounded border-warm-300 text-forest-600" />
                <div>
                  <p className="text-sm font-bold text-charcoal-800">Mandatory Device Auditing</p>
                  <p className="text-xs text-warm-500 font-medium">Automatic telemetry capture of browser user agent, IP address and unique cryptographic fingerprint signatures.</p>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-charcoal-950 flex items-center gap-2">
                <Sliders className="text-forest-700" size={20} /> Configure Language & Timezone
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">Preferred Language</label>
                  <Select
                    className="w-full border border-warm-200 rounded-xl px-4 py-2.5 font-semibold text-sm bg-transparent"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option>English</option>
                    <option>Français</option>
                    <option>Español</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-warm-700 uppercase tracking-wider mb-2">Explicit Timezone Context</label>
                  <Select
                    className="w-full border border-warm-200 rounded-xl px-4 py-2.5 font-semibold text-sm bg-transparent"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                  >
                    <option>UTC</option>
                    <option>GMT</option>
                    <option>America/New_York</option>
                    <option>Europe/London</option>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-charcoal-950 flex items-center gap-2">
                <Building className="text-forest-700" size={20} /> Authorized School Membership Mappings
              </h3>
              <p className="text-xs text-warm-500 font-medium">Review authorized school roles linked by platform system operators.</p>
              <div className="space-y-2">
                {user?.memberships?.map((m: any) => (
                  <div key={m.id} className="p-4 bg-ivory-50 border border-warm-100 rounded-2xl flex justify-between items-center">
                    <span className="text-sm font-bold text-charcoal-800">{m.school?.name}</span>
                    <span className="text-[11px] font-semibold uppercase tracking-wide bg-sage-50 text-forest-800 border border-sage-200 px-2.5 py-1 rounded-full">
                      {m.role?.name || "Member"}
                    </span>
                  </div>
                )) || <p className="text-xs text-warm-400">No organizational memberships found.</p>}
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 bg-forest-700 text-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-xs shadow-forest-700/20">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-semibold text-charcoal-950 tracking-tight">Setup Complete!</h2>
              <p className="text-sm font-medium text-warm-500 max-w-sm mx-auto leading-relaxed">
                Your enterprise account settings have been safely initialized on server records.
              </p>
            </div>
          )}
        </div>

        {/* Wizard Footer Controls */}
        <div className="bg-ivory-50 border-t border-warm-100 px-8 py-5 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={step === 1}
            className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-warm-500 hover:text-charcoal-900 transition-colors ${
              step === 1 ? "opacity-30 pointer-events-none" : ""
            }`}
          >
            <ArrowLeft size={14} /> Back
          </button>

          {step < 7 ? (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-5 py-2.5 bg-charcoal-950 hover:bg-charcoal-800 text-white text-xs font-semibold uppercase tracking-wide rounded-xl shadow-md transition-all"
            >
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleCompleteOnboarding}
              className="flex items-center gap-2 px-6 py-2.5 bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold uppercase tracking-wide rounded-xl shadow-lg transition-all"
            >
              Enter Dashboard <Check size={14} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
