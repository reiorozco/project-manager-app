import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_API_PREFIXES = ["/api/projects", "/api/users/designers", "/api/auth"];
const AUTH_PAGE_PREFIXES = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  const path = request.nextUrl.pathname;
  const isPublicApi = PUBLIC_API_PREFIXES.some((p) => path.startsWith(p));
  const isAuthPage = AUTH_PAGE_PREFIXES.some((p) => path.startsWith(p));

  if (!session && !isPublicApi && !path.startsWith("/auth")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }
  if (session && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  runtime: "nodejs",
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
