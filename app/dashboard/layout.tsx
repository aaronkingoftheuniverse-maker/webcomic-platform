// app/dashboard/layout.tsx
import SidebarServer from "@/components/dashboard/DashboardSidebar/SidebarServer";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      {/* Server-side Nav */}
     
      <SidebarServer />
      <main className="flex-1 bg-gray-50 p-8">
        <div className="w-full max-w-7xl mx-auto">

          {children}
        </div>
      </main>
    </div>
  );
}
