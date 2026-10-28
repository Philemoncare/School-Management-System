# Complete Student Portal & Learning Workspace Architecture

## Overview
The Student Portal provides an isolated, multi-tenant authenticated experience tailored specifically for student roles inside the enterprise School Management platform. All transactions mandate top-tier data sanitization, ensuring that student tokens can never access unreleased feedback, teacher logs, or other cross-tenant identities.

## Implemented API Endpoints
* `GET /api/v1/student/dashboard` - Fetches immediate context metrics, today's schedule slots, assessments, and notifications.
* `GET /api/v1/student/profile` - Returns official identity validation tokens and core demographic bio metrics.
* `GET /api/v1/student/subjects` - Lists enrolled course curriculum unit components.
* `GET /api/v1/student/timetable` - Aggregates weekly class schedules across multiple days.
* `GET /api/v1/student/attendance` - Serves checked presence and absence rates.
* `GET /api/v1/student/assignments` - Displays instructions, status flags, and published feedback cards.
* `POST /api/v1/student/assignments/:id/submit` - Records assignment submissions securely without overlapping historical indices.
* `GET /api/v1/student/results` - Outputs published grading structures.
* `GET /api/v1/student/finance` - Delivers multi-tenant invoice details.
* `GET /api/v1/student/library` - Tracks library copy loans, reservation codes, and unpaid fines.
* `GET /api/v1/student/transport` - Inspects school route coordinates.
* `GET /api/v1/student/announcements` - Filters notice broadcasts by specific audience criteria.

## Security Constraints
1. **Tenant Isolation**: Every database interaction guarantees exact matching against the `@ActiveSchool() schoolId` decorator context.
2. **Access Safeguards**: Frontend-supplied identifier strings are strictly resolved on the server-side directly against token payloads via `StudentAccessService`.
3. **Score Separation**: Unpublished, internal moderation grades remain fully confidential until authorized by the academic registry.
