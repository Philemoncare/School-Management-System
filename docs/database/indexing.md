# Indexing Strategy

## Core Indexes
Every table has a primary key index on `id` (UUID).

## Tenancy Indexes
Most tenant-specific tables have an index on `school_id` to optimize partitioned queries:
- `students(school_id)`
- `teachers(school_id)`
- `classes(school_id)`
- `academic_years(school_id)`
- `audit_logs(school_id)`

## Identity Indexes
- `users(email)`: Unique index for authentication.
- `users(phone)`: Unique index for lookup/OTP.

## Unique Business Constraints
- `schools(code)`: Unique platform identifier.
- `students(school_id, student_number)`: Ensures unique student IDs within a school.
- `enrollments(student_id, academic_year_id, term_id)`: Prevents duplicate enrollment in the same period.

## Search Optimization
- `students(lastName, firstName)`: For quick name lookups.
- `audit_logs(createdAt)`: For chronological log filtering.
