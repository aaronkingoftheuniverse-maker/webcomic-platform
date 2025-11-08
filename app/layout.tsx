import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import AuthStatus from "@/components/AuthStatus"; // ✅ import

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Webcomic Platform",
  description: "A Next.js webcomic platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-900`}
      >
        <Providers>
          <header className="flex justify-between items-center p-4 border-b bg-white shadow-sm">
            <h1 className="text-lg font-semibold tracking-tight">
              Webcomic Platform
            </h1>
            <AuthStatus />
          </header>
          <main className="p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
