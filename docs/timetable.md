# Academic Timetable & Scheduling Architecture

## 1. Overview
The Timetable system manages the scheduling of teaching activities, room allocations, and the academic calendar. It is designed to prevent scheduling conflicts and provide real-time updates to students and teachers.

## 2. Core Entities
- **AcademicCalendar**: Defines school-wide events, holidays, and teaching days.
- **BellSchedule & Period**: Configurable time slots for lessons. Supports different schedules per day.
- **Room**: Physical resources (classrooms, labs). Tracks capacity and facilities.
- **TimetableEntry**: The fundamental scheduling unit linking Teacher, Subject, Class, Period, and Room.
- **TimetableVersion**: Supports drafting and historical archiving of schedules.
- **TeacherSubstitution**: Manages temporary overrides for teacher absences.

## 3. Conflict Detection
The system implements hard conflict detection server-side:
- **Teacher Conflict**: One teacher cannot be in two places at once.
- **Class Conflict**: One class cannot have two lessons at once.
- **Room Conflict**: One room cannot host two lessons at once.
- **Capacity Conflict**: (Soft) Warns if class size exceeds room capacity.

## 4. Workflows
1. **Drafting**: Create a new `TimetableVersion`.
2. **Scheduling**: Add `TimetableEntry` records. The system validates conflicts in real-time.
3. **Publishing**: Change version status to `PUBLISHED`. This makes the schedule visible to students and teachers.
4. **Substitution**: Create a `TeacherSubstitution` for a specific date and entry.

## 5. Security
- **Tenant Isolation**: All scheduling data is strictly scoped to the `schoolId`.
- **RBAC**: Only users with `TIMETABLE_OFFICER` or `SCHOOL_ADMIN` roles can modify master schedules.
- **Portal Integration**: Students and Parents only see schedules for their authorized enrollments.
