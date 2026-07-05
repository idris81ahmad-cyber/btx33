import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Basic admin route guard. Client + API are also protected.
// Note: full JWT validation in middleware is complex; UI redirect + server checks cover it.
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    // For stronger protection one could inspect the session cookie here
    // and redirect if absent. Current implementation relies on:
    // - useSession() redirect in /admin/page
    // - getServerSession in all /api/admin/* routes
    const hasSessionCookie =
      request.cookies.has('next-auth.session-token') ||
      request.cookies.has('__Secure-next-auth.session-token') ||
      request.cookies.has('__Host-next-auth.csrf-token');

    // If no obvious session cookie, still allow (client will handle redirect after hydrate)
    // To force redirect on missing cookie uncomment below:
    // if (!hasSessionCookie) {
    //   return NextResponse.redirect(new URL('/admin/login', request.url));
    // }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
