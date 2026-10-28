'use client';

import React from 'react';
import { useAuth } from '@/context/auth-context';
import { Building2, ArrowRight, LogOut, CheckCircle } from 'lucide-react';

export default function SelectSchoolPage() {
  const { user, selectSchool, logout, activeSchoolId } = useAuth();
  const memberships = user?.memberships || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center space-y-2">
        <h2 className="font-sans text-2xl font-semibold text-charcoal-900 tracking-tight">Choose a workspace</h2>
        <p className="text-xs sm:text-sm font-medium text-warm-500">
          Your account belongs to more than one school. Choose where you want to work today.
        </p>
      </div>

      <div className="grid gap-3">
        {memberships.map((m: any) => {
          const isSelected = m.school.id === activeSchoolId;
          return (
            <button
              key={m.school.id}
              onClick={() => selectSchool(m.school.id)}
              className={`w-full flex items-center justify-between p-5 rounded-2xl border text-left transition-all group ${
                isSelected
                  ? 'bg-sage-50/70 border-forest-600 shadow-md ring-1 ring-forest-600'
                  : 'bg-card border-warm-200 hover:border-forest-500 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                  isSelected ? 'bg-forest-700 text-white' : 'bg-warm-100 text-warm-600 group-hover:bg-sage-50 group-hover:text-forest-700'
                }`}>
                  <Building2 size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-charcoal-900">{m.school.name}</p>
                    {isSelected && <CheckCircle size={14} className="text-forest-600 shrink-0" />}
                  </div>
                  <p className="text-[11px] font-mono font-bold text-warm-400 uppercase tracking-wider mt-0.5">
                    {m.school.code} • Status: {m.status}
                  </p>
                </div>
              </div>
              <ArrowRight size={18} className={`transition-transform group-hover:translate-x-1 ${
                isSelected ? 'text-forest-600' : 'text-warm-300 group-hover:text-forest-600'
              }`} />
            </button>
          );
        })}
      </div>

      <div className="pt-4 border-t border-warm-100 flex justify-center">
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 text-xs font-bold text-warm-400 hover:text-danger-600 uppercase tracking-wider transition-colors py-2 px-3 rounded-xl hover:bg-danger-50"
        >
          <LogOut size={16} /> Sign out and use another account
        </button>
      </div>
    </div>
  );
}
