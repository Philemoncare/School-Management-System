# Student Enrollment

## Overview
Handles the formal placement of students into the academic structure.

## Enrollment Record
Connects a `Student` to a `School`, `AcademicYear`, `Class`, and `Section`.

## Historical Integrity
Enrollments are never deleted. When a student moves class or completes a year, a new enrollment is created, and the old one is marked with an appropriate status.

## Lifecycle States
- `PENDING`
- `ACTIVE`
- `COMPLETED`
- `PROMOTED`
- `TRANSFERRED`
- `WITHDRAWN`
- `CANCELLED`

## API Endpoints
- `POST /enrollments`: Enroll a student.
- `GET /enrollments/student/:studentId`: View academic history.
- `PATCH /enrollments/:id/move`: Change a student's class or section.
