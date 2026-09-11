# Attendance Management

## Overview
The Attendance module tracks daily and subject-based presence for students and staff.

## Data Model
- **AttendanceSession:** Represents a specific instance of attendance taking (e.g., Grade 9A Morning Attendance on 09/09/2026).
- **StudentAttendance:** Individual record for each student within a session.

## Lifecycle of a Session
1. **OPEN:** Session is created and ready for marking.
2. **IN_PROGRESS:** Marking has started but not finished.
3. **COMPLETED:** Attendance has been submitted.
4. **LOCKED:** No further changes allowed without administrative privilege.

## Statuses
- `PRESENT`: Student is in class.
- `ABSENT`: Student is not in class.
- `LATE`: Student arrived after the session started.
- `EXCUSED`: Student is absent with an approved reason.

## Audit & Traceability
All changes to attendance are logged. Metadata includes who marked the student and at what time. Locked sessions produce immutable records for official reporting.

## Permissions
- `attendance.view`: View attendance lists and history.
- `attendance.mark`: mark/edit attendance in open sessions.
- `attendance.lock`: Lock a session to prevent changes.
- `attendance.correct`: Administrative right to edit locked attendance.
