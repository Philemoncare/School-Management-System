# Academic Structure Management

## Overview
This module defines the foundational academic structure of a school, including years, terms, classes, sections, and subjects.

## Academic Year
The highest level of the academic cycle.
- **Statuses:** `DRAFT`, `UPCOMING`, `ACTIVE`, `COMPLETED`, `ARCHIVED`.
- **Constraint:** Only one year can be `isCurrent` per school.

## Terms / Semesters
Academic periods within a year.
- **Constraint:** Must fall within the parent academic year dates.

## Classes & Sections
- **Class:** Represents a grade level (e.g., "Basic 7").
- **Section:** Sub-groups or streams (e.g., "Section A", "Science Stream").

## Subjects
- **Categories:** `CORE`, `ELECTIVE`, `PRACTICAL`, `EXTRACURRICULAR`, `OTHER`.
- **Assignment:** Subjects are mapped to classes via `ClassSubject`.

## Teacher Assignments
Maps teachers to specific subjects and class sections for a given academic period.

## Permissions
- `academic_year.view`, `academic_year.create`, `academic_year.update`
- `class.view`, `class.create`, `class.update`
- `subject.view`, `subject.create`
- `teacher_assignment.create`, `teacher_assignment.view`
