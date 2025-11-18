// lib/withPageAuth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";

/**
 * Enforces role-based access for server-rendered pages.
 *
 * - Fetches the active session server-side.
 * - Redirects to /signin if not authenticated.
 * - Redirects to /unauthorized if role not permitted.
 * - Returns the session if authorized.
 *
 * Use this in server components that fetch sensitive data directly.
 */
export async function withPageAuth(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);

  // Case 1: No active session
  if (!session?.user) {
    redirect("/signin");
  }

  const role = (session.user as any).role;

  // Case 2: Role not permitted
  if (!allowedRoles.includes(role)) {
    redirect("/unauthorized");
  }

  // Case 3: Authorized
  return session;
}
