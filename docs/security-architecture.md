# Security Architecture

## Principles

The School Management & Education ERP SaaS platform is built on these non-negotiable security principles:

- **Zero Trust**: No client, user, tenant, or service is trusted by default, regardless of their location on the network.
- **Server-Side Authorization**: Frontend authorization is for UI/UX only. Every API request, WebSocket message, and background job must be independently authorized on the server.
- **Tenant Isolation**: Never trust client-provided `schoolId`. All tenant context must be derived from the authenticated session and validated against the user's memberships.
- **Deny by Default**: Access is explicitly granted; otherwise, it is denied.
- **Least Privilege**: Users and services are granted only the minimum permissions necessary to perform their functions.
- **Auditable Sensitive Actions**: All security-sensitive actions (login, MFA changes, data exports, role changes) must be logged to the central audit and security event systems.
- **Database Authority**: The database is the single source of truth for all security states (permissions, roles, session validity).
- **Secure Realtime**: Realtime communication (WebSockets) follows the same authorization rules as REST APIs.
- **Background Worker Context**: Background jobs must preserve and re-validate tenant and actor context.
- **Secrets Management**: Secrets are never exposed to clients and are stored securely using environment variables or dedicated secret managers.
- **No Security through Obscurity**: Hiding UI elements is not a security control.
- **Safe Logging**: Sensitive data such as passwords, tokens, MFA secrets, and payment details are never logged.

## Data Classification

- **PUBLIC**: Public school profiles, public announcements.
- **INTERNAL**: General operational data accessible within a school.
- **CONFIDENTIAL**: Student and teacher records, internal reports.
- **RESTRICTED**: Financial records, disciplinary records, sensitive documents.
- **HIGHLY_RESTRICTED**: Authentication secrets, HR-sensitive information, security investigation records.

## Key Controls

1. **Authentication**: Hardened session management with device tracking and MFA.
2. **Authorization**: Granular RBAC and Relationship-Based Access Control (ReBAC).
3. **Tenant Context**: Automatic injection and enforcement of school boundaries.
4. **Input Validation**: Strict DTO validation and sanitization.
5. **Rate Limiting**: Multi-level protection against abuse.
6. **Encryption**: TLS in transit, AES at rest for sensitive fields.
7. **Monitoring**: Real-time security event tracking and incident management.
