import { redirect } from 'next/navigation';

/**
 * Superseded by the Settings Center. School identity/configuration is owned
 * by /settings/profile; keep old bookmarks and nav entries working.
 */
export default function LegacySchoolSettingsPage() {
  redirect('/settings/profile');
}
