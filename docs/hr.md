# HR & Staff Management Architecture

## 1. Overview
The HR system manages the school's workforce, including teachers and administrative staff. It handles employment records, departments, positions, leave management, attendance, and professional documentation.

## 2. Person Identity System
- **User**: Central identity for authentication.
- **Staff / Teacher**: Profiles linked to a `User`. 
- **Employee ID**: Server-generated unique alphanumeric identifier (e.g., `STF-000001`).

## 3. Core Modules
### A. Departmental & Position Registry
- Configurable `Department` and `Position` models.
- Heads of Department (HOD) are linked to specific staff/teacher profiles.

### B. Leave Management
- **Leave Types**: Configurable categories (Annual, Sick, etc.).
- **Leave Balances**: Transaction-safe tracking of entitled vs. used days.
- **Approval Workflow**: Configurable chain (Teacher -> HOD -> HR).

### C. Attendance & Time Tracking
- HR-specific `StaffAttendance` module.
- Supports multiple sources: Manual entry, and future Biometric/API integration.

### D. Documentation & Verification
- Secure object storage for contracts, certifications, and licenses.
- Expiry tracking with background alerts.

## 4. Privacy & Security
- **Data Minimization**: General staff information is separated from restricted HR data (contracts, performance, disciplinary).
- **Tenant Isolation**: Strict school-scoped access for all records.
- **Audit**: Comprehensive logging of all sensitive HR operations (hiring, terminations, leave approvals).
