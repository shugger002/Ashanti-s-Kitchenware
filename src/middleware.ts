import { NextResponse, type NextRequest } from "next/server";

const COOKIE = process.env.SESSION_COOKIE_NAME ?? "ak_session";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicAdmin = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
  if (pathname.startsWith("/admin") && !publicAdmin.includes(pathname)) {
    if (!request.cookies.get(COOKIE)?.value) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
