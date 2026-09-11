# Multi-Tenancy Strategy

## Logical Isolation
We use a shared database and schema with `school_id` partitioning.

### Enforcement
1. **Application Layer:** Repositories and Services MUST include `where: { schoolId }` in all Prisma queries.
2. **Context:** The `schoolId` is derived from the `UserRole` or `SchoolMembership` of the authenticated user.
3. **Defense in Depth (RLS):** PostgreSQL Row-Level Security can be applied to ensure that even if the application layer fails, the database rejects queries that cross tenant boundaries.

### Implementation of RLS (Future)
When RLS is enabled, the API will execute:
```sql
SET app.current_school_id = 'uuid-of-school';
```
PostgreSQL policies will then enforce:
```sql
CREATE POLICY school_isolation_policy ON students
USING (school_id = current_setting('app.current_school_id')::uuid);
```

## Platform Data
Entities like `SubscriptionPlan` and `GlobalRoles` do not have a `school_id` as they are shared across the platform.
