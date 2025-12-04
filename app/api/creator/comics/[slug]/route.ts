// /api/creator/comics/[slug]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { requireCreatorProfile } from "@/lib/creatorHelpers";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";

// GET — fetch a single comic + its posts
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const { slug } = await params;

    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const creatorProfile = await requireCreatorProfile(session.user.id as number);

    const comic = await prisma.comic.findFirst({
      where: {
        slug: slug,
        creatorProfileId: creatorProfile.id,
      },
      // Include the nested structure of episodes and posts
      include: {
        episodes: {
          where: { parentId: null }, // Fetch only top-level episodes
          orderBy: { episodeNumber: "asc" },
          include: {
            posts: {
              orderBy: { postNumber: "asc" },
            },
            // Include one level of nested child episodes
            childEpisodes: {
              orderBy: { episodeNumber: "asc" },
              include: {
                posts: { orderBy: { postNumber: "asc" } },
              },
            },
          },
        },
      },
    });

    if (!comic) {
      return NextResponse.json({ error: "Comic not found" }, { status: 404 });
    }

    return NextResponse.json({ comic });
  } catch (err) {
    return handleRouteError(err);
  }
}

// PATCH — update comic fields
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const { slug } = await params;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const creatorProfile = await requireCreatorProfile(session.user.id as number);
    const body = await req.json();

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
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const { slug } = await params;
    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }
    const creatorProfile = await requireCreatorProfile(session.user.id as number);

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

// Shared error handler
function handleRouteError(err: any) {
  if (err instanceof CreatorProfileNotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof NextResponse) return err;
  console.error("[/api/creator/comics/[slug]] error:", err);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
