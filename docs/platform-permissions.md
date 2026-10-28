# Platform roles and tenant authorization

## Platform roles

| Role | Purpose | Default access |
| --- | --- | --- |
| `PLATFORM_SUPER_ADMIN` | Platform owner / emergency operations | Full platform access. Explicit role only; never inferred from a school role. |
| `PLATFORM_OPERATIONS_ADMIN` | Day-to-day platform operations | Schools, users, plans, billing visibility, maintenance, announcements, monitoring, audit, read-only security. No tenant business data. |
| `PLATFORM_SUPPORT_ADMIN` | Customer support | Read-only platform visibility plus time-limited support-access requests. No billing changes, no school approval, no tenant business data without a grant. |

The legacy `SUPER_ADMIN` role is aliased to `PLATFORM_SUPER_ADMIN` at the authentication boundary so existing deployments continue to work. New assignments must use the canonical platform role names.

## School roles

| Role | Default access |
| --- | --- |
| `SCHOOL_ADMIN` | Full access within the active school only. |
| `PRINCIPAL` | Read-only academic and operational oversight. |
| `TEACHER` | Students, attendance, assessments, published results, announcements. |
| `STUDENT` | Own attendance, assessments, results, announcements. |
| `GUARDIAN` | Linked children's attendance, results, fees, announcements. Legacy `PARENT` is aliased. |
| `ACCOUNTANT` | School finance and reports. |
| `LIBRARIAN` | Library catalogue and lending. |
| `HR_OFFICER` | Staff and HR records. |
| `RECEPTIONIST` | Student lookup and school announcements. |
| `NURSE` | Student lookup needed for clinic operations. |

## Enforcement rules

1. A role assigned in school A is not resolved when school B is active.
2. Only `PLATFORM_SUPER_ADMIN` may bypass tenant membership checks.
3. `PLATFORM_OPERATIONS_ADMIN` and `PLATFORM_SUPPORT_ADMIN` cannot access tenant business data directly.
4. Suspended, rejected, deactivated, and expired schools are blocked at authentication and tenant-guard boundaries.
5. All platform mutations must be audited with actor, target, outcome, and reason where relevant.
6. Permission changes are enforced by the API; frontend visibility is only a convenience.
