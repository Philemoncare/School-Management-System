export const PLATFORM_ROLES = {
  SUPER_ADMIN: "PLATFORM_SUPER_ADMIN",
  OPERATIONS_ADMIN: "PLATFORM_OPERATIONS_ADMIN",
  SUPPORT_ADMIN: "PLATFORM_SUPPORT_ADMIN",
} as const;

export const PLATFORM_ROLE_VALUES = Object.values(PLATFORM_ROLES);

export const LEGACY_ROLE_ALIASES: Record<string, string[]> = {
  SUPER_ADMIN: [PLATFORM_ROLES.SUPER_ADMIN],
  ADMIN: ["SCHOOL_ADMIN"],
  PARENT: ["GUARDIAN"],
};

export function expandRoleAliases(roles: Iterable<string>): string[] {
  const expanded = new Set<string>();
  for (const role of roles) {
    expanded.add(role);
    for (const alias of LEGACY_ROLE_ALIASES[role] ?? []) expanded.add(alias);
  }
  return Array.from(expanded);
}

export function collectUserRoles(
  user: any,
  schoolId?: string | null,
): string[] {
  let roles: string[] = [];

  if (Array.isArray(user?.userRoles)) {
    roles = user.userRoles
      .filter((userRole: any) => {
        const roleSchoolId =
          userRole?.role?.schoolId ?? userRole?.schoolId ?? null;
        return (
          !roleSchoolId ||
          (schoolId != null && roleSchoolId === schoolId)
        );
      })
      .map(
        (userRole: any) =>
          userRole?.role?.name || userRole?.role || userRole,
      )
      .filter(Boolean);
  } else if (Array.isArray(user?.roles)) {
    roles = user.roles;
  }

  return expandRoleAliases(roles);
}

export function isPlatformRole(role: string): boolean {
  return (PLATFORM_ROLE_VALUES as string[]).includes(role);
}

export function isPlatformAdmin(roles: Iterable<string>): boolean {
  return expandRoleAliases(roles).some(
    (role) => isPlatformRole(role) || role === "SUPER_ADMIN",
  );
}

export function isPlatformSuperAdmin(roles: Iterable<string>): boolean {
  return expandRoleAliases(roles).includes(PLATFORM_ROLES.SUPER_ADMIN);
}

export function getActiveSupportGrantId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("supportGrantId");
}

export function hasPlatformPermission(
  permissions: Iterable<string>,
  required: string,
): boolean {
  const set = new Set(permissions);
  return set.has("*") || set.has(required);
}
