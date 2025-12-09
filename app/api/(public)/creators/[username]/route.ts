import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { mapComicToDTO } from "@/lib/dtoMappers";

/**
 * GET /api/creators/[username]
 * Fetches a creator's public profile and a list of their published comics.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

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
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    // Map the comics to the ComicCardData DTO
    const comicsDTO = creatorProfile.comics.map((comic) =>
      mapComicToDTO({ ...comic, lastPostedAt: null }) // lastPostedAt can be added later if needed
    );

    return NextResponse.json({ ...creatorProfile, comics: comicsDTO });
  } catch (err) {
    console.error(`[GET /api/creators/${params.username}] Server Error:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}