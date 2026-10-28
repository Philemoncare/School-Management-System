"use client";

import React, { useState } from "react";
import { ChevronDown, Building2, Check } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { collectUserRoles, isPlatformAdmin } from "@/lib/auth/roles";

export function SchoolSwitcher() {
  const { user, activeSchoolId, selectSchool } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const memberships = user?.memberships || [];
  const activeMembership = memberships.find((m: any) => m.schoolId === activeSchoolId);
  const activeSchool = activeMembership?.school;

  if (!activeSchool && !isPlatformAdmin(collectUserRoles(user, activeSchoolId))) {
    return null;
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-xl border border-transparent px-2 py-1.5 text-left transition-colors hover:border-warm-200 hover:bg-card group"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-sage-300 bg-sage-100">
          {activeSchool?.logo ? (
            <img src={activeSchool.logo} alt="" className="h-5 w-5 object-contain" />
          ) : (
            <Building2 className="text-forest-700" size={16} />
          )}
        </div>
        <div className="hidden max-w-[168px] lg:block">
          <p className="truncate text-[11px] font-bold uppercase leading-tight tracking-[0.06em] text-charcoal-900">
            {activeSchool?.name || "Platform Admin"}
          </p>
          <p className="truncate text-[11px] font-bold uppercase tracking-wide text-warm-500">
            {activeMembership?.role?.name || "Super administrator"}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`text-warm-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && memberships.length > 1 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-64 rounded-2xl border border-warm-200 bg-card py-2 shadow-panel animate-in fade-in zoom-in-95 duration-200">
            <p className="px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-warm-500">
              Switch school workspace
            </p>
            <div className="max-h-[300px] overflow-y-auto scrollbar-thin">
              {memberships.map((m: any) => (
                <button
                  key={m.schoolId}
                  onClick={() => {
                    selectSchool(m.schoolId);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-sage-100 ${
                    m.schoolId === activeSchoolId ? "bg-sage-50" : ""
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-warm-200 bg-ivory-100">
                    <Building2 size={15} className="text-warm-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-xs font-bold ${
                        m.schoolId === activeSchoolId ? "text-forest-800" : "text-charcoal-900"
                      }`}
                    >
                      {m.school.name}
                    </p>
                    <p className="truncate text-[11px] font-medium text-warm-500">{m.role.name}</p>
                  </div>
                  {m.schoolId === activeSchoolId && (
                    <Check size={16} className="shrink-0 text-forest-700" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
