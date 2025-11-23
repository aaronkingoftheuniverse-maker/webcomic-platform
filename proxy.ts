import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const handler = withAuth(
  function proxy(req) {
    const { pathname, origin } = req.nextUrl;
    const token = req.nextauth?.token;
    const userRole = token?.role;

    // 1. Redirect unauthenticated users
    if (!token) {
      const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(`${origin}/signin?callbackUrl=${callbackUrl}`);
    }

    // 2. Unauthorized → Admin routes
    // 🔧 FIX: must include leading slash
    if (pathname.startsWith("/dashboard/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // 3. Unauthorized → Creator routes
    // 🔧 FIX: must include leading slash
    if (pathname.startsWith("/dashboard/creator") && userRole !== "USER") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export default handler;

// Apply middleware only to specific routes
export const config = {
  matcher: ["/dashboard/:path*", "/profile/:path*"],
};
