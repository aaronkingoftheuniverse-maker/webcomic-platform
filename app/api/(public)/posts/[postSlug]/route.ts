import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { getBreadcrumbsForPost } from "@/lib/data/breadcrumbs";

/**
 * GET /api/posts/[postSlug]
 * Fetches the content (images) for a single, published post.
 */
export async function GET(
  req: NextRequest,
  { params: paramsProp }: { params: Promise<{ postSlug: string }> }
) {
  try {
    const params = await paramsProp;
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

    const breadcrumbs = await getBreadcrumbsForPost(post.id);

    return NextResponse.json({ post, breadcrumbs });
  } catch (err) {
    console.error(`[GET /api/posts/${params.postSlug}] Server Error:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}