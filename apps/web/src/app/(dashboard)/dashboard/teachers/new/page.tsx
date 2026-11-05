import { redirect } from 'next/navigation';

// Teacher registration has been unified onto the Staff workflow. The legacy
// `/dashboard/teachers/new` route is preserved only as a compatibility
// redirect so old bookmarks and in-app links keep working. See the
// Teacher -> Staff unification migration plan.
export default function NewTeacherPageRedirect() {
  redirect('/dashboard/hr/staff/new');
}
