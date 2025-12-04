import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { resolveMenu } from "./menu";
import SidebarClientActions from "./SidebarClientActions";

export default async function SidebarServer() {
  const session = await requireAuth();
  const { role, hasCreatorProfile, username } = session.user;

  const menu = resolveMenu(role, hasCreatorProfile);

  return (
    <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col min-h-screen">
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>

      <div className="flex flex-col gap-2">
        {menu.map((item) => (
          <Link key={item.href} href={item.href} className="hover:underline">
            {item.label}
          </Link>
        ))}
      </div>

      <div className="mt-auto">
        <SidebarClientActions username={username} />
      </div>
    </aside>
  );
}
