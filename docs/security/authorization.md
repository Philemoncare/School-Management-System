# Authorization Architecture

## Overview
Authorization is enforced at multiple levels: Platform Roles, Tenant Roles, and Resource-level permissions.

## Levels of Authorization
1. **Authentication Guard (`JwtAuthGuard`):** Verifies that the user is who they claim to be.
2. **Tenant Guard (`TenantGuard`):** Verifies that the user has an active membership in the school they are trying to access. It enforces the `x-school-id` context.
3. **Roles Guard (`RolesGuard`):** Enforces high-level role requirements (e.g., `SUPER_ADMIN`).
4. **Permissions Guard (`PermissionsGuard`):** Enforces granular action-based permissions (e.g., `students.create`).

## Enforcement Strategy
- **Backend First:** All security rules are implemented on the server.
- **Explicit Context:** Services and Repositories use the injected `schoolId` to scope all database operations.
- **Platform vs Tenant:** `SUPER_ADMIN` can perform platform-level actions, while `SCHOOL_ADMIN` and other roles are strictly confined to their school context.
