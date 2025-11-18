import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";
import { mapComicToDTO } from "@/lib/dtoMappers";
import type { FetchComicResponse } from "@/types/api/comics";

/**
 * Safe slug-or-id extractor specifically for the route:
 *   /api/creator/comics/[slug]
 *
 * This version avoids relying on req.params.
 */
async function extractComicIdSlugSafe(req: NextRequest): Promise<number | null> {
  // Example pathname: /api/creator/comics/my-cool-comic
  const segments = req.nextUrl.pathname.split("/");
  const slugOrId = segments.pop(); // [slug]

  if (!slugOrId) return null;

  // If numeric: treat as ID
  if (/^\d+$/.test(slugOrId)) {
    return Number(slugOrId);
  }

  // Otherwise resolve by slug
  const comic = await prisma.comic.findUnique({
    where: { slug: slugOrId },
    select: { id: true },
  });

  return comic?.id ?? null;
}

export const GET = withAuth(["CREATOR"], async (req: NextRequest, user) => {
  try {
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const comicId = await extractComicIdSlugSafe(req);

    if (!comicId) {
      return NextResponse.json(
        { error: "Invalid comic identifier (slug or numeric ID expected)" },
        { status: 400 }
      );
    }

    const comic = await prisma.comic.findFirst({
      where: {
        id: comicId,
        creatorProfile: { userId: user.id }, // ownership check
      },
      include: {
        posts: {
          select: {
            id: true,
            title: true,
            postNumber: true,
            createdAt: true,
          },
        },
      },
    });

    if (!comic) {
      return NextResponse.json({ error: "Comic not found" }, { status: 404 });
    }

    const dto = mapComicToDTO(comic);

    const response: FetchComicResponse = { comic: dto };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Comic fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comic" },
      { status: 500 }
    );
  }
});
