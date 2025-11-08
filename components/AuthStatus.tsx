"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="text-gray-500 text-sm animate-pulse">Checking auth...</div>
    );
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition"
      >
        Sign In
      </button>
    );
  }

  const username = session.user?.name || session.user?.email || "User";
  const role = (session.user as any)?.role; // cast to any since NextAuth types may not include 'role'

  return (
    <div className="flex items-center gap-4">
      {role === "ADMIN" && (
        <Link
          href="/admin/dashboard"
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          Dashboard
        </Link>
      )}
      <span className="text-sm text-gray-700">
        Signed in as <span className="font-semibold text-gray-900">{username}</span>
      </span>
      <button
        onClick={() => signOut({ callbackUrl: "/signin" })}
        className="px-3 py-1 text-sm font-medium text-white bg-gray-600 rounded hover:bg-gray-700 transition"
      >
        Sign Out
      </button>
    </div>
  );
}
