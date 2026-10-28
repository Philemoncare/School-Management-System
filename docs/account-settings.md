# Complete Account Settings & User Onboarding Architecture

This document covers the comprehensive authenticated user account experience, user profiles, advanced security preferences, active session management, and onboarding workflows.

## 1. User Identity & Profile Matrix
The platform separates authentication identity from domain-specific profiles:
- **Canonical Identity**: Stored in the `User` model (`users` table).
- **Tenant Scope mappings**: Handled via `SchoolMembership` mapping foreign user records securely across isolated organization clusters.

## 2. API Endpoints Reference
All user account endpoints are guarded by `JwtAuthGuard` and enforce authoritative server-side validation against `req.user.id`:

- `GET    /api/v1/users/me` — Fetches current authenticated profile along with active school memberships and roles.
- `PATCH  /api/v1/users/me` — Updates personal information (firstName, lastName, phone).
- `POST   /api/v1/users/me/password/change` — Verifies current passphrase, performs `argon2id` hashing, updates credentials, and creates security logs.
- `GET    /api/v1/users/me/preferences` — Retrieves explicit localizations (timezone, language, user interface theme).
- `PATCH  /api/v1/users/me/preferences` — Persists customized preference key-value objects.
- `GET    /api/v1/users/me/security/activity` — Provides an audit log of authentication and structural security events.
- `GET    /api/v1/users/me/sessions` — Lists concurrent active user sessions running the user's passport identity.
- `DELETE /api/v1/users/me/sessions/:id` — Remote-revokes specific session identifiers, immediately invalidating cookie/bearer access.
- `POST   /api/v1/users/me/sessions/revoke-others` — Signs out of all concurrent remote clients while preserving the active current session context.

## 3. Persistent User Onboarding Wizard
Newly registered or invited users go through a multi-step workflow via `/onboarding`:
1. **Welcome Greeting**: Welcome message initializing workflow state.
2. **Personal Data Confirmation**: Populate display first/last name values.
3. **Identity Verification**: Status audit for verified email handles.
4. **Security Preferences**: Configuration of device telemetry capture.
5. **Localization Configuration**: Sets default UTC fallbacks for regional calendar events.
6. **Membership Review**: Displays target organization roles assigned by administration.
7. **Complete & Commit**: State changes flag to active state on database table logs.
