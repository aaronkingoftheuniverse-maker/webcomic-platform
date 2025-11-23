export interface AppUser {
  id: number | null;
  role: "ADMIN" | "USER";
  username: string | null;
  email: string | null;
}