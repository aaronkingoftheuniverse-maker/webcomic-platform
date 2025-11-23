// app/dashboard/admin/page.tsx
import { requireRole } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import LoginLogsTable from "./components/LoginLogsTable";
import ActivityLogsTable from "./components/ActivityLogsTable";

export default async function AdminDashboardPage() {
  // Admin-only access
  const session = await requireRole([ROLES.ADMIN]);

  return (
    <div className="space-y-8 p-8">
      <header>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {session.user.username} 👋
        </p>
      </header>

      <section>
        <h2 className="text-xl font-semibold mb-4">Login Logs</h2>
        <LoginLogsTable />
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">API Activity Logs</h2>
        <ActivityLogsTable />
      </section>
    </div>
  );
}
