# Data Integrity & Retention

## Soft Delete vs Hard Delete
- **Users/Schools:** Generally deactivated via a `status` or `isActive` flag. Hard deletion is reserved for GDPR/Privacy requests.
- **Academic Records:** Historical records in `Enrollment` and `TeacherAssignment` are never deleted; they are marked with a status (e.g., `WITHDRAWN`, `COMPLETED`).
- **Financial Records:** (Future) Invoices and payments must be immutable once finalized.

## Constraints
We use PostgreSQL constraints to enforce business rules:
- `Foreign Keys`: Ensure that a Student cannot exist without a School.
- `Unique Constraints`: Prevent duplicate data entry (e.g., same student number).
- `Check Constraints`: (Future) Can be used to ensure valid age ranges or price values.

## Audit Logging
Sensitive changes (creation, modification, deletion) are tracked in the `AuditLog` table, capturing the actor, the resource, and the metadata of the change.
