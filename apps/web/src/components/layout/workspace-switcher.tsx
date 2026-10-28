"use client";

import React, { useState } from "react";
import { Layout, Check, ChevronDown } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";

export function WorkspaceSwitcher() {
  const { user } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const roles = user?.userRoles?.map((ur: any) => ur.role.name) || [];

  const workspaces = [
    { name: "School Administration", role: "ADMIN", href: "/dashboard", icon: Layout },
    { name: "Academic Faculty", role: "TEACHER", href: "/dashboard", icon: Layout },
    { name: "Student Core Portal", role: "STUDENT", href: "/dashboard", icon: Layout },
    { name: "Guardian Dashboard", role: "PARENT", href: "/dashboard", icon: Layout },
    { name: "Financial Ledger", role: "ACCOUNTANT", href: "/dashboard", icon: Layout },
    { name: "Library Operations", role: "LIBRARIAN", href: "/dashboard", icon: Layout },
    { name: "Human Resource Systems", role: "HR", href: "/dashboard", icon: Layout },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-ivory-50 border border-warm-200 hover:bg-warm-100 rounded-xl text-[11px] font-bold text-warm-600 dark:bg-charcoal-800 dark:border-warm-700 dark:text-warm-300 dark:hover:bg-warm-700 uppercase tracking-wider transition-all select-none outline-none"
      >
        <span>Active Tenant Node</span>
        <ChevronDown size={11} className={`transition-transform duration-200 text-warm-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full left-0 mt-2 w-60 bg-card dark:bg-charcoal-900 border border-warm-200 dark:border-charcoal-800 rounded-2xl shadow-xs z-50 py-2 animate-in fade-in zoom-in-95 duration-150">
            <p className="px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-warm-400 select-none">Switch operational context</p>
            {workspaces.map((w) => (
              <button
                key={w.name}
                onClick={() => {
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-ivory-50 dark:hover:bg-charcoal-800/60 transition-colors text-left outline-none group"
              >
                <div className="w-7 h-7 rounded-lg bg-warm-100 dark:bg-charcoal-800 flex items-center justify-center shrink-0 text-warm-500 dark:text-warm-400 group-hover:scale-105 transition-transform">
                  <w.icon size={14} />
                </div>
                <span className="text-xs font-semibold text-warm-700 dark:text-warm-300 group-hover:text-charcoal-900 dark:group-hover:text-white">{w.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
