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
  // The JWT `roles` claim is the authoritative role set for the active
  // session, while `userRoles` carries the richer database rows used for
  // permission screens. Merge both instead of choosing one: accounts whose
  // role row belongs to a legacy/global record previously lost their portal
  // navigation (for example a parent without a GUARDIAN row in this tenant).
  const roles = new Set<string>();

  if (Array.isArray(user?.roles)) {
    for (const role of user.roles) {
      if (typeof role === "string" && role.trim()) roles.add(role);
    }
  }

  if (Array.isArray(user?.userRoles)) {
    for (const userRole of user.userRoles) {
      const roleSchoolId =
        userRole?.role?.schoolId ?? userRole?.schoolId ?? null;
      const matchesScope =
        !roleSchoolId ||
        schoolId == null ||
        roleSchoolId === schoolId;
      if (!matchesScope) continue;

      const name = userRole?.role?.name || userRole?.role || userRole;
      if (typeof name === "string" && name.trim()) roles.add(name);
    }
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
