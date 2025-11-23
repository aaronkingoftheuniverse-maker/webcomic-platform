import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";
import { mapComicToDTO } from "@/lib/dtoMappers";
import { requireCreatorProfile } from "@/lib/creatorHelpers";

async function extractComicIdSlugSafe(req: NextRequest) {
  const segments = req.nextUrl.pathname.split("/");
  const slugOrId = segments.pop();
  if (!slugOrId) return null;

  if (/^\d+$/.test(slugOrId)) return Number(slugOrId);

  const comic = await prisma.comic.findUnique({ where: { slug: slugOrId }, select: { id: true } });
  return comic?.id ?? null;
}

export const GET = withAuth(["USER"], async (req, user) => {
  const creatorProfile = await requireCreatorProfile(user.id);

  const comicId = await extractComicIdSlugSafe(req);
  if (!comicId) return NextResponse.json({ error: "Invalid comic identifier" }, { status: 400 });

  const comic = await prisma.comic.findFirst({
    where: { id: comicId, creatorProfileId: creatorProfile.id },
    include: { posts: { select: { id: true, title: true, postNumber: true, createdAt: true } } },
  });

  if (!comic) return NextResponse.json({ error: "Comic not found" }, { status: 404 });
  return NextResponse.json({ comic: mapComicToDTO(comic) });
});
