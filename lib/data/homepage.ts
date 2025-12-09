import "server-only"; // Ensures this code only runs on the server
import { prisma } from "@/config/prisma";
import { mapComicToDTO } from "@/lib/dtoMappers";

/**
 * Fetches curated lists of comics for the public homepage.
 */
export async function getHomePageData() {
  try {
    const [recentlyUpdated, newlyAdded] = await Promise.all([
      // Section 1: Recently Updated Comics
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
      prisma.comic.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        select: getComicCardSelect(),
      }),
    ]);

    // For the "Recently Updated" section, sort in memory after fetching dates.
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

    const sortedRecentlyUpdated = recentlyUpdatedWithDates
      .sort((a, b) => (b.lastPostedAt?.getTime() ?? 0) - (a.lastPostedAt?.getTime() ?? 0))
      .slice(0, 6)
      .map((comic) => mapComicToDTO({
        ...comic,
        lastPostedAt: comic.lastPostedAt?.toISOString() ?? null,
      }));

    return {
      recentlyUpdated: sortedRecentlyUpdated,
      newlyAdded: newlyAdded.map((comic) => mapComicToDTO({ ...comic, lastPostedAt: null })),
    };
  } catch (err) {
    console.error("[getHomePageData] Server Error:", err);
    // In a real app, you might want to throw the error to be caught by an error boundary
    return { recentlyUpdated: [], newlyAdded: [] };
  }
}

// Helper function to keep Prisma select queries consistent
function getComicCardSelect() {
  return {
    id: true, title: true, slug: true, description: true, coverImage: true,
    _count: { select: { episodes: true } },
    episodes: { select: { _count: { select: { posts: true } } } },
  };
}