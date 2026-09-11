import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // 1. If user is authenticated and tries to access public auth pages, redirect to dashboard
  if (token && (pathname === '/login' || pathname === '/register' || pathname === '/')) {
    // Note: We don't know the role here yet, but /dashboard layout will handle role-based routing
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 2. If user is NOT authenticated and tries to access protected pages, redirect to login
  if (!token && (pathname.startsWith('/dashboard') || pathname.startsWith('/super-admin'))) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/register', '/dashboard/:path*', '/super-admin/:path*'],
};
