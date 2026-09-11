# Super Admin Platform Command Center

## Overview
The Super Admin Command Center is the high-level control plane for the multi-tenant SaaS platform. It separates **Platform Administration** (global health, SaaS billing, school lifecycle) from **School Administration** (private student/staff data).

## Core Principles
- **Tenant Privacy**: Super Admins do not have automatic, unlogged access to private school data (students, grades, financial records). Access to specific school contexts is restricted and audited.
- **Relational Integrity**: Uses existing domain models (`School`, `User`, `Subscription`) rather than duplicating them.
- **Immutable Auditing**: Every platform action (suspending a school, disabling a user, modifying plans) is recorded in the centralized `AuditLog`.

## Management Domains

### 1. School Lifecycle
- **Directory**: searchable list of all schools with status and plan filters.
- **Provisioning**: Automated school creation with initial admin setup.
- **Status Control**: Active → Suspended → Reactivated transitions.
- **Deactivation**: Controlled logical removal/archival of tenants.

### 2. SaaS Billing & Revenue
- **Plans**: Configurable tiers with feature flags (SMS, Reports, etc.) and multi-interval pricing (Monthly/Annual).
- **Revenue Dashboard**: Real-time aggregation of `PlatformInvoice` and `PlatformPayment` records.
- **Metrics**: MRR, Total Paid, Subscription Churn.

### 3. Maintenance & Alerts
- **Maintenance Windows**: Schedule downtime targeting specific schools or the entire platform.
- **Broadcast**: Integrated with the Communication Engine to notify affected users via Email/SMS/In-App.
- **Health Monitoring**: Real-time status of API, DB, Redis, and workers.

### 4. User & Security
- **Platform Users**: Global directory of users across all tenants.
- **Access Control**: Platform-level roles (`SUPER_ADMIN`, `SUPPORT`, `AUDITOR`).
- **Safety**: Support for bulk session revocation and account disabling.

## Technical Architecture
- **API**: NestJS controllers with `@Roles('SUPER_ADMIN')` guards.
- **Frontend**: Next.js routes within the `(dashboard)/super-admin` group.
- **Real-time**: Socket.IO integration for live metric updates.
- **Queueing**: BullMQ for long-running exports and maintenance notifications.
