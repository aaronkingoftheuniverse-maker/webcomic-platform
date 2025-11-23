"use client";

import Link from "next/link";
import AuthStatus from "@/components/AuthStatus";

// UI assets go in /public/assets/ui/logo.svg for example.
// <img src="/assets/ui/logo.svg" /> OR use next/image later.

export default function Header() {
  return (
    <header className="site-header">
      <div className="wrapper site-header__wrapper">
        {/* Left: Logo + site name */}
        <a href="#" className="branding">
          {/* Placeholder logo */}
          <div className="w-6 h-6 rounded-full bg-white opacity-90" />
          <span className="font-semibold tracking-wide">My Comic Platform</span>
        </a>

        {/* Right: Auth */}
        <nav className="site-nav">
          <AuthStatus />
        </nav>
      </div>
    </header>
  );
}
