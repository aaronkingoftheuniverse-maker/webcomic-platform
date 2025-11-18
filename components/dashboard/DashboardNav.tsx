"use client";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export default function DashboardNav() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  const links = [
    { href: "/dashboard", label: "Home" },
    ...(role === "ADMIN"
      ? [
          { href: "/dashboard/admin/users", label: "Manage Users" },
          { href: "/dashboard/admin/settings", label: "Settings" },
        ]
      : []),
    ...(role === "CREATOR" || role === "PRO_CREATOR"
      ? [{ href: "/dashboard/creator/comics", label: "My Comics" }]
      : []),
  ];

  return (
    <nav className="w-64 bg-gray-800 text-white flex flex-col p-4">
      <h2 className="text-lg font-bold mb-4">Dashboard</h2>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="mb-2 hover:underline">
          {link.label}
        </Link>
      ))}
      <div className="mt-auto">
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="mt-4 bg-red-600 px-3 py-1 rounded"
        >
          Sign Out
        </button>
      </div>
    </nav>
  );
}
