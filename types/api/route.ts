import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

/**
 * GET /api/user/subscriptions
 * Fetches the list of comics the authenticated user is subscribed to.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await apiAuth([ROLES.USER]);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const userWithSubscriptions = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        subscribedComics: {
          select: {
            id: true,
            title: true,
            slug: true,
            coverImage: true,
            creatorProfile: {
              select: {
                user: { select: { username: true } },
              },
            },
          },
          orderBy: { title: "asc" },
        },
      },
    });

    if (!userWithSubscriptions) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ subscribedComics: userWithSubscriptions.subscribedComics });
  } catch (err) {
    console.error("[GET /api/user/subscriptions] Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}