"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { TopBar } from "./topbar";
import { Breadcrumbs } from "./breadcrumbs";
import { CommandPalette } from "../search/command-palette";
import { GlobalFeedback } from "./global-feedback";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { useRealtime, useRealtimeEvent } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";

export function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { socket } = useRealtime();

  useRealtimeEvent(socket, "security.session.revoked", () => {
    void logout();
  });

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  // Lock body scroll when mobile menu is active
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <div className="h-12 w-12 rounded-2xl border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Initializing Workspace</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans selection:bg-terracotta-200 selection:text-forest-900">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[200] focus:rounded-xl focus:bg-forest-900 focus:px-4 focus:py-2.5 focus:text-xs focus:font-bold focus:text-ivory-100 focus:shadow-panel"
      >
        Skip to content
      </a>

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          "group/sidebar relative z-40 hidden shrink-0 flex-col border-r border-warm-200 bg-ivory-50 transition-[width] duration-200 ease-out md:flex",
          isSidebarCollapsed ? "w-[72px]" : "w-[256px] lg:w-[272px]"
        )}
      >
        <Sidebar isCollapsed={isSidebarCollapsed} />

        {/* Desktop Toggle Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute -right-3 top-9 w-6 h-6 bg-card border border-warm-200 rounded-full flex items-center justify-center opacity-0 group-hover/sidebar:opacity-100 transition-opacity z-50 hover:bg-sage-100 shadow-sm"
          aria-label="Toggle sidebar"
        >
          <div className={cn("w-1.5 h-1.5 border-t-2 border-l-2 border-forest-700 transition-transform", isSidebarCollapsed ? "rotate-[135deg]" : "-rotate-45")} />
        </button>
      </aside>

      {/* Main Layout Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <TopBar
          toggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Content Viewport */}
        <main
          id="main-content"
          className="relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth bg-background"
        >
          <div className="mx-auto max-w-[1440px] p-4 sm:p-6 lg:p-8">
            <div className="mb-4 sm:mb-6">
              <Breadcrumbs />
            </div>

            <div className="animate-slide-up">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-charcoal-950/50 animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Drawer Container */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            className="fixed inset-y-0 left-0 w-[286px] max-w-[86vw] bg-ivory-50 border-r border-warm-200 shadow-xs animate-in slide-in-from-left duration-300 ease-out"
          >
            <Sidebar isCollapsed={false} onClose={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      <CommandPalette />
      <GlobalFeedback />
    </div>
  );
}
