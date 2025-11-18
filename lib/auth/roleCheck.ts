import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireRole(allowedRoles: string[]) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user) {
    return { authorized: false, redirect: "/signin" };
  }

  const userRole = session.user.role;

  if (!allowedRoles.includes(userRole)) {
    return { authorized: false, redirect: "/unauthorized" };
  }

  return { authorized: true, session };
}
