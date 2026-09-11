# Guardian Management

## Overview
Manages parents and legal guardians of students.

## Relationships
Guardians have a many-to-many relationship with students.
- A guardian can be linked to multiple students (siblings).
- A student can have multiple guardians (Father, Mother, Legal Guardian).

## Linkage
Guardians are linked to students via the `StudentGuardian` model, which tracks the `relation` and whether they are the `isPrimary` contact.

## API Endpoints
- `POST /guardians`: Create a guardian profile.
- `POST /guardians/link/:studentId`: Link an existing guardian to a student.
- `GET /guardians/student/:studentId`: List all guardians for a specific student.
