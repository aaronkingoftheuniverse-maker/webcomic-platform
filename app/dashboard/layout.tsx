// app/dashboard/layout.tsx
import DashboardNav from "@/components/dashboard/DashboardNav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Server-side Nav */}
      <DashboardNav />

      <main className="flex-1 bg-gray-50 p-6">
        {children}
      </main>
    </div>
  );
}
