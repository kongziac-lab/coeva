import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin") && !request.cookies.get("coeva_admin")) {
    return NextResponse.redirect(new URL(`/login?returnTo=${encodeURIComponent(request.nextUrl.pathname)}`, request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
