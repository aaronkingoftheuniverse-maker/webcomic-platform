import { ROLES } from "@/lib/roles";

export const baseMenu = [
  { href: "/dashboard", label: "Home" },
];

export const adminMenu = [
  { href: "/dashboard/admin", label: "Admin Overview" },
  { href: "/dashboard/admin/users", label: "Manage Users" },
  { href: "/dashboard/admin/settings", label: "Settings" },
];

export const creatorMenu = [
  { href: "/dashboard/creator", label: "Creator Home" },
  { href: "/dashboard/creator/comics", label: "My Comics" },
  { href: "/dashboard/creator/posts", label: "Posts" },
];

export const createProfileMenu = [
  { href: "/dashboard/creator/create-profile", label: "Create Creator Profile" },
];

export function resolveMenu(role: string, hasCreatorProfile: boolean) {
  let menu = [...baseMenu];

  // Admin gets admin + creator-level tools automatically
  if (role === ROLES.ADMIN) {
    menu = [...menu, ...adminMenu];
    return menu;
  }

  // Normal USER behavior
  if (role === ROLES.USER) {
    if (!hasCreatorProfile) {
      return [...menu, ...createProfileMenu];
    }
    return [...menu, ...creatorMenu];
  }

  return menu; // fallback
}
