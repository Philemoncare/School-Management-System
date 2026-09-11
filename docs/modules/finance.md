# Financial Management

## Overview
The Finance module handles school fees, student invoicing, and payment processing.

## Core Models
- **FeeCategory:** Classification of fees (Tuition, ICT, etc).
- **FeeStructure:** The definition of how much is charged for a category for a specific period or class.
- **Invoice:** A formal bill issued to a student. Contains `InvoiceItem`s.
- **Payment:** A record of money received.
- **PaymentAllocation:** Mapping of payments to one or more invoices.

## Money Handling
- **Precision:** All monetary values use PostgreSQL `DECIMAL(19,4)` to prevent floating-point errors.
- **Authoritative Balance:** Calculated as `Total Invoiced - Total Allocated Payments`.

## Workflow
1. **Setup:** Admin creates `FeeCategory` and `FeeStructure`.
2. **Billing:** Admin generates `Invoice` for students based on their enrollment.
3. **Collection:** Student/Guardian pays via `Payment`.
4. **Allocation:** Payment is linked to outstanding invoices.
5. **Reconciliation:** Verified payments update invoice status to `PAID` or `PARTIALLY_PAID`.

## Permissions
- `finance.manage_fee_structures`: Setup billing rules.
- `finance.create_invoice`: Bill students.
- `finance.record_payment`: Cashier access to record manual payments.
- `finance.view_own`: Student/Parent access to their own financial records.
