import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/staff")) {
    const hasSession = request.cookies.get(COOKIE_NAME)?.value;
    if (!hasSession) {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname === "/login") {
    const hasSession = request.cookies.get(COOKIE_NAME)?.value;
    if (hasSession) {
      return NextResponse.redirect(new URL("/staff/dashboard", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/staff/:path*", "/login"],
};
