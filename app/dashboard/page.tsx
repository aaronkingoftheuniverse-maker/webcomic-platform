// app/dashboard/page.tsx
import { requireAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { redirect } from "next/navigation";

export default async function DashboardRouterPage() {
  const session = await requireAuth();
  const { role } = session.user;

  // Admin → Admin Dashboard
  if (role === ROLES.ADMIN) {
    redirect("/dashboard/admin");
  }

  // User → Creator Dashboard
  if (role === ROLES.USER) {
    redirect("/dashboard/creator");
  }

  // Should never occur
  redirect("/unauthorized");
}
