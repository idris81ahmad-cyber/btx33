import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function hasSessionCookie(request: NextRequest) {
  return (
    request.cookies.has("next-auth.session-token") ||
    request.cookies.has("__Secure-next-auth.session-token")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/account")) {
    if (!hasSessionCookie(request)) {
      const login = new URL("/login", request.url);
      login.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(login);
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    if (!hasSessionCookie(request)) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET ?? "BD4o4R2MTp5PbRAl3GPVmIdCu2Hoe1gXiLJ4bXtqOQU=",
    });
    if (token && token.role !== "admin") {
      return NextResponse.redirect(new URL("/account", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};