import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { z } from "zod";
import { mapComicToDTO } from "@/lib/dtoMappers";
import { requireCreatorProfile, generateSlug } from "@/lib/creatorHelpers";
import { apiAuth } from "@/lib/auth";
import { handleFileUpload } from "@/lib/uploads";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";

// --- Validation constants for server-side check ---
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 🔐 Step 1 — enforce auth
    const session = await apiAuth([ROLES.USER]);

    if (!session?.user?.id) {
      // This should not happen if apiAuth is working, but it's a good safeguard
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // 🔍 Step 2 — creator profile check
    // ✅ FIX: Safely parse the string ID from the session to a number.
    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);

    // 📚 Step 3 — fetch comics with advanced data
    const comicsWithDetails = await prisma.comic.findMany({
      where: {
        creatorProfileId: creatorProfile.id,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: true,
        coverImage: true,
        _count: {
          select: { episodes: true },
        },
        episodes: {
          select: {
            _count: { select: { posts: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Find the latest post date for each comic
    const comicsWithLastPostDate = await Promise.all(
      comicsWithDetails.map(async (comic) => {
        const lastPost = await prisma.post.findFirst({
          where: { episode: { comicId: comic.id } },
          orderBy: { publishedAt: "desc" },
          select: { publishedAt: true },
        });
        return {
          ...comic,
          lastPostedAt: lastPost?.publishedAt?.toISOString() ?? null,
        };
      })
    );

    return NextResponse.json({ comics: comicsWithLastPostDate.map(mapComicToDTO) });
  } catch (err) {
    if (err instanceof NextResponse) {
      // If apiAuth throws a response, forward it.
      return err;
    }
    console.error("[GET /creator/comics] Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function handleError(err: any) {
  if (err instanceof CreatorProfileNotFoundError) {
    return NextResponse.json({ comics: [] });
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await apiAuth([ROLES.USER]);

    if (!session?.user?.id) {
      // This should not happen if apiAuth is working, but it's a good safeguard
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // ✅ FIX: Safely parse the string ID from the session to a number.
    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);

    // --- Step 1: Parse multipart/form-data ---
    const formData = await req.formData();
    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const coverImageFile = formData.get("coverImage") as File | null;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    let coverImagePath: string | null = null;

    // --- Step 2 & 3: Validate and save the file if it exists ---
    if (coverImageFile) {
      // Create a new File object with the desired filename (based on the comic title)
      // This ensures the saved file has a semantic name, not the original upload name.
      const newFileName = `${generateSlug(title)}${coverImageFile.name.substring(coverImageFile.name.lastIndexOf('.'))}`;
      const renamedFile = new File([coverImageFile], newFileName, { type: coverImageFile.type });

      const uploadResult = await handleFileUpload(renamedFile, "comics/covers");

      if (uploadResult.success) {
        coverImagePath = uploadResult.filePath;
      } else {
        // handleFileUpload returns a clear error message
        return NextResponse.json({ error: uploadResult.error }, { status: 400 });
      }
    }

    // --- Step 4: Save to database ---

    const comic = await prisma.comic.create({
      data: {
        title: title,
        slug: generateSlug(title),
        description: description,
        coverImage: coverImagePath, // Save the generated path
        creatorProfileId: creatorProfile.id,
      },
      // Re-include the data needed for the DTO after creation
      include: {
        _count: { select: { episodes: true } },
        episodes: { select: { _count: { select: { posts: true } } } },
      },
    });

    // The new comic won't have a lastPostedAt date, so we can pass a version without it to the DTO
    const comicForDto = { ...comic, lastPostedAt: null };

    return NextResponse.json(
      { ok: true, comic: mapComicToDTO(comicForDto) },
      { status: 201 }
    );

  } catch (err) {
    if (err instanceof CreatorProfileNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof NextResponse) {
      // If apiAuth throws a response, forward it.
      return err;
    }

    console.error("[POST /creator/comics] Unhandled ServerError:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
