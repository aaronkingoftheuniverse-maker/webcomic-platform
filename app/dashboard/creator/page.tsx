import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/roleCheck";

export default async function CreatorDashboard() {
  const { authorized, redirect: dest } = await requireRole(["CREATOR", "ADMIN"]);

  if (!authorized) redirect(dest);

  return (
    <div>
      <h1>Creator Dashboard</h1>
      <p>Manage your content here.</p>
    </div>
  );
}
