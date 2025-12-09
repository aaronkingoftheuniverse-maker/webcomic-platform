import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";

/**
 * GET /api/posts/[postSlug]
 * Fetches the content (images) for a single, published post.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { postSlug: string } }
) {
  try {
    const { postSlug } = params;

    const post = await prisma.post.findUnique({
      where: {
        slug: postSlug,
        // Security check: ensure the post is published and not in the future
        publishedAt: {
          lte: new Date(),
        },
      },
      select: {
        id: true,
        title: true,
        images: {
          select: {
            id: true,
            filename: true,
            storagePath: true,
            order: true,
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (err) {
    console.error(`[GET /api/posts/${params.postSlug}] Server Error:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}