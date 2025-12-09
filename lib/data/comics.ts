import "server-only"; // Ensures this code only runs on the server
import { prisma } from "@/config/prisma";
import type { NavEpisode, NavPost } from "@/components/comics/ComicNavTree"; // Import types for tree building
import { notFound } from "next/navigation";

/**
 * The single source of truth for fetching detailed comic data.
 * Fetches a comic and all its episodes and posts.
 * @param slug The slug of the comic to fetch.
 * @param publishedOnly If true, only fetches published content.
 */
export async function getComicDetails(slug: string, publishedOnly: boolean) {
  const contentWhereClause = publishedOnly
    ? { publishedAt: { lte: new Date() } }
    : {};

  const comicData = await prisma.comic.findUnique({
    where: { slug },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverImage: true,
      creatorProfileId: true, // Select for ownership check
      creatorProfile: {
        select: {
          id: true, // Select for ownership check
          bio: true,
          website: true,
          avatarUrl: true,
          user: { select: { username: true } },
        },
      },
      episodes: {
        where: contentWhereClause,
        orderBy: { episodeNumber: "asc" },
        select: {
          id: true,
          title: true,
          episodeNumber: true,
          thumbnailUrl: true,
          publishedAt: true,
          parentId: true,
          posts: {
            where: contentWhereClause,
            orderBy: { postNumber: "asc" },
            select: {
              id: true,
              title: true,
              slug: true,
              publishedAt: true,
              thumbnailImage: { select: { filename: true } },
            },
          },
        },
      },
    },
  });

  if (!comicData) {
    // Return null to allow the caller (API route or Page) to handle the not found case.
    return null;
  }

  // Build the tree structure from the flat list of episodes
  const episodes = comicData.episodes;
  const episodeMap = new Map(episodes.map(e => [e.id, { ...e, childEpisodes: [] } as NavEpisode]));

  episodeMap.forEach((episodeNode) => {
    if (episodeNode.parentId && episodeMap.has(episodeNode.parentId)) {
      episodeMap.get(episodeNode.parentId)!.childEpisodes.push(episodeNode);
    }
  });

  const rootEpisodes = Array.from(episodeMap.values()).filter(e => !e.parentId || !episodeMap.has(e.parentId));

  return {
    ...comicData,
    episodes: rootEpisodes,
  };
}

export async function getComicLayoutData(slug: string) {
  // Guard clause to prevent running with an undefined slug
  if (!slug) {
    console.warn("[getComicLayoutData] Attempted to fetch data with an undefined slug.");
    notFound();
  }

  try {
    // 1. Fetch the comic's main details and a FLAT LIST of all its published episodes
    const comic = await getComicDetails(slug, true); // Fetch published content only
    if (!comic) {
      // The page/layout is the correct place to call notFound()
      notFound();
    }
    return comic;
  } catch (err) {
    console.error(`[getComicLayoutData] Failed to fetch data for slug ${slug}:`, err);
    // Re-throw or handle as needed. For a layout, throwing is often best.
    throw new Error("Failed to fetch comic layout data");
  }
}