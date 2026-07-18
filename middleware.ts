import { NextResponse } from "next/server";

export function middleware(req: any) {
  const adminSession = req.cookies.get("admin_session")?.value;

  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (isAdminRoute && !adminSession) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
