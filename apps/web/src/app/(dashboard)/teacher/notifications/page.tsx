import { redirect } from 'next/navigation';

/**
 * Notifications are account-scoped, not role-scoped. Keeping one implementation
 * avoids the two pages drifting apart (they previously disagreed on the API
 * response shape and the mark-as-read method).
 */
export default function TeacherNotificationsPage() {
  redirect('/dashboard/notifications');
}
