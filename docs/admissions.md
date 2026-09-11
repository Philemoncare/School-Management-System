# Admissions & Student Intake System Architecture

## 1. Overview
The admissions system manages the complete student intake lifecycle, from public application to final enrollment. It is designed to be multi-tenant, secure, and integrated with the core student and finance modules.

## 2. Core Entities
- **AdmissionCampaign**: Defines a specific intake period (e.g., "2027/2028 Academic Year").
- **AdmissionApplication**: The primary record for a prospective student. Contains bio-data, requested placement, and status.
- **AdmissionApplicationGuardian**: Stores guardian information collected during the application process.
- **AdmissionApplicationDocument**: Tracks required files (birth certificates, reports) and their verification status.
- **AdmissionOffer**: A formal offer of admission that can be accepted or declined by guardians.
- **AdmissionDecision**: Internal log of decisions made by admissions officers.

## 3. Workflow Lifecycle
1. **Public Submission**: Application is created via `/admissions/apply`. Reference number `APP-YYYY-XXXXXX` generated.
2. **Review & Screening**: Admissions staff verify documents and update status to `UNDER_REVIEW`.
3. **Offer Phase**: staff issue an `AdmissionOffer`. Application moves to `OFFERED`.
4. **Acceptance**: Guardian accepts the offer. Application moves to `ACCEPTED`.
5. **Confirmation & Intake**: staff confirms admission. This triggers:
   - Creation of a permanent `Student` record.
   - Generation of `ADM-YYYY-XXXXXX` (Admission Number).
   - Linking of `Guardian` records (creating new ones if needed).
   - Creation of an `Enrollment` record for the target class/year.
   - Application status updated to `ENROLLED`.

## 4. Security & Privacy
- **Public Access**: Submission endpoints are public but strictly validated to prevent spam.
- **Tenant Isolation**: All applicant data is hard-scoped to the `schoolId`.
- **Data Segregation**: Internal review notes and decision rationale are never exposed to applicants/guardians.
- **Audit Logging**: Every transition in the application lifecycle is recorded in the `AuditLog`.
