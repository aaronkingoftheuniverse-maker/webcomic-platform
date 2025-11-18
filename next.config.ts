import type { NextConfig } from "next";

const nextConfig = {
  reactStrictMode: true,
};
export default nextConfig;

export const proxy = {
  matcher: ["/dashboard/:path*"],
};