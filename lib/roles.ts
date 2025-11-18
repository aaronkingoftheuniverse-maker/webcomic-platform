export const ROLES = {
  ADMIN: "ADMIN",
  CREATOR: "CREATOR",
  PRO_CREATOR: "PRO_CREATOR",
  USER: "USER",
} as const;

export type Role = keyof typeof ROLES;
