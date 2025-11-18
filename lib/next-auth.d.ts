// /types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: number;
    username?: string | null;
    role?: "USER" | "CREATOR" | "ADMIN";
    email?: string | null;
  }

  interface Session {
    user: User & {
      // keep default fields
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: number;
    role?: string;
    username?: string;
  }
}
