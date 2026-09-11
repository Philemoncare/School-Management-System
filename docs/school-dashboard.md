# School Admin Dashboard & Analytics

## Overview
The School Admin Dashboard provides a real-time command center for institutional leaders to monitor academic, financial, and operational health.

## Data Aggregation
The dashboard uses a dedicated aggregation API `/schools/dashboard/metrics` to fetch core KPIs in a single request, optimizing frontend performance.

### Key Metrics Tracked
- **Student Strength**: Active admitted student count.
- **Academic Staff**: Assigned teachers and staff members.
- **Attendance Rate**: Percentage of students present/late for the current day.
- **Outstanding Fees**: Total balance due across all active invoices.
- **Academic Context**: Displays the current active Academic Year and Term.

## Real-time Integration
The dashboard is powered by WebSockets. It listens for global school events and updates metrics instantly without page reloads:
- `STUDENT_CREATED`
- `PAYMENT_RECEIVED`
- `ATTENDANCE_UPDATED`

## User Interface
- **KPI Cards**: Visual summary of high-level stats with trend indicators.
- **Activity Feed**: Live stream of administrative actions from the Audit log.
- **Announcements**: Megaphone alerts for school-wide updates.
- **Quick Actions**: Direct links to common workflows (Admissions, Attendance, Finance).
