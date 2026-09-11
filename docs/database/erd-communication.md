# Communication Module ERD & Data Model

## Resource Ownership Matrix

| Resource                    | Owner           | Tenant Scoped | Created By  | Main Relationships             |
| --------------------------- | --------------- | ------------: | ----------- | ------------------------------ |
| Notification                | School          |           Yes | System/User | User, Type, Delivery, Template |
| NotificationDelivery        | Notification    |           Yes | System      | Notification, Provider         |
| NotificationType            | Platform/School |  Configurable | Admin       | Templates, Preferences         |
| NotificationTemplate        | Platform/School |  Configurable | Admin       | Type, Versions                 |
| NotificationTemplateVersion | Template        |    Yes/Global | Admin       | Template, Notifications        |
| NotificationPreference      | User            |           Yes | User/Admin  | User, Type                     |
| Conversation                | School          |           Yes | User        | Participants, Messages         |
| ConversationParticipant     | Conversation    |           Yes | System      | Conversation, User             |
| Message                     | Conversation    |           Yes | User        | Conversation, Sender           |
| MessageReadStatus           | Message         |           Yes | User/System | Message, User                  |
| MessageAttachment           | Message         |           Yes | User        | Message, Stored Object         |
| Announcement                | School          |           Yes | User        | Audience, Notifications        |
| AnnouncementAudience        | Announcement    |           Yes | User/Admin  | Announcement, Target           |
| CommunicationUsage          | School          |           Yes | System      | School, Subscription/Period    |

## Core Relationships (Cardinality)

### Identity & Tenancy
- **School 1:N Notification**: Every notification belongs to a school.
- **User 1:N Notification**: Every notification is directed to one recipient.
- **School 1:N Conversation**: Conversations are scoped to schools.

### Notifications & Templates
- **NotificationTemplate 1:N NotificationTemplateVersion**: Templates track history via versions.
- **NotificationTemplateVersion 1:N Notification**: Notifications preserve the exact template version used at time of creation.
- **Notification 1:N NotificationDelivery**: One notification can be sent through multiple channels (Email, SMS, In-App).

### Messaging
- **Conversation 1:N ConversationParticipant**: Group and 1:1 chat support.
- **Conversation 1:N Message**: Messages belong to a single thread.
- **Message 1:N MessageReadStatus**: Each recipient has an independent read/unread state.

### Announcements
- **Announcement 1:N AnnouncementAudience**: Explicit targeting (e.g., specific classes or roles).
- **Announcement 1:N Notification**: Published announcements generate individual user notifications.

## Tenant Boundaries
The `school_id` is enforced on all primary communication entities. Cross-tenant messaging or notification delivery is strictly prohibited by logical checks and foreign key constraints.
