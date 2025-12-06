import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { requireCreatorProfile } from "@/lib/creatorHelpers";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";
import { updateEpisodeSchema } from "@/types/api/episodes";

// This forces the route to be rendered dynamically on every request.
export const dynamic = "force-dynamic";

async function verifyEpisodeOwnership(slug: string, episodeId: number, userId: number) {
  const creatorProfile = await requireCreatorProfile(userId);
  const episode = await prisma.episode.findFirst({
    where: {
      id: episodeId,
      comic: {
        slug: slug,
        creatorProfileId: creatorProfile.id,
      },
    },
  });
  if (!episode) {
    throw new Error("Episode not found or you do not have permission.");
  }
  return episode;
}

// GET - Fetch a single episode's details
export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ slug: string; episodeId: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const params = await paramsPromise; // Unpack the promise here
    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const episodeId = parseInt(params.episodeId, 10);
    if (isNaN(episodeId)) return NextResponse.json({ error: "Invalid episode ID" }, { status: 400 });

    const creatorProfile = await requireCreatorProfile(userId);

    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        comic: {
          slug: params.slug,
          creatorProfileId: creatorProfile.id,
        },
      },
      include: {
        posts: {
          orderBy: { postNumber: "asc" },
          include: { thumbnailImage: true },
        },
        childEpisodes: {
          orderBy: { episodeNumber: "asc" },
          include: {
            posts: { orderBy: { postNumber: "asc" }, include: { thumbnailImage: true } },
          },
        },
      },
    });

    return NextResponse.json({ episode });
  } catch (err: any) {
    if (err instanceof CreatorProfileNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PATCH - Update an episode's details
export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ slug: string; episodeId: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    const params = await paramsPromise; // Unpack the promise here
    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const episodeId = parseInt(params.episodeId, 10);
    if (isNaN(episodeId)) return NextResponse.json({ error: "Invalid episode ID" }, { status: 400 });

    // Verify ownership before proceeding
    await verifyEpisodeOwnership(params.slug, episodeId, userId);

    const json = await req.json();
    const validation = updateEpisodeSchema.safeParse(json);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body", details: validation.error.format() }, { status: 400 });
    }

    const { publishedAt, ...dataToUpdate } = validation.data;

    const updatedEpisode = await prisma.episode.update({
      where: { id: episodeId },
      data: {
        ...dataToUpdate,
        // Handle publishedAt separately to convert string to Date or set to null
        // If `publishedAt` is not in the payload, it will be undefined and this field will not be updated.
        publishedAt: typeof publishedAt === 'undefined' ? undefined : (publishedAt ? new Date(publishedAt) : null),
      },
    });

    return NextResponse.json({ success: true, episode: updatedEpisode });
  } catch (err: any) {
    if (err instanceof CreatorProfileNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}