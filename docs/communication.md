# Communication & Notification System

## Overview
The platform uses a centralized communication engine to handle in-app alerts, emails, SMS, and realtime updates via WebSockets.

## Key Components
- **CommunicationService**: The single entry point for sending notifications.
- **TemplateEngine**: Resolves dynamic variables like `{{student_name}}` into final messages.
- **BullMQ Queue**: Handles asynchronous delivery to avoid blocking the main API thread.
- **Providers**: Pluggable adapters for Email (SendGrid, AWS SES) and SMS (Twilio).
- **CommunicationGateway**: Manages WebSocket connections and realtime broadcasting.

## Delivery Workflow
1. **Event Trigger**: An application event occurs (e.g., `STUDENT_ABSENT`).
2. **Preference Check**: The system checks the recipient's `NotificationPreferences`.
3. **Template Resolution**: Best-matching templates (school-specific or platform-default) are selected.
4. **Queueing**: Delivery jobs are added to the `notifications` queue with appropriate priority.
5. **Processing**: Background workers execute provider calls and track delivery status.

## Realtime Updates
Realtime events are emitted over WebSockets for:
- `notification`: New in-app alerts.
- `new_message`: Instant chat updates.

## Audit & Tracking
Every notification and delivery attempt is logged in the database (`NotificationDelivery`). This allows administrators to troubleshoot failed messages and monitor platform-wide communication volume.
