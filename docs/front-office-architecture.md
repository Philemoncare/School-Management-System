# Front Office & Receptionist Module Architecture

## Overview
The Front Office module is designed for high-frequency school reception operations. It handles physical access control (visitors), communication (enquiries), and safety-critical tasks (student checkouts).

## Backend Core
- **Module**: `FrontOfficeModule`
- **Controller**: `FrontOfficeController` (multi-tenant protected via `TenantGuard`)
- **Service**: `FrontOfficeService` handles transactional states for visits, enquiries, and checkouts.

## Key Workflows
### 1. Visitor Management
Visitors are registered once and can have multiple `Visit` instances. The check-in process issues a temporary `badgeNumber` and records the precise `actualCheckInAt` timestamp.

### 2. Student Early Departure
A multi-step verification process:
1. Search student in registry.
2. Verify authorized guardians linked to the student profile.
3. Record the pickup person and departure reason.
4. Notify relevant staff via Audit/Event system.

### 3. Enquiry & Admissions
General enquiries are captured with unique reference numbers (`ENQ-YYYY-XXXXXX`). Handoff to admissions is supported via referral notes.

## Security & Isolation
- **Tenant Scoping**: All front-office data maps are keyed by `schoolId`.
- **RBAC**: Access is restricted to `RECEPTIONIST`, `ADMIN`, and `PRINCIPAL` roles.
- **Audit**: All sensitive actions (Check-in, Checkout, Enquiry Resolution) are logged in the central Audit trail.

## Real-time Updates
The dashboard and active visitor views are designed to update via WebSocket events (`visitor.checked_in`, `enquiry.created`) to ensure multiple receptionists stay in sync.
