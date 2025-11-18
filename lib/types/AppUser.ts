export interface AppUser {
  id: number | null;
  role: "ADMIN" | "CREATOR" | "PRO_CREATOR" | "USER";
  username: string | null;
  email: string | null;
}