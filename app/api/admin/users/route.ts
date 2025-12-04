// /api/admin/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

export interface AdminUserListItem {
  id: number;
  username: string | null;
  email: string | null;
  role: "USER" | "ADMIN";
  createdAt: Date;
}

export async function GET(req: Request): Promise<NextResponse<AdminUserListItem[]>> {
  await apiAuth([ROLES.ADMIN]); // guaranteed to return a session or throw 401

  const users = await prisma.user.findMany({
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}
