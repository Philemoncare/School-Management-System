/**
 * Canonical platform role and permission definitions.
 *
 * These roles are deliberately separate from school-owned roles. School roles
 * are scoped to a single tenant and must never grant platform capabilities.
 */
export const PLATFORM_ROLES = {
  SUPER_ADMIN: 'PLATFORM_SUPER_ADMIN',
  OPERATIONS_ADMIN: 'PLATFORM_OPERATIONS_ADMIN',
  SUPPORT_ADMIN: 'PLATFORM_SUPPORT_ADMIN',
} as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[keyof typeof PLATFORM_ROLES];

export const PLATFORM_ROLE_VALUES: PlatformRole[] = Object.values(PLATFORM_ROLES);

/** Roles that may read platform-level operational information. */
export const PLATFORM_READ_ROLES = [
  PLATFORM_ROLES.SUPER_ADMIN,
  PLATFORM_ROLES.OPERATIONS_ADMIN,
  PLATFORM_ROLES.SUPPORT_ADMIN,
  'SUPER_ADMIN',
] as const;

/** Roles that may perform non-destructive platform operations. */
export const PLATFORM_OPERATOR_ROLES = [
  PLATFORM_ROLES.SUPER_ADMIN,
  PLATFORM_ROLES.OPERATIONS_ADMIN,
  'SUPER_ADMIN',
] as const;

/** Roles reserved for sensitive or irreversible platform changes. */
export const PLATFORM_SUPER_ROLES = [
  PLATFORM_ROLES.SUPER_ADMIN,
  'SUPER_ADMIN',
] as const;

export const SCHOOL_ROLES = {
  ADMIN: 'SCHOOL_ADMIN',
  PRINCIPAL: 'PRINCIPAL',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  GUARDIAN: 'GUARDIAN',
  ACCOUNTANT: 'ACCOUNTANT',
  LIBRARIAN: 'LIBRARIAN',
  HR: 'HR_OFFICER',
  RECEPTIONIST: 'RECEPTIONIST',
  NURSE: 'NURSE',
} as const;

/**
 * Legacy values remain readable during the transition, but they are expanded
 * into canonical roles at the authentication boundary.
 */
export const LEGACY_ROLE_ALIASES: Record<string, string[]> = {
  SUPER_ADMIN: [PLATFORM_ROLES.SUPER_ADMIN],
  ADMIN: [SCHOOL_ROLES.ADMIN],
  PARENT: [SCHOOL_ROLES.GUARDIAN],
};

const ALL_SCHOOL_PERMISSIONS = [
  'school.dashboard.read',
  'school.students.read',
  'school.students.manage',
  'school.staff.read',
  'school.staff.manage',
  'school.academics.read',
  'school.academics.manage',
  'school.attendance.read',
  'school.attendance.manage',
  'school.assessments.read',
  'school.assessments.manage',
  'school.results.read',
  'school.results.manage',
  'school.finance.read',
  'school.finance.manage',
  'school.library.read',
  'school.library.manage',
  'school.transport.read',
  'school.transport.manage',
  'school.hr.read',
  'school.hr.manage',
  'school.settings.read',
  'school.settings.manage',
  'school.users.read',
  'school.users.manage',
  'school.audit.read',
  'school.reports.read',
  'school.announcements.read',
  'school.announcements.manage',
  'school.health.view',
  'school.health.manage',
  'health.view',
  'health.create',
  'health.update',
  'health.visit.view',
  'health.visit.create',
  'health.visit.update',
  'health.incident.create',
  'health.medication.administer',
  'health.care_plan.manage',
  'health.document.upload',
  'health.screening.manage',
  'health.immunization.manage',
  'health.consent.manage',
  'health.referral.manage',
  'health.break_glass',
];

export const PLATFORM_PERMISSION_MATRIX: Record<PlatformRole, string[]> = {
  [PLATFORM_ROLES.SUPER_ADMIN]: ['*'],
  [PLATFORM_ROLES.OPERATIONS_ADMIN]: [
    'platform.dashboard.read',
    'platform.schools.read',
    'platform.schools.update',
    'platform.schools.approve',
    'platform.users.read',
    'platform.users.status',
    'platform.plans.read',
    'platform.billing.read',
    'platform.invoices.read',
    'platform.payments.read',
    'platform.maintenance.read',
    'platform.maintenance.manage',
    'platform.announcements.read',
    'platform.announcements.manage',
    'platform.settings.read',
    'platform.monitoring.read',
    'platform.audit.read',
    'platform.security.read',
    'platform.launch.readiness.read',
  ],
  [PLATFORM_ROLES.SUPPORT_ADMIN]: [
    'platform.dashboard.read',
    'platform.schools.read',
    'platform.users.read',
    'platform.maintenance.read',
    'platform.monitoring.read',
    'platform.audit.read',
    'platform.security.read',
    'platform.support.request',
  ],
};

export const SCHOOL_PERMISSION_MATRIX: Record<string, string[]> = {
  [SCHOOL_ROLES.ADMIN]: ALL_SCHOOL_PERMISSIONS,
  [SCHOOL_ROLES.PRINCIPAL]: [
    'school.dashboard.read',
    'school.students.read',
    'school.staff.read',
    'school.academics.read',
    'school.attendance.read',
    'school.assessments.read',
    'school.results.read',
    'school.reports.read',
    'school.announcements.read',
  ],
  [SCHOOL_ROLES.TEACHER]: [
    'school.dashboard.read',
    'school.students.read',
    'school.academics.read',
    'school.attendance.read',
    'school.attendance.manage',
    'school.assessments.read',
    'school.assessments.manage',
    'school.results.read',
    'school.announcements.read',
  ],
  [SCHOOL_ROLES.STUDENT]: [
    'school.dashboard.read',
    'school.attendance.read.own',
    'school.assessments.read.own',
    'school.results.read.own',
    'school.announcements.read',
  ],
  [SCHOOL_ROLES.GUARDIAN]: [
    'school.dashboard.read',
    'school.attendance.read.children',
    'school.results.read.children',
    'school.finance.read.children',
    'school.announcements.read',
  ],
  [SCHOOL_ROLES.ACCOUNTANT]: [
    'school.dashboard.read',
    'school.finance.read',
    'school.finance.manage',
    'school.reports.read',
  ],
  [SCHOOL_ROLES.LIBRARIAN]: [
    'school.dashboard.read',
    'school.library.read',
    'school.library.manage',
  ],
  [SCHOOL_ROLES.HR]: [
    'school.dashboard.read',
    'school.staff.read',
    'school.staff.manage',
    'school.hr.read',
    'school.hr.manage',
    'school.announcements.read',
  ],
  [SCHOOL_ROLES.RECEPTIONIST]: [
    'school.dashboard.read',
    'school.students.read',
    'school.announcements.read',
  ],
  [SCHOOL_ROLES.NURSE]: [
    'school.dashboard.read',
    'school.students.read',
    'school.announcements.read',
    'health.view',
    'health.create',
    'health.update',
    'health.visit.view',
    'health.visit.create',
    'health.visit.update',
    'health.incident.create',
    'health.medication.administer',
    'health.care_plan.manage',
    'health.document.upload',
    'health.screening.manage',
    'health.immunization.manage',
    'health.consent.manage',
    'health.referral.manage',
    'health.break_glass',
  ],
};

export function isPlatformRole(role: string): role is PlatformRole {
  return (PLATFORM_ROLE_VALUES as string[]).includes(role);
}

export function expandRoleAliases(roles: Iterable<string>): string[] {
  const expanded = new Set<string>();
  for (const role of roles) {
    expanded.add(role);
    for (const alias of LEGACY_ROLE_ALIASES[role] ?? []) expanded.add(alias);
  }
  return Array.from(expanded);
}

export function isPlatformSuperAdmin(roles: Iterable<string>): boolean {
  return expandRoleAliases(roles).includes(PLATFORM_ROLES.SUPER_ADMIN);
}

export function platformPermissionsFor(roles: Iterable<string>): string[] {
  const permissions = new Set<string>();
  for (const role of expandRoleAliases(roles)) {
    if (isPlatformRole(role)) {
      for (const permission of PLATFORM_PERMISSION_MATRIX[role]) {
        permissions.add(permission);
      }
    }
  }
  return Array.from(permissions);
}

export function schoolPermissionsFor(roleNames: Iterable<string>): string[] {
  const permissions = new Set<string>();
  for (const role of expandRoleAliases(roleNames)) {
    for (const permission of SCHOOL_PERMISSION_MATRIX[role] ?? []) {
      permissions.add(permission);
    }
  }
  return Array.from(permissions);
}
