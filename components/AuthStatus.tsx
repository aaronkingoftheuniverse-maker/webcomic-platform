"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function AuthStatus() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <span className="text-gray-300 text-sm animate-pulse">Loading...</span>;
  }

  if (!session) {
    return (
      <button
        onClick={() => signIn()}
        className="text-sm underline hover:text-gray-300"
      >
        Login / Signup
      </button>
    );
  }

  const username = session.user?.name || session.user?.email || "User";

  return (
    <div className="flex items-center gap-3 text-sm">
      {/* Profile placeholder circle */}
      <div className="w-6 h-6 bg-white rounded-full" />

      <span className="hidden sm:inline">Welcome, {username}!</span>

      <Link href="/dashboard" className="nav_link">
        Dashboard
      </Link>

<a
  href="#"
  onClick={(e) => {
    e.preventDefault(); // prevent page jump
    signOut({ callbackUrl: "/" });
  }}
  className="nav_link"
>
  Logout
</a>
    </div>
  );
}
