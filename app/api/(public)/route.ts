import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { mapComicToDTO } from "@/lib/dtoMappers";

/**
 * GET /api/homepage
 * Fetches curated lists of comics for the public homepage.
 * This route is designed to be cached.
 */
export async function GET() {
  try {
    // Fetch different sections of comics in parallel for performance.
    const [recentlyUpdated, newlyAdded] = await Promise.all([
      // Section 1: Recently Updated Comics
      // Fetches comics ordered by the most recent *published* post.
      // This is a multi-step process as Prisma cannot directly order by a nested aggregate.
      prisma.comic.findMany({
        where: {
          episodes: {
            some: {
              posts: {
                some: {
                  publishedAt: { lte: new Date() },
                },
              },
            },
          },
        },
        select: getComicCardSelect(),
      }),

      // Section 2: Newest Comics
      // Fetches comics ordered by when the comic itself was created.
      prisma.comic.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: getComicCardSelect(),
      }),
    ]);

    // For the "Recently Updated" section, we need to fetch the last post date for each comic
    // and then sort them in memory.
    const recentlyUpdatedWithDates = await Promise.all(
      recentlyUpdated.map(async (comic) => {
        const lastPost = await prisma.post.findFirst({
          where: { episode: { comicId: comic.id }, publishedAt: { lte: new Date() } },
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        return {
          ...comic,
          lastPostedAt: lastPost?.publishedAt, // Keep as Date object for sorting
        };
      })
    );

    // Now, sort the comics by the fetched date and take the top 6
    const sortedRecentlyUpdated = recentlyUpdatedWithDates
      .sort((a, b) => (b.lastPostedAt?.getTime() ?? 0) - (a.lastPostedAt?.getTime() ?? 0))
      .slice(0, 6)
      .map((comic) => mapComicToDTO({
        ...comic,
        lastPostedAt: comic.lastPostedAt?.toISOString() ?? null,
      }));

    return NextResponse.json({
      recentlyUpdated: sortedRecentlyUpdated,
      // The "newlyAdded" comics don't need this complex sorting, so we can map them directly.
      newlyAdded: newlyAdded.map((comic) => mapComicToDTO({ ...comic, lastPostedAt: null })),
    });
  } catch (err) {
    console.error("[GET /api/homepage] Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Helper function to keep Prisma select queries consistent
function getComicCardSelect() {
  return {
    id: true,
    title: true,
    slug: true,
    description: true,
    coverImage: true,
    _count: { select: { episodes: true } },
    episodes: { select: { _count: { select: { posts: true } } } },
  };
}
