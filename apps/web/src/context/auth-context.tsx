"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { apiFetch } from "../lib/api/client";
import { collectUserRoles, isPlatformAdmin } from "../lib/auth/roles";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  logout: () => void;
  isAuthenticated: boolean;
  activeSchoolId: string | null;
  selectSchool: (schoolId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_ROUTES = ['/', '/login', '/register-school', '/forgot-password', '/reset-password', '/verify-email', '/register'];

export function getRoleLanding(userData: any, schoolId?: string | null) {
  const roles = collectUserRoles(userData, schoolId);

  if (isPlatformAdmin(roles)) return "/super-admin";
  if (roles.includes("TEACHER")) return "/teacher/dashboard";
  if (roles.includes("ACCOUNTANT")) return "/accountant/dashboard";
  if (roles.includes("LIBRARIAN")) return "/librarian/dashboard";
  if (roles.includes("RECEPTIONIST")) return "/receptionist/dashboard";
  if (roles.includes("PARENT") || roles.includes("GUARDIAN")) return "/parent/dashboard";
  if (roles.includes("STUDENT")) return "/student/dashboard";

  return "/dashboard";
}

export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const logout = useCallback(async (redirect = true) => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore server logout failure
    }

    localStorage.removeItem("schoolId");
    localStorage.removeItem("token");
    localStorage.removeItem("supportGrantId");
    setUser(null);
    setActiveSchoolId(null);

    // Remove cookie by setting it to expired
    if (typeof document !== 'undefined') {
      document.cookie = "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    }

    if (redirect && !PUBLIC_ROUTES.includes(pathname)) {
      router.push("/login");
    }
  }, [pathname, router]);

  const loadUser = useCallback(async () => {
    try {
      const userData = await apiFetch("/auth/me");
      setUser(userData);

      const savedSchoolId = localStorage.getItem("schoolId");
      const supportGrantId = localStorage.getItem("supportGrantId");
      if (userData.memberships?.length > 0) {
        const hasSavedSchool = userData.memberships.some((m: any) => m.schoolId === savedSchoolId);
        if (hasSavedSchool && savedSchoolId) {
            setActiveSchoolId(savedSchoolId);
        } else {
            const first = userData.memberships[0].schoolId;
            setActiveSchoolId(first);
            localStorage.setItem("schoolId", first);
        }
      } else if (supportGrantId && savedSchoolId) {
        setActiveSchoolId(savedSchoolId);
      } else {
        setActiveSchoolId(null);
        localStorage.removeItem("schoolId");
      }
    } catch (err) {
      // If we're on a public route, don't force logout/redirect
      if (!PUBLIC_ROUTES.includes(pathname)) {
        logout(true);
      } else {
        setUser(null);
        setActiveSchoolId(null);
      }
    } finally {
      setLoading(false);
    }
  }, [pathname, logout]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const redirectAfterLogin = useCallback((userData: any, schoolId?: string | null) => {
    router.push(getRoleLanding(userData, schoolId));
  }, [router]);

  async function login(email: string, pass: string) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
    });

    if (data.otpRequired) {
      return data;
    }

    if (data.access_token) {
        localStorage.setItem("token", data.access_token);
    } else if (data.session_token) {
        localStorage.setItem("token", data.session_token);
    }

    setUser(data.user);

    const memberships = data.user.memberships || [];

    if (memberships.length > 1) {
      router.push("/select-school");
    } else if (memberships.length === 1) {
      const sid = memberships[0].schoolId;
      setActiveSchoolId(sid);
      localStorage.setItem("schoolId", sid);
      redirectAfterLogin(data.user, sid);
    } else {
      setActiveSchoolId(null);
      localStorage.removeItem("schoolId");
      redirectAfterLogin(data.user);
    }
  }

  function selectSchool(schoolId: string) {
    setActiveSchoolId(schoolId);
    localStorage.setItem("schoolId", schoolId);
    redirectAfterLogin(user, schoolId);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        activeSchoolId,
        selectSchool,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
