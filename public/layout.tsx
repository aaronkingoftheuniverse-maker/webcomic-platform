import "../globals.css";
import { ReactNode } from "react";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-white text-gray-900 font-sans">
        <header className="border-b p-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-magenta-600">My Webcomic</h1>
          <nav>
            <a href="/" className="mr-4 hover:underline">Home</a>
            <a href="/login" className="hover:underline">Login</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="border-t text-center p-4 mt-8 text-sm text-gray-500">
          © {new Date().getFullYear()} Webcomic Platform
        </footer>
      </body>
    </html>
  );
}
