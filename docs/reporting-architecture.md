# Reporting & Analytics Architecture

## Overview
The reporting system is built on top of the authoritative domain data of the School Management ERP. It provides real-time dashboards, operational reports, and data intelligence across all modules.

## Architectural Principles
1. **Authoritative Domain Data**: Reporting only reads and aggregates authoritative records. It is not the source of truth.
2. **Multi-Tenant Security**: Every report is scoped to a specific school (tenant). Authorization is enforced at the server level.
3. **Dataset-Driven**: Reports are built on top of controlled datasets (`ReportDataset`) and fields (`ReportField`) to prevent arbitrary SQL execution.
4. **Versioning**: Report definitions are versioned to preserve historical calculation logic.
5. **Background Processing**: Large reports and exports are handled by BullMQ to ensure API responsiveness.

## Key Components

### ReportDefinition & ReportVersion
Defines what data to fetch, how to aggregate it, and how to present it (charts, tables). Versioning allows tracking changes over time.

### AnalyticsService
Aggregates real-time operational data into KPIs and metrics for dashboards. Categories include:
- Academic
- Attendance
- Finance
- Admissions
- HR
- Library
- Transport
- Operations
- Platform (Super Admin)

### ReportProcessor
A BullMQ worker that executes reports, generates files (PDF, Excel, CSV), and handles scheduled executions.

### ReportingCronService
Synchronizes `ReportSchedule` records with BullMQ repeatable jobs.

## API Endpoints

### Analytics
- `GET /api/v1/reporting/analytics/overview`: High-level school metrics.
- `GET /api/v1/reporting/analytics/academic`: Grade distribution, subject averages, trends.
- `GET /api/v1/reporting/analytics/finance`: Collections, fee performance, collection rates.
- `GET /api/v1/reporting/analytics/attendance`: Attendance rates and status distribution.
- ... and more for Admissions, HR, Library, Transport, etc.

### Reports
- `POST /api/v1/reporting/definitions`: Create a new report definition.
- `POST /api/v1/reporting/definitions/:id/execute`: Manually trigger a report execution.
- `GET /api/v1/reporting/executions`: List recent report executions and their status/file URLs.
- `POST /api/v1/reporting/schedules`: Schedule a report for automated delivery.

### Data Quality
- `GET /api/v1/reporting/data-quality`: Identifies missing or inconsistent data across the system.

## Performance & Optimization
- **Redis Caching**: Used for high-frequency dashboard metrics.
- **Analytics Snapshots**: Periodic snapshots of expensive metrics to allow historical trend analysis without re-scanning millions of rows.
- **Background Jobs**: Offloads heavy PDF/Excel generation.
- **Pagination**: Strictly enforced on all report data listings.
