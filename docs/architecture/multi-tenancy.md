# Multi-Tenancy Architecture

## Strategy: Logical Isolation
We use a shared database and shared schema model with logical partitioning via a `schoolId`.

### Why Logical Isolation?
1. **Operational Simplicity:** Easier to manage migrations, backups, and infrastructure.
2. **Cost Efficiency:** Shared resources reduce overhead for small schools.
3. **Scalability:** Can be partitioned at the database level (e.g., PostgreSQL Row-Level Security or Citus) if needed in the future.

## Implementation Rules
1. **Mandatory Filtering:** Every query for tenant-specific data MUST include the `schoolId`.
2. **Context Injection:** The `schoolId` is extracted from the authenticated user's token and injected into the request context.
3. **Global Interceptors:** NestJS interceptors/guards verify that a user belongs to the school they are attempting to access.
4. **Data Leakage Prevention:** Automated tests must verify that `School A` cannot access `School B` data by manipulating IDs.

## Tenant Onboarding
1. Super Admin creates a `School` record.
2. A `School Admin` user is created and linked to that `School`.
3. The school is initialized with default settings (Academic Year, Terms, etc.).
