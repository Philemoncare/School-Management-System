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

const AUTH_PAGES = ['/login', '/register', '/register-school', '/'];

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

  if (token && AUTH_PAGES.includes(pathname)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\..*).*)'],
};
