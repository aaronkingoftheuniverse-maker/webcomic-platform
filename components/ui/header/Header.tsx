"use client";

import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full flex items-center justify-between bg-black px-4 py-3 text-white shadow-sm">
      {/* Left: Branding */}
      <Link href="/" className="flex items-center gap-2">
        {/* Placeholder logo */}
        <div className="h-6 w-6 rounded-full bg-white opacity-90" />
        <span className="font-semibold tracking-wide">My Comic Platform</span>
      </Link>

      {/* Right: Auth Status */}
      <nav>
        <AuthStatus />
      </nav>
    </header>
  );
}
