// /types/next-auth.d.ts
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: number;
    email: string | null;
    username: string | null;
    role: "USER" | "ADMIN";
    hasCreatorProfile: boolean;
  }

  interface Session {
    user: User;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: number;
    email: string | null;
    username: string | null;
    role: "USER" | "ADMIN";
    hasCreatorProfile: boolean;
  }
}
