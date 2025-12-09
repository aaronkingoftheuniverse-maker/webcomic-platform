import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";

/**
 * GET /api/comics/[slug]
 * Fetches all necessary data for a comic's public detail page,
 * including creator info and the full tree of published episodes and posts.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const comic = await prisma.comic.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        description: true,
        // Creator info for the right column
        creatorProfile: {
          select: {
            bio: true,
            website: true,
            avatarUrl: true,
            user: { select: { username: true } },
          },
        },
        // Navigation tree for the left column
        episodes: {
          where: { publishedAt: { lte: new Date() } }, // Only published episodes
          orderBy: { episodeNumber: "asc" },
          select: {
            id: true,
            title: true,
            episodeNumber: true,
            thumbnailUrl: true,
            posts: {
              where: { publishedAt: { lte: new Date() } }, // Only published posts
              orderBy: { postNumber: "asc" },
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnailImage: { select: { filename: true } },
              },
            },
            // Include nested child episodes for the tree
            childEpisodes: {
              where: { publishedAt: { lte: new Date() } },
              orderBy: { episodeNumber: "asc" },
              select: { id: true, title: true, thumbnailUrl: true }, // Keep it light
            },
          },
        },
      },
    });

    if (!comic) {
      return NextResponse.json({ error: "Comic not found" }, { status: 404 });
    }

    return NextResponse.json({ comic });
  } catch (err) {
    console.error(`[GET /api/comics/${params.slug}] Server Error:`, err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}