import type { Metadata } from "next";
import { Courier_Prime } from "next/font/google";
import "./globals.css";

import Providers from "./providers";
import Header from "@/components/ui/header/Header";
import { Toaster } from "@/components/ui/sonner";

const courierPrime = Courier_Prime({
  variable: "--font-courier-prime",
  weight: ["400", "700"],
  style: ["normal", "italic"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Webcomic Platform",
  description: "A Next.js webcomic platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${courierPrime.variable} antialiased bg-gray-50 text-gray-900 min-h-screen`}
      >
        <Providers>
          <Toaster richColors position="top-right" />
          <Header />

          {/* Page content */}
          <main className="p-6">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
