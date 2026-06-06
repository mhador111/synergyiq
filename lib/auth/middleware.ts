import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authEdgeConfig } from "@/lib/auth/edge-config";

/**
 * Edge-runtime auth instance. Built from `authEdgeConfig` so the
 * Mongoose-loaded `lib/auth/auth.ts` is never pulled into the
 * middleware bundle.
 */
const { auth } = NextAuth(authEdgeConfig);

export default auth((req) => {
  const isLoggedIn = Boolean(req.auth);
  const { pathname } = req.nextUrl;

  const isAuthPage = pathname === "/login" || pathname === "/signup";
  const isApiAuth = pathname.startsWith("/api/auth");
  const isProtectedApi =
    pathname.startsWith("/api/") && !isApiAuth;
  const isPublic =
    isApiAuth ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/";
  const isProtectedPage =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/analytics") ||
    pathname.startsWith("/activity") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/notifications") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/profile");

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }
  if (isProtectedApi && !isLoggedIn) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isPublic && !isAuthPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  if (isProtectedPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
