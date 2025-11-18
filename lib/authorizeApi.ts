// lib/authorizeApi.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";

type Role = "ADMIN" | "CREATOR" | "PRO_CREATOR" | "USER";

interface RoleRequirement {
  allowed: Role[];
}

export type AuthorizeResult =
  | {
      authorized: true;
      userId: number;
      role: Role;
      username: string | null;
      email: string | null;
    }
  | {
      authorized: false;
      denial: NextResponse;
      userId: number | null;
      role: Role | null;
    };

export async function authorizeApi(
  req: Request,
  { allowed }: RoleRequirement
): Promise<AuthorizeResult> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return {
        authorized: false,
        denial: NextResponse.json({ error: "Authentication required" }, { status: 401 }),
        userId: null,
        role: null,
      };
    }

    const userId = Number(session.user.id);
    if (!userId) {
      return {
        authorized: false,
        denial: NextResponse.json({ error: "Invalid session user" }, { status: 401 }),
        userId: null,
        role: null,
      };
    }

    // Validate user from DB
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return {
        authorized: false,
        denial: NextResponse.json({ error: "User not found" }, { status: 401 }),
        userId: null,
        role: null,
      };
    }

    // Use DB role as canonical
    const role = dbUser.role as Role;

    // Role check
    if (!allowed.includes(role)) {
      return {
        authorized: false,
        denial: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        userId,
        role,
      };
    }

    return {
      authorized: true,
      userId,
      role,
      username: dbUser.username ?? null,
      email: dbUser.email ?? null,
    };
  } catch (err) {
    console.error("authorizeApi error:", err);
    return {
      authorized: false,
      denial: NextResponse.json({ error: "Internal Server Error" }, { status: 500 }),
      userId: null,
      role: null,
    };
  }
}
