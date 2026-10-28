"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Bell, MessageSquare, User } from "lucide-react";

export function MobileNavigation() {
  const pathname = usePathname();

  const navItems = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Search", href: "/search", icon: Search },
    { label: "Alerts", href: "/dashboard/notifications", icon: Bell },
    { label: "Inbox", href: "/dashboard/messages", icon: MessageSquare },
    { label: "Me", href: "/profile", icon: User },
  ];

  return (
    <nav className="md:hidden bg-card border-t border-warm-200 h-16 flex items-center justify-around px-2 shrink-0 z-30">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-1 w-full h-full transition-colors ${
              isActive ? "text-forest-700" : "text-warm-500 hover:text-charcoal-900"
            }`}
          >
            <item.icon size={20} className={isActive ? "fill-sage-50" : ""} />
            <span className="text-[11px] font-bold uppercase tracking-tight">
              {item.label}
            </span>
            {isActive && <div className="absolute bottom-0 w-8 h-1 bg-forest-700 rounded-t-full" />}
          </Link>
        );
      })}
    </nav>
  );
}
