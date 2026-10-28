import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PREFIXES = [
  '/dashboard',
  '/super-admin',
  '/teacher',
  '/student',
  '/parent',
  '/accountant',
  '/librarian',
  '/hr',
  '/receptionist',
  '/transport',
  '/health',
  '/inventory',
  '/assets',
  '/procurement',
  '/communications',
  '/profile',
  '/settings',
  '/onboarding',
];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (!token && isProtected) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Deliberately no "cookie present, so bounce auth pages to the dashboard"
  // rule. The cookie cannot be validated here, and an expired token or revoked
  // session would produce an endless /login -> /dashboard -> 401 -> /login
  // reload loop. The app redirects signed-in users itself once /auth/me
  // confirms the session is real.

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)'],
};
