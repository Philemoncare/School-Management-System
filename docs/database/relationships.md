# Relationship Map (ERD)

```mermaid
erDiagram
    SCHOOL ||--o{ SCHOOL_MEMBERSHIP : has
    SCHOOL ||--o{ STUDENT : contains
    SCHOOL ||--o{ TEACHER : has
    SCHOOL ||--o{ CLASS : defines
    SCHOOL ||--o{ ACADEMIC_YEAR : configures
    
    USER ||--o{ SCHOOL_MEMBERSHIP : belongs_to
    USER ||--o{ USER_ROLE : assigned
    ROLE ||--o{ USER_ROLE : defines
    ROLE ||--o{ ROLE_PERMISSION : grants
    PERMISSION ||--o{ ROLE_PERMISSION : defined_by
    
    STUDENT ||--o| USER : "optional login"
    STUDENT ||--o{ STUDENT_GUARDIAN : "has guardians"
    GUARDIAN ||--o{ STUDENT_GUARDIAN : "manages students"
    GUARDIAN ||--o| USER : "optional login"
    
    ACADEMIC_YEAR ||--o{ TERM : "divided into"
    CLASS ||--o{ SECTION : "split into"
    
    STUDENT ||--o{ ENROLLMENT : "enrolled in"
    ACADEMIC_YEAR ||--o{ ENROLLMENT : "during"
    CLASS ||--o{ ENROLLMENT : "in class"
    SECTION ||--o{ ENROLLMENT : "in section"
    
    TEACHER ||--o{ TEACHER_ASSIGNMENT : assigned_to
    SUBJECT ||--o{ TEACHER_ASSIGNMENT : taught_in
    SECTION ||--o{ TEACHER_ASSIGNMENT : assigned_in
```

## Key Constraints
- `School.code`: Unique platform-wide.
- `User.email`: Unique platform-wide.
- `Student.studentNumber`: Unique per `School`.
- `Enrollment`: Unique for `(studentId, academicYearId, termId)` to prevent double enrollment.
