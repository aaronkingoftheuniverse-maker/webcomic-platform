// /api/creator/comics/[slug]/posts/[postId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { requireCreatorProfile } from "@/lib/creatorHelpers";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";

// GET — fetch a single post
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string; postId: string } }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const { slug } = await params;
    const creatorProfile = await requireCreatorProfile(session.user.id);

    const postId = parseInt(params.postId, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
      where: {
        id: postId,
        comic: {
          slug: slug,
          creatorProfileId: creatorProfile.id,
        },
      },
      include: {
        images: {
          orderBy: { id: "asc" },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (err) {
    return handleRouteError(err);
  }
}

// PATCH — update a post
export async function PATCH(
  req: NextRequest,
  { params }: { params: { slug: string; postId: string } }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const creatorProfile = await requireCreatorProfile(session.user.id);
    const body = await req.json();

    const postId = parseInt(params.postId, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const updated = await prisma.post.updateMany({
      where: {
        id: postId,
        comic: {
          slug: params.slug,
          creatorProfileId: creatorProfile.id,
        },
      },
      data: body,
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err);
  }
}

// DELETE — delete a post
export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string; postId: string } }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const creatorProfile = await requireCreatorProfile(session.user.id);

    const postId = parseInt(params.postId, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const deleted = await prisma.post.deleteMany({
      where: {
        id: postId,
        comic: {
          slug: params.slug,
          creatorProfileId: creatorProfile.id,
        },
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
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
  console.error("[/api/creator/comics/[slug]/posts/[postId]] error:", err);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
