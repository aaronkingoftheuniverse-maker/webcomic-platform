// /lib/auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect, NextResponse } from "next/navigation";
import { ROLES, type Role } from "./roles";

/** A simple helper to get the session without any side effects */
export function auth() {
  return getServerSession(authOptions);
}

/** Get the current user session (server-side) */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  console.log("Session User Info:", session?.user);
  if (!session?.user) redirect("/signin");
  return session;
}

/** Restrict by role(s) */
export async function requireRole(allowed: Role[]) {
  
  const session = await requireAuth();
    // Debug logging
  console.log("[requireRole] Allowed roles:", allowed);
  console.log("[requireRole] Session user role:", session.user.role);
  if (!allowed.includes(session.user.role)) {
    console.warn(
      `[requireRole] Role mismatch → user has "${session.user.role}" but needs one of:`,
      allowed
    )
  }
  return session;
}

/** Restrict to users who have (or do not have) a Creator Profile */
export async function requireCreator(hasProfile: boolean = true) {
  const session = await requireAuth();
  if (session.user.hasCreatorProfile !== hasProfile) {
    redirect(hasProfile ? "/creator/create-profile" : "/creator");
  }
  return session;
}

/** Protect API routes: throws instead of returning NextResponse */
export async function apiAuth(allowedRoles: Role[] = [ROLES.USER]) {
  const session = await auth();

  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    // Return null instead of throwing, allowing the API route to handle the response.
    return null;
  }

  return session;
}