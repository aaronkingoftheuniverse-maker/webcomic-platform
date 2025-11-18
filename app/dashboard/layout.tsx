import DashboardNav from "@/components/dashboard/DashboardNav";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <DashboardNav />
      <main className="flex-1 bg-gray-50 p-6">{children}</main>
    </div>
  );
}
