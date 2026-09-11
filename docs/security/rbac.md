# Role-Based Access Control (RBAC)

## Role Hierarchy
- **Platform Level:**
    - `SUPER_ADMIN`: Full access to the entire SaaS platform.
- **Tenant Level:**
    - `SCHOOL_ADMIN`: Full access to school configuration and users.
    - `PRINCIPAL`: Academic and administrative oversight.
    - `TEACHER`: Classroom and student record management.
    - `STUDENT`: Access to personal academic records.
    - `PARENT`: Access to authorized students' information.
    - ... and other specialized roles.

## Permission Mapping
Roles are containers for permissions. For example, a `TEACHER` role in the database will be linked to permissions like `attendance.create` and `results.view`.

## Custom Roles
The architecture supports school-specific custom roles. A school can define a new role and assign it a subset of the available system permissions.
