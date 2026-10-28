import { PLATFORM_ROLES, PlatformRole } from './platform-roles';

const PLATFORM_ROLE_DESCRIPTIONS: Record<PlatformRole, string> = {
  [PLATFORM_ROLES.SUPER_ADMIN]:
    'Unrestricted platform super administrator. Reserved for emergency and ownership-level operations.',
  [PLATFORM_ROLES.OPERATIONS_ADMIN]:
    'Platform operations administrator responsible for schools, users, billing visibility, maintenance and announcements.',
  [PLATFORM_ROLES.SUPPORT_ADMIN]:
    'Read-only platform support administrator. Tenant data access requires an approved, time-limited support grant.',
};

export async function ensurePlatformRoles(client: any) {
  const roles: Record<string, { id: string; name: string }> = {};

  for (const [name, description] of Object.entries(PLATFORM_ROLE_DESCRIPTIONS)) {
    let role = await client.role.findFirst({
      where: { name, schoolId: null },
    });

    if (!role) {
      role = await client.role.create({
        data: {
          name,
          description,
          isSystem: true,
          schoolId: null,
        },
      });
    }

    roles[name] = role;
  }

  return roles as Record<PlatformRole, { id: string; name: string }>;
}

export async function assignPlatformRole(
  client: any,
  userId: string,
  roleId: string,
) {
  const existing = await client.userRole.findFirst({
    where: { userId, roleId, schoolId: null },
  });

  if (!existing) {
    await client.userRole.create({
      data: { userId, roleId, schoolId: null },
    });
  }
}

export async function provisionPlatformSuperAdmin(
  client: any,
  userId: string,
) {
  const roles = await ensurePlatformRoles(client);
  await assignPlatformRole(client, userId, roles[PLATFORM_ROLES.SUPER_ADMIN].id);
  return roles;
}
