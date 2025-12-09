import { NextRequest, NextResponse } from "next/server";
import { getComicDetails } from "@/lib/data/comics";
import { apiAuth } from "@/lib/auth"; // Using the correct API auth helper
import { prisma } from "@/config/prisma";
import { handleFileUpload, deleteFile } from "@/lib/uploads";
import { updateComicSchema } from "@/types/api/comics";

/**
 * GET /api/creator/comics/[slug]
 * Fetches all details for a specific comic for the creator dashboard.
 * Includes both published and draft content.
 */
export async function GET(
  req: NextRequest,
  { params: paramsProp }: { params: Promise<{ slug: string }> }
) {
  // apiAuth now correctly returns null on failure
  const session = await apiAuth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Await the params promise to get the actual values
  const params = await paramsProp;

  // Fetch ALL content (published and drafts) for the dashboard
  const comic = await getComicDetails(params.slug, false);

  // If the comic is not found, return a proper 404 response.
  if (!comic) {
    return NextResponse.json({ error: "Comic not found" }, { status: 404 });
  }

  // Security Check: Ensure the logged-in user owns this comic.
  // We look up the user's own creator profile ID.
  const userCreatorProfile = await prisma.creatorProfile.findUnique({
    where: { userId: parseInt(session.user.id) },
    select: { id: true },
  });

  // If the comic's creator ID doesn't match the user's creator ID, deny access.
  if (comic.creatorProfileId !== userCreatorProfile?.id) {
    return NextResponse.json({ error: "Comic not found" }, { status: 404 });
  }

  return NextResponse.json({ comic });
}

export async function PATCH(
  req: NextRequest,
  { params: paramsProp }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await apiAuth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userId = parseInt(session.user.id, 10);
    const params = await paramsProp;

    const comicToUpdate = await prisma.comic.findFirst({
      where: { slug: params.slug, creatorProfile: { userId } },
    });

    if (!comicToUpdate) {
      return NextResponse.json({ error: "Comic not found or unauthorized" }, { status: 404 });
    }

    const formData = await req.formData();
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;
    const coverImageFile = formData.get("coverImage") as File | null;
    const removeCoverImage = formData.get("removeCoverImage") === "true";

    const dataToValidate: Record<string, any> = {};
    if (title) dataToValidate.title = title;
    if (description) dataToValidate.description = description;

    const validation = updateComicSchema.safeParse(dataToValidate);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid form data", details: validation.error.format() }, { status: 400 });
    }

    let newCoverImagePath: string | null | undefined = undefined;

    if (coverImageFile) {
      const uploadResult = await handleFileUpload(coverImageFile, "comics/covers");
      if (uploadResult.success) {
        newCoverImagePath = uploadResult.filePath;
      } else {
        return NextResponse.json({ error: uploadResult.error }, { status: 400 });
      }
    } else if (removeCoverImage) {
      newCoverImagePath = null;
    }

    const updatedComic = await prisma.comic.update({
      where: { id: comicToUpdate.id },
      data: {
        ...validation.data,
        coverImage: newCoverImagePath,
      },
    });

    // If a new image was uploaded or the old one removed, delete the old file
    if (newCoverImagePath !== undefined && comicToUpdate.coverImage) {
      await deleteFile(comicToUpdate.coverImage);
    }

    // Refetch the full details to return to the client
    const comicDetails = await getComicDetails(updatedComic.slug, false);

    return NextResponse.json({ ok: true, comic: comicDetails });

  } catch (err: any) {
    console.error("[PATCH /api/creator/comics/[slug]] Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}