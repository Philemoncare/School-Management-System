# Tenant Isolation Strategy

## Core Requirement
Data from School A must NEVER be accessible to a user from School B.

## Multi-Level Isolation
1. **Request Level:** The `TenantGuard` extracts the school ID from the request and validates the user's membership.
2. **Context Level:** The validated `schoolId` is attached to the request object.
3. **Application Level:** Services use an `@ActiveSchool()` decorator to retrieve the current tenant context.
4. **Data Level:** All Prisma queries for tenant-owned resources MUST include a `where: { schoolId }` filter.

## Cross-Tenant Protection
- If a user attempts to access a resource in a different school, the `TenantGuard` throws a `403 Forbidden` exception.
- API endpoints that accept a `schoolId` parameter are validated against the user's authorized memberships.
