"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { collectUserRoles, isPlatformAdmin } from "@/lib/auth/roles";
import { Home, Search, Bell, MessageSquare, User } from "lucide-react";

export function MobileNavigation() {
  const pathname = usePathname();
  const { user, activeSchoolId } = useAuth();
  const userRoles = collectUserRoles(user, activeSchoolId);
  const isSuper = isPlatformAdmin(userRoles);

  const homeHref = pathname.startsWith("/super-admin") || isSuper
    ? "/super-admin"
    : pathname.startsWith("/teacher")
    ? "/teacher/dashboard"
    : pathname.startsWith("/student")
    ? "/student/dashboard"
    : pathname.startsWith("/parent")
    ? "/parent/dashboard"
    : pathname.startsWith("/accountant")
    ? "/accountant/dashboard"
    : pathname.startsWith("/librarian")
    ? "/librarian/dashboard"
    : pathname.startsWith("/receptionist")
    ? "/receptionist/dashboard"
    : "/dashboard";

  const navItems = [
    { label: "Home", href: homeHref, icon: Home },
    { label: "Search", href: "/search/advanced", icon: Search },
    { label: "Alerts", href: "/dashboard/announcements", icon: Bell },
    { label: "Messages", href: "/dashboard/messages", icon: MessageSquare },
    { label: "Profile", href: "/profile", icon: User },
  ];

  const openSearch = (e: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      window.dispatchEvent(new Event("schoolma:command"));
    }
  };

  return (
    <nav className="md:hidden bg-card border-t border-warm-200 h-14 flex items-center justify-around px-1 shrink-0 z-30 safe-bottom">
      {navItems.map((item) => {
        const isSearch = item.label === "Search";
        const isActive = !isSearch && (pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href)));

        return isSearch ? (
          <button
            key={item.label}
            type="button"
            onClick={openSearch}
            className="flex flex-col items-center justify-center gap-0.5 w-full h-full text-warm-500 hover:text-forest-800 transition-colors"
            aria-label="Search workspace"
          >
            <item.icon size={18} />
            <span className="text-[10px] font-bold uppercase tracking-tight">
              {item.label}
            </span>
          </button>
        ) : (
          <Link
            key={item.label}
            href={item.href}
            className={`relative flex flex-col items-center justify-center gap-0.5 w-full h-full transition-colors ${
              isActive ? "text-forest-800 font-bold" : "text-warm-500 hover:text-charcoal-900"
            }`}
          >
            <item.icon size={18} className={isActive ? "text-forest-700" : ""} />
            <span className="text-[10px] uppercase tracking-tight">
              {item.label}
            </span>
            {isActive && <div className="absolute bottom-0 w-6 h-0.5 bg-forest-700 rounded-t-full" />}
          </Link>
        );
      })}
    </nav>
  );
}

