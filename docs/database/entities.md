# Entity Descriptions

## Platform Entities
- **School:** The primary tenant entity.
- **User:** Central identity for authentication.
- **Role:** Definition of a role (e.g., SUPER_ADMIN, TEACHER). Can be platform-global or school-specific.
- **Permission:** Granular actions (e.g., `students.create`).
- **SubscriptionPlan:** Definitions of SaaS tiers (Basic, Premium, Enterprise).

## Membership & Authorization
- **SchoolMembership:** Links a `User` to a `School`. Includes status (ACTIVE, SUSPENDED).
- **UserRole:** Junction table linking `User`, `Role`, and optionally `School`.

## Tenant Entities (School-Specific)
- **Student:** Profile for a student. Linked to a `User` for portal access.
- **Guardian:** Profile for a parent/guardian.
- **Teacher:** Profile for a faculty member.
- **Staff:** General profile for non-teaching staff.
- **AcademicYear:** Defines the school year (e.g., "2023-2024").
- **Term:** Academic periods within a year (e.g., "First Term", "Semester 1").
- **Class:** Grade levels (e.g., "Grade 10").
- **Section:** Sub-groups within a class (e.g., "Class A", "Blue Stream").
- **Subject:** Courses taught (e.g., "Mathematics").

## Operations
- **Enrollment:** The historical link between a `Student`, `Class`, `Section`, and `AcademicPeriod`.
- **TeacherAssignment:** Assigns teachers to subjects and classes for specific periods.
- **AuditLog:** Platform-wide activity log.
