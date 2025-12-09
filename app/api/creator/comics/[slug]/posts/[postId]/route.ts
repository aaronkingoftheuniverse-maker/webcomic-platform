// /api/creator/comics/[slug]/posts/[postId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { requireCreatorProfile } from "@/lib/creatorHelpers";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";
import { updatePostSchema } from "@/types/api/posts";

// This forces the route to be dynamic, preventing the response from being cached.
export const dynamic = "force-dynamic";

// GET — fetch a single post
export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const params = await paramsPromise;
    const { slug } = params;
    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);

    const postId = parseInt(params.postId, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
  where: {
    id: postId,
    // Traverse from Post -> Episode -> Comic
    episode: {
      comic: {
        slug: slug,
        creatorProfileId: creatorProfile.id,
      },
    },
  },
  include: {
    images: {
      orderBy: { order: "asc" }, // It's good practice to order images
    },
    thumbnailImage: true, // Also include the thumbnail here
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
  { params: paramsPromise }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const params = await paramsPromise;

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const postId = parseInt(params.postId, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const creatorProfile = await requireCreatorProfile(userId);
    const body = await req.json();
    const validation = updatePostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body", details: validation.error.format() }, { status: 400 });
    }
    const { publishedAt, ...dataToUpdate } = validation.data;

    const updatedPost = await prisma.post.updateMany({
      where: {
        id: postId,
        episode: {
          comic: {
            slug: params.slug,
            creatorProfileId: creatorProfile.id,
          },
        },
      },
      data: {
        ...dataToUpdate,
        publishedAt: typeof publishedAt === 'undefined' ? undefined : (publishedAt ? new Date(publishedAt) : null),
      },
    });

    if (updatedPost.count === 0) {
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}

// DELETE — delete a post
export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const params = await paramsPromise;

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);

    const postId = parseInt(params.postId, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const deleted = await prisma.post.deleteMany({
      where: {
        id: postId,
        episode: {
          comic: {
            slug: params.slug,
            creatorProfileId: creatorProfile.id,
          },
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
