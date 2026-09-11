# Schools & Organization Management

## Overview
This module handles the platform-level administration of schools (tenants) and their isolated configurations.

## Platform Level (Super Admin)
- **School Creation:** Super Admins can provision new schools. This includes generating a unique school code and slug, and setting up the initial School Admin.
- **Lifecycle Management:** Schools can be transitioned through states: `PROVISIONING`, `ACTIVE`, `SUSPENDED`, `DEACTIVATED`.
- **Global Monitoring:** Super Admins have a directory of all schools, their status, and usage metrics.

## Tenant Level (School Admin)
- **School Profile:** Administrators can manage school-specific metadata like name, contact info, and logo.
- **Settings:** Schools manage their own localization (timezone, currency), academic structures, and branding.
- **Membership Management:** School Admins invite and manage users (Teachers, Students, Staff) within their specific school context.

## Business Rules
1. **Unique Identity:** School codes and slugs must be unique across the entire platform.
2. **Atomic Provisioning:** School creation is a transactional operation that ensures the school, initial admin, and default roles are created together.
3. **Suspension:** A suspended school loses access to all write operations, and users are notified upon login.
4. **Tenant Isolation:** All school data is strictly scoped by `school_id`. No cross-tenant data leakage is permitted.

## API Endpoints
- `POST /schools`: Create a new school (Super Admin).
- `GET /schools`: List all schools (Super Admin).
- `PATCH /schools/:id/status`: Update school status (Super Admin).
- `GET /school-profile`: Get current school profile (School Admin).
- `PATCH /school-profile`: Update current school profile (School Admin).
- `GET /memberships`: List school members.
