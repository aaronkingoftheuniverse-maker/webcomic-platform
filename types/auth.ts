// /types/auth.ts
export type AppRole = "USER" | "CREATOR" | "ADMIN" | "PRO_CREATOR";

export interface AppUser {
  id: number | null;
  role: AppRole;
  username: string | null;
  email: string | null;
}

export interface AppSession {
  user: AppUser;
  expires?: string;
}
