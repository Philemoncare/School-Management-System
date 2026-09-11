# School ERP Workflow & Orchestration Engine

## 1. Overview
The Workflow Engine is the coordination layer of the School ERP. it ensures that business processes spanning multiple modules (e.g., Admissions, Finance, Academics) are executed reliably and traceably.

## 2. Core Components

### Domain Events
Standardized events emitted by domain services when significant business actions occur. 
Example: `ADMISSION_CONFIRMED`, `STUDENT_PROMOTED`.

### Transactional Outbox
Events are saved to the `OutboxEvent` table within the same database transaction as the business data. This ensures "at-least-once" delivery and prevents data inconsistencies if the event publisher fails.

### Event Dispatcher
A centralized service that routes events from the outbox to registered internal handlers. It enforces **idempotency** by tracking processed events in the `EventProcessingRecord` table.

### Workflow Orchestrator
Manages multi-step "Sagas". Each `WorkflowInstance` tracks the overall state of a process, while `WorkflowStep` records the success or failure of individual actions (e.g., "Create Invoice", "Send Welcome Email").

## 3. Key Workflows

### Admission to Student Intake
Triggered by `ADMISSION_CONFIRMED`:
1. **Billing**: Automatically generates mandatory fee invoices for the new student.
2. **Portal Invitation**: Prepares student/guardian portal access.
3. **Notification**: Dispatches welcome communications via the Communication Engine.

### Student Promotion
Triggered by `STUDENT_PROMOTED`:
1. **Billing**: Generates invoices for the new academic year's fees.
2. **Notification**: Notifies guardians of the successful promotion.

### Student Lifecycle
Handles `WITHDRAWN`, `GRADUATED`, and `TRANSFERRED` states:
1. **Access Revocation**: Deactivates school membership and portal sessions.
2. **Resource Cleanup**: Cancels active transport assignments and triggers library clearance checks.

## 4. Observability & Recovery
- **Correlation IDs**: All related events and workflow steps share a correlation ID for end-to-end tracing.
- **Operations Dashboard**: Provides real-time visibility into workflow success rates and failure logs.
- **Manual Intervention**: Administrators can inspect failed workflows and retry safe steps from the Operations Control Center.
