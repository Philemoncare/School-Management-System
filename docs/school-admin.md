# School Administration & User Control

## Roles & Permissions
School administration is governed by a strict RBAC system.
- **SCHOOL_ADMIN**: Full access to all settings, users, and financial records.
- **PRINCIPAL**: Focuses on academic oversight, teacher assignments, and result approvals.
- **TEACHER**: restricted to assigned classes, attendance marking, and score entry.
- **ACCOUNTANT**: Managed invoices, payments, and financial reports.

## User Management
- **Directory**: searchable list of all users with membership status control.
- **Access Control**: Enable/Disable accounts and manage roles within the school context.
- **Tenant Isolation**: Admins can only see and manage users with active memberships in their specific school.

## Configuration & Branding
- **Profile**: Institutional details, contact information, and physical address.
- **Localization**: School-specific timezones, currencies, and date formats are enforced across all modules.
- **Branding**: Official logo and naming for professional reports and invoices.

## Security & Audit
- **Activity Log**: Every administrative action is recorded with an actor ID, timestamp, and metadata.
- **Real-time Search**: School-wide entity search (Students, Staff, Classes) in the header, respecting role permissions.
