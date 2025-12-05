// /api/creator/comics/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { requireCreatorProfile } from "@/lib/creatorHelpers";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";

// This forces the route to be rendered dynamically on every request.
export const dynamic = "force-dynamic";

// Shared error handler
function handleRouteError(err: any) {
  if (err instanceof CreatorProfileNotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof NextResponse) return err;
  console.error("[/api/creator/comics/[slug]] error:", err);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}

// GET — fetch a single comic + its episodes and posts
export async function GET(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    // Failsafe method: Get the slug directly from the URL pathname.
    const slug = req.nextUrl.pathname.split('/').pop()!;
    console.log("\n--- [API] GET /api/creator/comics/[slug] ---");
    console.log("[API] Received slug from URL:", slug);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // ✅ FIX 2: Define creatorProfile before using it.
    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);
    console.log(`[API] Authenticated as user ID: ${userId}, creatorProfile ID: ${creatorProfile.id}`);

    const whereClause = {
      slug: slug,
      creatorProfileId: creatorProfile.id,
    };
    console.log("[API] ==> Prisma query where clause:", whereClause);
    
    const comic = await prisma.comic.findFirst({
      where: whereClause,
      // Include the nested structure of episodes and posts with thumbnails
      include: {
        episodes: {
          where: { parentId: null }, // Fetch only top-level episodes
          orderBy: { episodeNumber: "asc" },
          include: {
            posts: {
              orderBy: { postNumber: "asc" },
              include: { thumbnailImage: true }, // Include post thumbnails
            },
            childEpisodes: {
              orderBy: { episodeNumber: "asc" },
              include: { posts: { orderBy: { postNumber: "asc" }, include: { thumbnailImage: true } } },
            },
          },
        },
      },
    });

    console.log(`[API] <== Prisma query result: ${comic ? `Found comic '${comic.title}'` : "Not Found"}`);

    if (!comic) {
      return NextResponse.json({ error: "Comic not found" }, { status: 404 });
    }

    console.log("--- [API] Request End ---");
    return NextResponse.json({ comic });
  } catch (err) {
    return handleRouteError(err);
  }
}

// PATCH — update comic fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const { slug } = params;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);

    const body = await req.json();

    // Prevent slug from being updated directly if it's in the body
    if (body.slug) {
      delete body.slug;
    }

    const updated = await prisma.comic.updateMany({
      where: {
        slug: slug,
        creatorProfileId: creatorProfile.id,
      },
      data: body,
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Comic not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err);
  }
}

// DELETE — delete a comic
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const { slug } = params;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);

    const deleted = await prisma.comic.deleteMany({
      where: {
        slug: slug,
        creatorProfileId: creatorProfile.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Comic not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err);
  }
}