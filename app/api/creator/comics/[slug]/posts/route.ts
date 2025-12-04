// /api/creator/comics/[slug]/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { requireCreatorProfile } from "@/lib/creatorHelpers";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";

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
    const { slug } = await params;
    const creatorProfile = await requireCreatorProfile(session.user.id);

    const comic = await prisma.comic.findFirst({
      where: {
        slug,
        creatorProfileId: creatorProfile.id,
      },
      include: {
        posts: {
          include: {
            images: {
              orderBy: { id: "asc" },
            },
          },
          orderBy: { postNumber: "asc" },
        },
      },
    });

    if (!comic) {
      return NextResponse.json({ error: "Comic not found" }, { status: 404 });
    }

    return NextResponse.json({ posts: comic.posts });
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
    const { slug } = await params;
    const creatorProfile = await requireCreatorProfile(session.user.id);

    const comic = await prisma.comic.findFirst({
      where: { slug, creatorProfileId: creatorProfile.id },
      include: { posts: true },
    });

    if (!comic) {
      return NextResponse.json({ error: "Comic not found" }, { status: 404 });
    }

    const data = await req.json();

    const nextPostNumber =
      comic.posts.length > 0
        ? Math.max(...comic.posts.map((p) => p.postNumber)) + 1
        : 1;

    const post = await prisma.post.create({
      data: {
        ...data,
        postNumber: nextPostNumber,
        comicId: comic.id,
      },
    });

    return NextResponse.json({ post }, { status: 201 });
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
