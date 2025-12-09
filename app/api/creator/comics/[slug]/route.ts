import { NextRequest, NextResponse } from "next/server";
import { getComicDetails } from "@/lib/data/comics";
import { apiAuth } from "@/lib/auth"; // Using the correct API auth helper
import { prisma } from "@/config/prisma";

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