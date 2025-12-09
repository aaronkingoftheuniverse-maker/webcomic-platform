import "server-only";
import { prisma } from "@/config/prisma";
import { mapComicToDTO } from "@/lib/dtoMappers";
import { notFound } from "next/navigation";

/**
 * The single source of truth for fetching a creator's public page data.
 * @param username The username of the creator.
 */
export async function getCreatorPageData(username: string) {
  const creatorProfile = await prisma.creatorProfile.findFirst({
    where: {
      user: {
        username: username,
      },
    },
    select: {
      // Creator's public info
      bio: true,
      website: true,
      avatarUrl: true,
      user: {
        select: {
          username: true,
        },
      },
      // Creator's published comics
      comics: {
        where: {
          episodes: {
            some: { posts: { some: { publishedAt: { lte: new Date() } } } },
          },
        },
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          coverImage: true,
          _count: { select: { episodes: true } },
          episodes: { select: { _count: { select: { posts: true } } } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!creatorProfile) {
    notFound();
  }

  // Map the comics to the ComicCardData DTO
  const comicsDTO = creatorProfile.comics.map((comic) =>
    mapComicToDTO({ ...comic, lastPostedAt: null }) // lastPostedAt can be added later if needed
  );

  return { ...creatorProfile, comics: comicsDTO };
}