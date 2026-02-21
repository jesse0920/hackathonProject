import { NextResponse, type NextRequest } from "next/server";

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => (
    cookie.name.startsWith("sb-") && cookie.name.includes("auth-token")
  ));
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith("/profile");
  const isAuthPage = pathname.startsWith("/login");
  const hasAuthCookie = hasSupabaseAuthCookie(request);

  if (isProtectedRoute && !hasAuthCookie) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("error", "Please sign in to continue");
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && hasAuthCookie) {
    const profileUrl = request.nextUrl.clone();
    profileUrl.pathname = "/profile";
    profileUrl.search = "";
    return NextResponse.redirect(profileUrl);
  }

  return NextResponse.next({ request });
}

export const config = {
  matcher: ["/profile/:path*", "/login"],
};
