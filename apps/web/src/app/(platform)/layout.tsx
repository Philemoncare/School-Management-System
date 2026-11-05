"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Sidebar } from "@/components/layout/sidebar";
import { useRealtime, useRealtimeEvent } from "@/hooks/use-realtime";
import { collectUserRoles, isPlatformSuperAdmin } from "@/lib/auth/roles";

interface PlatformLayoutProps {
  children: React.ReactNode;
}

export default function PlatformLayout({ children }: PlatformLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
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

  // Frontend guard: only platform super admins may enter the platform portal.
  // Backend authorization is the authoritative enforcement; this prevents
  // school admins from even rendering platform-only pages.
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      const roles = collectUserRoles(user, null);
      if (!isPlatformSuperAdmin(roles)) {
        router.push("/dashboard");
      }
    }
  }, [user, loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <div className="h-12 w-12 rounded-2xl border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
            Initializing Platform
          </p>
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

      {/* Platform Sidebar - Desktop */}
      <aside
        className="group/sidebar relative z-40 hidden shrink-0 flex-col border-r border-warm-200 bg-ivory-50 transition-[width] duration-200 ease-out md:flex w-[272px]"
      >
        <Sidebar />
      </aside>

      {/* Main Layout Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        <main
          id="main-content"
          className="relative flex-1 overflow-y-auto overflow-x-hidden scroll-smooth bg-background"
        >
          <div className="mx-auto max-w-[1440px] p-3 sm:p-6 lg:p-8">
            <div className="mb-3 sm:mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wide text-warm-500">
                  Platform
                </span>
              </div>
            </div>

            <div className="animate-slide-up">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
