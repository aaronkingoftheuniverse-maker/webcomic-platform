import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { requireCreatorProfile, generateSlug } from "@/lib/creatorHelpers";
import { saveFile } from "@/lib/fileHelpers";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";

const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(req: NextRequest) {
  try {
    const session = await apiAuth([ROLES.USER]);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const episodeId = parseInt(formData.get("episodeId") as string, 10);
    const images = formData.getAll("images") as File[];
    const thumbnailIndex = formData.get("thumbnailIndex") as string | null;

    if (!title || !episodeId) {
      return NextResponse.json({ error: "Title and Episode ID are required" }, { status: 400 });
    }

    // Verify ownership of the episode
    const episode = await prisma.episode.findFirst({
      where: {
        id: episodeId,
        comic: { creatorProfileId: creatorProfile.id },
      },
      include: { posts: true },
    });

    if (!episode) {
      return NextResponse.json({ error: "Episode not found or unauthorized" }, { status: 404 });
    }

    // Process and save uploaded images
    const savedImagePaths = await Promise.all(
      images.map(imageFile =>
        saveFile(imageFile, "posts/images", ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES)
      )
    );

    const nextPostNumber =
      episode.posts.length > 0
        ? Math.max(...episode.posts.map((p) => p.postNumber)) + 1
        : 1;

    const post = await prisma.post.create({
      data: {
        title,
        description,
        slug: generateSlug(title),
        postNumber: nextPostNumber,
        episodeId: episode.id,
        images: {
          create: savedImagePaths.map((path, index) => ({
            filename: path,
            order: index,
            storageProvider: "local",
          })),
        },
      },
      include: {
        images: true, // Include created images to get their IDs
      },
    });

    // Set the thumbnail if one was selected
    if (thumbnailIndex !== null) {
      const thumbIndex = parseInt(thumbnailIndex, 10);
      if (post.images && post.images[thumbIndex]) {
        const thumbImageId = post.images[thumbIndex].id;
        await prisma.post.update({
          where: { id: post.id },
          data: { thumbnailImageId: thumbImageId },
        });
      }
    }

    return NextResponse.json({ ok: true, post }, { status: 201 });

  } catch (err) {
    if (err instanceof CreatorProfileNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof NextResponse) {
      return err;
    }
    if (err instanceof Error && err.message.includes("File size exceeds")) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }

    console.error("[POST /api/creator/posts] Unhandled Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}