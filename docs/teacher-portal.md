# Teacher Portal & Academic Workflow

## Overview
The Teacher Portal is a specialized workspace for faculty members to manage their daily academic responsibilities. Access is strictly controlled via resource-level authorization derived from **Teacher Assignments**.

## Core Components

### 1. Teacher Dashboard
- **Real-time Metrics**: Displays number of assigned classes, active students, pending score submissions, and today's teaching load.
- **Today's Schedule**: Incremental view of the timetable for the current day.
- **Action Items**: Quick links to pending attendance and assessments.

### 2. My Workspace
- **Classes**: View and manage explicitly assigned Class/Section/Subject combinations.
- **Students**: Directory of students currently enrolled in the teacher's classes. Profiles are restricted to academic and basic information.
- **Timetable**: Weekly schedule view with room and subject details.

### 3. Academic Operations
- **Attendance (Roll Call)**: Fast, touch-optimized workflow for marking student presence. Supports bulk marking (all present) and individual status adjustments (Absent/Late/Excused).
- **Assessments**: Creation and management of tests, quizzes, and exams for assigned subjects.
- **Score Entry (Spreadsheet)**: Highly efficient spreadsheet-like interface for entering raw scores and performance remarks. Validates scores against the assessment's maximum marks.

### 4. Communication & Integration
- **Internal Messaging**: One-to-one and group chats with staff, school admins, and authorized guardians.
- **Broadcasts**: View school-wide announcements and targeted faculty updates.
- **Notifications**: Real-time alerts for result approvals, messages, and administrative reminders.

## Security & Authorization
- **Tenant Isolation**: Teachers are logically restricted to their active school membership.
- **Resource Ownership**: Teachers can only mark attendance or enter scores for classes/subjects they are assigned to in the `TeacherAssignment` model.
- **IDOR Protection**: Every request is validated server-side to ensure the requested resource (student, class, assessment) belongs to the teacher's authorized context.
