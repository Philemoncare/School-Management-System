"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useChild } from "@/context/child-context";
import { useAuth } from "@/context/auth-context";
import { collectUserRoles } from "@/lib/auth/roles";
import { ChevronDown, Check, GraduationCap } from "lucide-react";

export function ChildSwitcher() {
  const { user, activeSchoolId } = useAuth();
  const { children, activeChild, setActiveChild, loading } = useChild();
  const [isOpen, setIsOpen] = useState(false);

  const isParent = collectUserRoles(user, activeSchoolId).some(
    (role) => role === "PARENT" || role === "GUARDIAN",
  );

  if (!isParent || loading || children.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-xl border border-warm-200 bg-card px-2.5 py-1.5 transition-colors hover:border-sage-300 hover:bg-sage-50 group"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-terracotta-500 text-[11px] font-bold text-white">
          {activeChild?.firstName?.[0]}
        </div>
        <div className="hidden text-left sm:block">
          <p className="mb-0.5 text-[11px] font-bold uppercase leading-none tracking-wide text-warm-500">
            Viewing child
          </p>
          <p className="text-[11px] font-bold leading-none text-charcoal-900">
            {activeChild?.firstName} {activeChild?.lastName}
          </p>
        </div>
        <ChevronDown
          size={14}
          className={`text-warm-400 transition-transform group-hover:text-forest-700 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-panel animate-in fade-in zoom-in-95 duration-200">
            <div className="border-b border-warm-200/80 bg-ivory-100 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
                Select child
              </p>
            </div>
            <div className="space-y-1 p-2">
              {children.map((child) => (
                <button
                  key={child.id}
                  onClick={() => {
                    setActiveChild(child);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl p-2 text-left transition-all ${
                    activeChild?.id === child.id
                      ? "bg-sage-100 text-forest-900"
                      : "text-warm-700 hover:bg-ivory-100"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                      activeChild?.id === child.id
                        ? "bg-forest-900 text-ivory-100"
                        : "bg-warm-100 text-warm-500"
                    }`}
                  >
                    {child.firstName?.[0]}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-bold">
                      {child.firstName} {child.lastName}
                    </p>
                    <p className="text-[11px] font-medium text-warm-500">
                      {child.relation} / {child.enrollments?.[0]?.class?.name || "No active class"}
                    </p>
                  </div>
                  {activeChild?.id === child.id && <Check size={16} className="text-forest-700" />}
                </button>
              ))}
            </div>
            <div className="border-t border-warm-200/80 p-2">
              <Link
                href="/parent/children"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl p-2 text-[11px] font-bold text-warm-500 transition-all hover:bg-sage-100 hover:text-forest-800"
              >
                <GraduationCap size={14} />
                Family overview
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
