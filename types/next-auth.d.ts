// types/next-auth.d.ts

import { DefaultSession, DefaultUser } from "next-auth";

// Your Prisma role enum:
export type AppRole = "ADMIN" | "CREATOR" | "PRO_CREATOR" | "USER";

declare module "next-auth" {
  interface User extends DefaultUser {
    id: number;
    role: AppRole;
    username: string | null;
    email: string | null;
  }

  interface Session {
    user: {
      id: number;
      role: AppRole;
      username: string | null;
      email: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    role: AppRole;
    username: string | null;
    email: string | null;
  }
}
