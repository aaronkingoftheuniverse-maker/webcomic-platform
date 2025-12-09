import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";

// This forces the route to be dynamic, preventing the response from being cached.
export const dynamic = "force-dynamic";

/**
 * GET /api/subscriptions
 * Fetches all subscription-related data for the authenticated user.
 * - Comics the user is subscribed to.
 * - If the user is a creator:
 *   - A list of their comics with their respective subscribers.
 *   - A list of users subscribed directly to their creator profile.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await apiAuth([ROLES.USER]);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    // Fetch both user's subscriptions and creator's subscribers in parallel
    const [userWithSubscriptions, creatorData] = await Promise.all([
      // 1. Fetch comics the current user is subscribed to
      prisma.user.findUnique({
        where: { id: userId },
        select: {
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
      }),

      // 2. If the user is a creator, fetch their comics and the subscribers for each
      prisma.creatorProfile.findUnique({
        where: { userId },
        select: {
          subscribers: {
            select: {
              id: true,
              username: true,
              email: true,
              createdAt: true,
            },
            orderBy: { username: "asc" },
          },
          comics: {
            select: {
              id: true,
              title: true,
              slug: true,
              subscribers: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  createdAt: true,
                },
                orderBy: { username: "asc" },
              },
            },
            orderBy: { title: "asc" },
          },
        },
      }),
    ]);

    if (!userWithSubscriptions) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    return NextResponse.json({
      subscribedComics: userWithSubscriptions.subscribedComics,
      creatorComicsWithSubscribers: creatorData?.comics ?? null,
      creatorProfileSubscribers: creatorData?.subscribers ?? null,
    });
  } catch (err) {
    console.error("[GET /api/creator/subscriptions] Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}