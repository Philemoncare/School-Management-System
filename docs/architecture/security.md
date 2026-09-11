# Security Foundation

## Core Principles
1. **Authentication:** JWT-based with support for refresh tokens.
2. **Authorization:** RBAC (Role-Based Access Control) with granular permissions.
3. **Tenant Isolation:** Logical partitioning at the data layer.
4. **Input Validation:** Strict validation using `class-validator` and `Zod`.
5. **Secrets Management:** Environment-based configuration; no secrets in source control.
6. **Audit Logs:** Immutable records of all sensitive operations.
