// /api/creator/comics/[slug]/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { requireCreatorProfile } from "@/lib/creatorHelpers";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";
import { createPostSchema } from "@/types/api/posts";

//
// GET — list posts for a comic
// This route is deprecated. Posts are now managed under episodes.
//
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    // This route is deprecated because posts are no longer direct children of comics.
    console.warn(`[GET /api/creator/comics/[slug]/posts] This route is deprecated. Fetch posts via their episode.`);
    return NextResponse.json({ error: "This route is deprecated. Fetch posts via their episode." }, { status: 410 }); // 410 Gone
  } catch (err) {
    return handleError(err);
  }
}

//
// POST — create a new post
//
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);

    const body = await req.json();
    const validation = createPostSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body", details: validation.error.format() }, { status: 400 });
    }

    const { episodeId, publishedAt, ...postData } = validation.data;

    // Verify the creator owns the episode this post is being added to
    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        comic: { creatorProfileId: creatorProfile.id },
      },
      include: { posts: { select: { postNumber: true } } },
    });

    if (!episode) {
      return NextResponse.json({ error: "Episode not found or you do not have permission to add a post to it." }, { status: 404 });
    }

    const nextPostNumber =
      episode.posts.length > 0
        ? Math.max(...episode.posts.map((p) => p.postNumber)) + 1
        : 1;

    const post = await prisma.post.create({
      data: {
        ...postData,
        postNumber: nextPostNumber,
        episodeId: episodeId,
        publishedAt: publishedAt ? new Date(publishedAt) : null,
      },
    });

    return NextResponse.json({ ok: true, post }, { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}

//
// Shared error handler
//
function handleError(err: any) {
  if (err instanceof CreatorProfileNotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof NextResponse) return err;

  console.error("[/api/creator/comics/[slug]/posts] error:", err);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
