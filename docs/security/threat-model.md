# Threat Model

| Threat | Mitigation |
| --- | --- |
| **Credential Theft** | Argon2id hashing, secure token handling, audit logs. |
| **Brute Force** | Rate limiting, generic error messages. |
| **Cross-Tenant Access** | `TenantGuard`, `schoolId` scoping in all DB queries. |
| **Privilege Escalation** | Permission-based authorization, role assignment protection. |
| **IDOR** | Context-based resource fetching, ownership verification. |
| **Session Hijacking** | Short-lived JWTs, rotating refresh tokens (planned). |
| **Mass Assignment** | Strict DTO validation via `class-validator`. |
