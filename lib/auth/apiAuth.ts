import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";

/**
 * Use in API routes to enforce authentication and role-based access.
 * 
 * @param allowedRoles - Roles allowed to access this endpoint.
 * @returns {session | NextResponse} - Session if authorized, or redirect/403 if not.
 */
export async function requireApiRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Not authenticated" },
      { status: 401 }
    );
  }

  const userRole = session.user.role;
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json(
      { error: "Forbidden: insufficient role" },
      { status: 403 }
    );
  }

  return session;
}
