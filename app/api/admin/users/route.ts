// /api/admin/users/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { requireApiRole } from "@/lib/auth/apiAuth";

//
// 1. Define the typed shape returned by this route
//
export interface AdminUserListItem {
  id: number;
  username: string | null;
  email: string | null;
  role: "USER" | "ADMIN";
  createdAt: Date;
}

//
// 2. GET /api/admin/users — Admin Only
//
export async function GET(req: Request): Promise<NextResponse<AdminUserListItem[]>> {
  // Authorization (typed)
  const session = await requireApiRole(["ADMIN"]);
  if (session instanceof NextResponse) return session;

  // Query (typed via select)
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
