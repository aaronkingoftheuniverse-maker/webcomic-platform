import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { requireCreatorProfile } from "@/lib/creatorHelpers";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";
import { updateEpisodeSchema } from "@/types/api/episodes";
import { handleFileUpload, deleteFile } from "@/lib/uploads"; // Assuming these exist
import { getBreadcrumbsForEpisode } from "@/lib/data/breadcrumbs";

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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    if (!episode) {
      return NextResponse.json({ error: "Episode not found" }, { status: 404 });
    }

    const breadcrumbs = await getBreadcrumbsForEpisode(episode.id, '/dashboard/creator');

    return NextResponse.json({ episode, breadcrumbs });
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
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await paramsPromise; // Unpack the promise here

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const episodeId = parseInt(params.episodeId, 10);
    if (isNaN(episodeId)) return NextResponse.json({ error: "Invalid episode ID" }, { status: 400 });

    // Verify ownership before proceeding
    await verifyEpisodeOwnership(params.slug, episodeId, userId);

    let dataToUpdate: Record<string, any> = {};
    let thumbnailUrl: string | null | undefined;
    let removeThumbnail: boolean = false;

    // Determine if the request is JSON or FormData
    const contentType = req.headers.get("content-type");
    if (contentType?.includes("multipart/form-data")) {
      const formData = await req.formData();
      const title = formData.get("title") as string;
      const description = formData.get("description") as string;
      const episodeNumber = formData.get("episodeNumber") as string;
      const publishedAtStr = formData.get("publishedAt") as string;
      const thumbnail = formData.get("thumbnail") as File;
      removeThumbnail = formData.get("removeThumbnail") === "true";

      // Validate fields from FormData
      const validation = updateEpisodeSchema.safeParse({
        title,
        description: description === 'null' ? null : description, // Handle 'null' string from FormData
        episodeNumber: episodeNumber ? parseInt(episodeNumber, 10) : undefined,
        publishedAt: publishedAtStr || undefined,
      });

      if (!validation.success) {
        return NextResponse.json({ error: "Invalid form data", details: validation.error.format() }, { status: 400 });
      }

      dataToUpdate = validation.data;

      // Handle thumbnail file upload
      if (thumbnail && thumbnail.size > 0) {
        const uploadResult = await handleFileUpload(thumbnail, "episode-thumbnails");
        if (uploadResult.success) {
          thumbnailUrl = uploadResult.filePath;
        } else {
          return NextResponse.json({ error: uploadResult.error }, { status: 500 });
        }
      } else if (removeThumbnail) {
        thumbnailUrl = null; // Explicitly set to null to remove
      }
      // If no new thumbnail and not removing, thumbnailUrl remains undefined (no change)

    } else {
      // Assume JSON request
      const json = await req.json();
      const validation = updateEpisodeSchema.safeParse(json);

      if (!validation.success) {
        return NextResponse.json({ error: "Invalid request body", details: validation.error.format() }, { status: 400 });
      }
      dataToUpdate = validation.data;
      thumbnailUrl = dataToUpdate.thumbnailUrl; // Get thumbnailUrl from JSON if present
    }

    // Fetch the existing episode to potentially delete old thumbnail
    const existingEpisode = await prisma.episode.findUnique({ where: { id: episodeId }, select: { thumbnailUrl: true } });

    const updatedEpisode = await prisma.episode.update({
      where: { id: episodeId },
      data: {
        ...dataToUpdate,
        publishedAt: typeof dataToUpdate.publishedAt === 'undefined' ? undefined : (dataToUpdate.publishedAt ? new Date(dataToUpdate.publishedAt) : null),
        thumbnailUrl: thumbnailUrl, // Update thumbnailUrl based on logic above
      },
    });

    // If a new thumbnail was uploaded or removed, delete the old one if it existed
    if (thumbnailUrl !== undefined && existingEpisode?.thumbnailUrl && existingEpisode.thumbnailUrl !== thumbnailUrl) {
      await deleteFile(existingEpisode.thumbnailUrl);
    }

    return NextResponse.json({ success: true, episode: updatedEpisode });
  } catch (err: any) {
    if (err instanceof CreatorProfileNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}