"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  SUPER_ADMIN_NAV,
  SCHOOL_NAV,
  TEACHER_NAV,
  STUDENT_NAV,
  PARENT_NAV,
  ACCOUNTANT_NAV,
  LIBRARIAN_NAV,
  HR_NAV,
  RECEPTIONIST_NAV,
  TRANSPORT_NAV,
  HEALTH_NAV,
  NavigationSection,
} from "@/config/navigation";
import { LogOut, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { BrandLockup, BrandMark } from "@/components/brand/schoolma-logo";
import {
  collectUserRoles,
  getActiveSupportGrantId,
  isPlatformAdmin,
  isPlatformSuperAdmin,
} from "@/lib/auth/roles";

interface SidebarProps {
  isCollapsed?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isCollapsed = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, activeSchoolId, logout } = useAuth();

  const userRoles = collectUserRoles(user, activeSchoolId);
  const isSuperAdmin = isPlatformSuperAdmin(userRoles);
  const supportGrantId = getActiveSupportGrantId();

  const getNavSections = (): NavigationSection[] => {
    // Only actual platform super admins see the super admin portal — never school admins
    if (isSuperAdmin) return SUPER_ADMIN_NAV;
    if (supportGrantId && !pathname.startsWith("/super-admin")) return SCHOOL_NAV;
    if (pathname.startsWith("/teacher")) return TEACHER_NAV;
    if (pathname.startsWith("/student")) return STUDENT_NAV;
    if (pathname.startsWith("/parent")) return PARENT_NAV;
    if (pathname.startsWith("/accountant")) return ACCOUNTANT_NAV;
    if (pathname.startsWith("/librarian")) return LIBRARIAN_NAV;
    if (pathname.startsWith("/hr")) return HR_NAV;
    if (pathname.startsWith("/receptionist")) return RECEPTIONIST_NAV;
    if (pathname.startsWith("/transport")) return TRANSPORT_NAV;
    if (pathname.startsWith("/health")) return HEALTH_NAV;

    if (userRoles.includes("TEACHER")) return TEACHER_NAV;
    if (userRoles.includes("STUDENT")) return STUDENT_NAV;
    if (userRoles.includes("PARENT") || userRoles.includes("GUARDIAN")) return PARENT_NAV;
    if (userRoles.includes("ACCOUNTANT")) return ACCOUNTANT_NAV;
    if (userRoles.includes("LIBRARIAN")) return LIBRARIAN_NAV;
    if (userRoles.includes("HR")) return HR_NAV;

    return SCHOOL_NAV;
  };

  const navSections = getNavSections();

  const fullName =
    user?.name || `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "User";
  const roleDisplay = userRoles[0]?.replace("_", " ") || "Member";
  const initials = fullName
    ? fullName
        .split(" ")
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "S";

  return (
    <div className="h-full flex flex-col bg-ivory-50 text-charcoal-900 select-none">
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-warm-200",
          isCollapsed ? "justify-center px-2" : "justify-between px-5"
        )}
      >
        <Link
          href="/dashboard"
          onClick={onClose}
          className="flex items-center rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600/30"
          aria-label="SchooMA home"
        >
          {isCollapsed ? (
            <BrandMark size={36} />
          ) : (
            <BrandLockup markSize={36} subtitle="School Operations" />
          )}
        </Link>
        {onClose && (
          <button
            onClick={onClose}
            className="md:hidden p-2 text-warm-500 hover:text-forest-800 hover:bg-sage-100 rounded-xl transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            aria-label="Close navigation menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!isCollapsed && (
        <div className="flex items-center justify-between px-5 pb-1 pt-4">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-warm-500">
            Workspace
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-forest-700">
            {isSuperAdmin ? "Platform" : "School"}
          </span>
        </div>
      )}

      <div className={cn("flex-1 overflow-y-auto py-4 space-y-5 scrollbar-thin", isCollapsed ? "px-2" : "px-3")}>
        {navSections.map((section, sIdx) => {
          const filteredItems = section.items.filter((item) => {
          if (!item.roles || item.roles.length === 0) return true;
          if (isSuperAdmin) return true;
          return userRoles.some((r) => item.roles?.includes(r));
        });

          if (filteredItems.length === 0) return null;

          return (
            <div key={`${section.title}-${sIdx}`} className="space-y-1.5">
              {!isCollapsed && (
                <h5 className="px-3 text-[11px] font-bold text-warm-500 uppercase tracking-wide">
                  {section.title}
                </h5>
              )}
              <div className="space-y-0.5">
                {filteredItems.map((item) => {
                  const Icon = item.icon;
                  const isExact = pathname === item.href;
                  const isSub =
                    item.href !== "/dashboard" &&
                    item.href !== "/super-admin" &&
                    pathname.startsWith(item.href);
                  const active = isExact || isSub;

                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "sidebar-link group min-h-[40px]",
                        isCollapsed && "justify-center px-0",
                        active
                          ? "border border-forest-200 bg-forest-50 font-semibold text-forest-900"
                          : "border border-transparent text-warm-600 hover:bg-warm-100 hover:text-forest-900"
                      )}
                    >
                      {active && (
                        <span className="absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 bg-forest-600" />
                      )}
                      <Icon
                        className={cn(
                          "w-[17px] h-[17px] shrink-0 transition-colors",
                          active
                            ? "text-forest-700"
                            : "text-warm-400 group-hover:text-forest-600"
                        )}
                      />
                      {!isCollapsed && (
                        <>
                          <span className="flex-1 truncate">{item.label}</span>
                          {item.badge && (
                            <span className="px-1.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wide bg-terracotta-100 text-terracotta-800">
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                      {isCollapsed && (
                        <span className="absolute left-full ml-3 px-3 py-1.5 bg-forest-900 text-ivory-100 text-[11px] font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity border border-forest-700 shadow-xs z-50 whitespace-nowrap">
                          {item.label}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className={cn("border-t border-warm-200/80 shrink-0", isCollapsed ? "p-2" : "p-3")}>
        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg border border-warm-200 bg-card p-2",
            isCollapsed && "flex-col justify-center gap-2 border-transparent bg-transparent p-0"
          )}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-forest-800 text-[11px] font-semibold text-ivory-50">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1 px-0.5">
              <p className="truncate text-xs font-semibold text-charcoal-900">{fullName}</p>
              <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-warm-500">
                {roleDisplay}
              </p>
            </div>
          )}
          <button
            onClick={() => logout()}
            className={cn(
              "flex min-h-[34px] min-w-[34px] items-center justify-center rounded-md text-warm-500 transition-colors hover:bg-warm-100 hover:text-danger-600",
              isCollapsed && "border border-warm-200 bg-card"
            )}
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
