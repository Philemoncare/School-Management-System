"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import {
  User,
  Settings,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const fullName =
    user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "User";
  const role =
    (user.userRoles?.[0]?.role?.name || user.userRoles?.[0]?.role)?.replace("_", " ") ||
    user.roles?.[0]?.replace("_", " ") ||
    "Member";
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "K";

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 rounded-xl p-1 transition-colors hover:bg-sage-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-900 text-[11px] font-bold text-ivory-100 ring-2 ring-ivory-50">
          {user.avatar ? (
            <img src={user.avatar} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            initials
          )}
        </div>
        <div className="hidden md:flex flex-col text-left">
          <span className="text-xs font-semibold leading-tight text-charcoal-900">{fullName}</span>
          <span className="text-[11px] font-bold uppercase tracking-wide text-warm-500">{role}</span>
        </div>
        <ChevronDown
          size={14}
          className={`hidden text-warm-400 transition-transform duration-200 sm:block ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-warm-200 bg-card shadow-panel animate-in fade-in zoom-in-95 duration-150">
            <div className="border-b border-warm-200/80 bg-ivory-100 p-4">
              <p className="truncate text-sm font-bold text-charcoal-900">{fullName}</p>
              <p className="mt-0.5 truncate text-xs font-medium text-warm-500">{user.email}</p>
              <div className="mt-2.5 inline-flex items-center rounded-full border border-sage-300 bg-sage-100 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-forest-800">
                {role}
              </div>
            </div>

            <div className="p-1.5 space-y-0.5">
              <MenuLink href="/profile" icon={User} label="My profile" onClick={() => setIsOpen(false)} />
              <MenuLink href="/settings" icon={Settings} label="Settings" onClick={() => setIsOpen(false)} />
              <MenuLink href="/settings/security" icon={Shield} label="Security & sessions" onClick={() => setIsOpen(false)} />
              <MenuLink href="/dashboard/announcements" icon={Bell} label="Announcements" onClick={() => setIsOpen(false)} />
              <MenuLink href="/settings" icon={HelpCircle} label="Help & documentation" onClick={() => setIsOpen(false)} />
            </div>

            <div className="border-t border-warm-200/80 bg-ivory-100/60 p-1.5">
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-bold text-danger-600 transition-colors hover:bg-danger-50"
              >
                <LogOut size={15} />
                Sign out
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MenuLink({ href, icon: Icon, label, onClick }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-warm-700 transition-colors hover:bg-sage-100 hover:text-forest-900"
    >
      <Icon size={15} className="text-warm-400" />
      {label}
    </Link>
  );
}
