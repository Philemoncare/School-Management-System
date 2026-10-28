"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "./auth-context";
import { collectUserRoles, isPlatformAdmin } from "@/lib/auth/roles";

interface PermissionContextType {
  permissions: string[];
  roles: string[];
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string | string[]) => boolean;
  isSuperAdmin: boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ children }: { children: React.ReactNode }) {
  const { user, activeSchoolId } = useAuth();

  const roles = useMemo(
    () => (user ? collectUserRoles(user, activeSchoolId) : []),
    [user, activeSchoolId],
  );

  const permissions = useMemo(() => {
    if (!user) return [];
    return [
      ...new Set([
        ...(user.platformPermissions || []),
        ...(user.schoolPermissions || []),
      ]),
    ];
  }, [user]);

  const isSuperAdmin = isPlatformAdmin(roles);

  const hasPermission = (permission: string) => {
    if (isSuperAdmin) return true;
    return permissions.includes(permission) || permissions.includes("*");
  };

  const hasRole = (role: string | string[]) => {
    if (isSuperAdmin) return true;
    if (Array.isArray(role)) {
      return role.some(r => roles.includes(r));
    }
    return roles.includes(role);
  };

  return (
    <PermissionContext.Provider value={{ permissions, roles, hasPermission, hasRole, isSuperAdmin }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermissions must be used within a PermissionProvider");
  }
  return context;
}
