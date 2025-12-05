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

export async function POST(
  req: NextRequest,
  context: { params: { slug: string } }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);

    // Failsafe method: Get the slug directly from the URL pathname.
    const pathParts = req.nextUrl.pathname.split('/'); // e.g., ['', 'api', 'creator', 'comics', 'my-slug', 'episodes']
    const slug = pathParts[4]; // The slug is the 5th part of the path

    // Verify ownership of the comic
    const comic = await prisma.comic.findFirst({
      where: {
        slug: slug, // Use the slug extracted from the URL
        creatorProfileId: creatorProfile.id,
      },
    });

    if (!comic) {
      return NextResponse.json({ error: "Comic not found or unauthorized" }, { status: 404 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const episodeNumber = parseInt(formData.get("episodeNumber") as string, 10);
    const parentId = formData.get("parentId") ? parseInt(formData.get("parentId") as string, 10) : null;
    const thumbnailFile = formData.get("thumbnail") as File | null;

    if (!title || isNaN(episodeNumber)) {
      return NextResponse.json({ error: "Title and Episode Number are required" }, { status: 400 });
    }

    let thumbnailUrl: string | null = null;
    if (thumbnailFile) {
      try {
        thumbnailUrl = await saveFile(
          thumbnailFile,
          "episodes/thumbnails",
          ALLOWED_FILE_TYPES,
          MAX_FILE_SIZE_BYTES
        );
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    const episode = await prisma.episode.create({
      data: {
        title,
        description,
        slug: generateSlug(title),
        episodeNumber,
        thumbnailUrl,
        comicId: comic.id,
        parentId: parentId,
      },
    });

    return NextResponse.json({ ok: true, episode }, { status: 201 });

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

    console.error("[POST /api/creator/comics/[slug]/episodes] Unhandled Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}