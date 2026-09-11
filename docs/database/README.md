# Database Architecture

This document describes the database design for the School Management Platform.

## Overview
- **Engine:** PostgreSQL 15+
- **ORM:** Prisma
- **Identifier Strategy:** UUID (v4) for all primary keys.
- **Tenancy:** Logical isolation using `school_id` on tenant-owned records.

## Core Principles
1. **Multi-Tenancy:** Every school is an isolated tenant. Data leakage between schools is prevented at the application and database levels.
2. **Historical Integrity:** Academic and financial records are preserved through historical tables (e.g., `Enrollment`).
3. **RBAC:** Role-Based Access Control with granular permissions supporting both platform-level and school-level roles.
4. **Auditability:** All sensitive operations are logged to a centralized `AuditLog`.

## Naming Conventions
- Tables: `snake_case` (plural)
- Columns: `camelCase` (Prisma default mapping to `snake_case` in DB)
- Primary Keys: `id` (UUID)
- Foreign Keys: `entityId`
