# Student Management

## Overview
Handles student profiles, admissions, and lifecycle tracking.

## Student Profile
Students are unique per school and are identified by a `studentNumber` and `admissionNumber`.

### Fields
- `firstName`, `middleName`, `lastName`
- `studentNumber` (Required, unique per school)
- `admissionNumber` (Optional, unique per school)
- `admissionDate`
- `dateOfBirth`
- `gender`
- `status` (Enum: `APPLICANT`, `ADMITTED`, `ACTIVE`, etc.)

## Lifecycle Transitions
1. **Admission:** `APPLICANT` -> `ADMITTED` -> `ACTIVE`.
2. **Suspension:** `ACTIVE` -> `SUSPENDED`.
3. **Leaving:** `ACTIVE` -> `GRADUATED` or `WITHDRAWN`.

## API Endpoints
- `POST /students`: Create a student profile.
- `GET /students`: List students with search and pagination.
- `GET /students/:id`: View detailed student profile.
- `PATCH /students/:id`: Update student details.
