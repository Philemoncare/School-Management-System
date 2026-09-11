# System Overview

## Vision
The School Management Platform is a production-grade, multi-tenant ERP designed for educational institutions.

## High-Level Architecture
The platform follows a **Modular Monolith** pattern. This ensures a clean separation of concerns while minimizing deployment complexity in the initial phases.

### Core Components
- **Frontend (Web):** Next.js application providing interfaces for Super Admins, School Admins, Teachers, Students, and Parents.
- **Backend (API):** NestJS application serving as the central business logic hub.
- **Database:** PostgreSQL for relational data with Prisma ORM.
- **Cache & Queue:** Redis for real-time state, session caching, and background job processing (BullMQ).
- **Storage:** S3-compatible object storage for documents and media.

## Multi-Tenancy
The platform uses a **Logical Isolation** strategy. A `schoolId` (Tenant ID) is present on every tenant-owned resource. The API enforces this isolation at the service and repository layers.
