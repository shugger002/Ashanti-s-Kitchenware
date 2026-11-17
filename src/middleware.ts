import { NextResponse, type NextRequest } from "next/server";

const COOKIE = process.env.SESSION_COOKIE_NAME ?? "ak_session";
const CANONICAL_HOST = "ashantis-kitchenware.vercel.app";
const LEGACY_HOST = "ashanti-s-kitchenware.vercel.app";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host")?.split(":")[0];
  if (host === LEGACY_HOST) {
    const url = request.nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  const { pathname } = request.nextUrl;
  const publicAdmin = ["/admin/login", "/admin/forgot-password", "/admin/reset-password"];
  if (pathname.startsWith("/api/admin") && !request.cookies.get(COOKIE)?.value) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  if (pathname.startsWith("/admin") && !publicAdmin.includes(pathname) && !request.cookies.get(COOKIE)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons/|sw.js).*)"],
};
