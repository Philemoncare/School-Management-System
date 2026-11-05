import { redirect } from 'next/navigation';

// The teachers directory has been unified onto the staff directory, which
// already lists both Teacher and Staff records (linking profiles with
// `?type=TEACHER`). The legacy `/dashboard/teachers` route is kept only as a
// compatibility redirect. See the Teacher -> Staff unification migration plan.
export default function TeachersListPageRedirect() {
  redirect('/dashboard/hr/staff');
}
