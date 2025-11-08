import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const handler = withAuth(
  function proxy(req) {
    const { pathname, origin } = req.nextUrl;
    const token = req.nextauth?.token;
    const userRole = token?.role;

    // 🔹 1. Not signed in → redirect to /signin
    if (!token) {
      const callbackUrl = encodeURIComponent(req.nextUrl.pathname);
      return NextResponse.redirect(`${origin}/signin?callbackUrl=${callbackUrl}`);
    }

    // 🔹 2. Signed in but unauthorized (role check)
    if (pathname.startsWith("/admin") && userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }

    // 🔹 3. Authorized → allow through
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // only run middleware for signed-in users
    },
  }
);

export default handler;

// 🔹 Limit middleware to certain routes
export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
