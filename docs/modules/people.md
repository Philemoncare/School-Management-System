# People Management

## Overview
The People Management domain handles all individuals associated with a school: Students, Guardians, Teachers, and Staff.

## Core Concepts
- **Person Profile:** Specialized data for a specific role (e.g., `Student` profile).
- **User Account:** (Optional) The authentication identity linked to a profile.
- **Tenancy:** Profiles (except Guardians) are strictly scoped to a `school_id`.
- **Relationships:** Many-to-many relationship between Students and Guardians.

## Entity Relationships
- `Student` -> `User` (Optional 1:1)
- `Teacher` -> `User` (Optional 1:1)
- `Staff` -> `User` (Optional 1:1)
- `Guardian` -> `User` (Optional 1:1)
- `Student` <-> `Guardian` (Many-to-Many via `StudentGuardian`)

## Student Lifecycle
- `APPLICANT`: Initial stage for new applications.
- `ADMITTED`: Application approved but not yet active.
- `ACTIVE`: Currently enrolled and participating.
- `SUSPENDED`: Temporarily restricted.
- `TRANSFERRED`: Moved to another institution.
- `GRADUATED`: Completed their studies.
- `WITHDRAWN`: Left the institution before completion.

## Authorization Rules
- **School Admins:** Full management of all profiles in their school.
- **Teachers:** View student profiles (scoped to their assignments in future milestones).
- **Guardians:** Access only to their linked children's data.
- **Students:** Access to their own academic and personal profile.

## Audit Events
- `STUDENT_CREATED`, `STUDENT_UPDATED`, `STUDENT_STATUS_CHANGED`.
- `GUARDIAN_CREATED`, `GUARDIAN_LINKED`.
- `TEACHER_CREATED`, `STAFF_CREATED`.
- `INVITATION_ACCEPTED` (linking User to Profile).
