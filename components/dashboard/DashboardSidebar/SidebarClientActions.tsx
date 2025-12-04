"use client";

import { signOut } from "next-auth/react";

export default function SidebarClientActions({ username }: { username: string }) {
  return (
    <div className="mt-6">
      <p className="text-sm text-gray-300 mb-3">
        Signed in as <span className="font-semibold">{username}</span>
      </p>

      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="bg-red-600 px-3 py-1 rounded hover:bg-red-700"
      >
        Sign Out
      </button>
    </div>
  );
}
