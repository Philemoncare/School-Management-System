"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "../lib/api/client";

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

export function AuthProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSchoolId, setActiveSchoolId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const savedSchoolId = localStorage.getItem("schoolId");
    setActiveSchoolId(savedSchoolId);
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const userData = await apiFetch("/auth/me");
      setUser(userData);

      if (userData.memberships?.length > 0 && !activeSchoolId) {
        const first = userData.memberships[0].schoolId;
        setActiveSchoolId(first);
        localStorage.setItem("schoolId", first);
      }
    } catch (err) {
      logout();
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, pass: string) {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password: pass }),
    });

    if (data.mfaRequired) {
      return data;
    }

    setUser(data.user);

    const memberships = data.user.memberships || [];

    if (memberships.length > 1) {
      router.push("/select-school");
    } else if (memberships.length === 1) {
      const sid = memberships[0].schoolId;
      setActiveSchoolId(sid);
      localStorage.setItem("schoolId", sid);
      redirectAfterLogin(data.user);
    } else if (
      data.user.userRoles?.some((ur: any) => ur.role.name === "SUPER_ADMIN")
    ) {
      router.push("/super-admin");
    } else {
      router.push("/dashboard");
    }
  }

  function redirectAfterLogin(userData: any) {
    const role = userData.userRoles?.[0]?.role.name;
    if (role === "SUPER_ADMIN") router.push("/super-admin");
    else if (role === "TEACHER") router.push("/teacher/dashboard");
    else if (role === "ACCOUNTANT") router.push("/accountant/dashboard");
    else router.push("/dashboard");
  }

  function selectSchool(schoolId: string) {
    setActiveSchoolId(schoolId);
    localStorage.setItem("schoolId", schoolId);
    redirectAfterLogin(user);
  }

  async function logout() {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Ignore server logout failure and continue local cleanup.
    }

    localStorage.removeItem("schoolId");
    setUser(null);
    setActiveSchoolId(null);
    router.push("/login");
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
