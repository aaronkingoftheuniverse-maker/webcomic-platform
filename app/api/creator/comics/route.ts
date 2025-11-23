import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";
import { z } from "zod";
import { mapComicToDTO } from "@/lib/dtoMappers";
import { requireCreatorProfile, generateSlug } from "@/lib/creatorHelpers";

const createComicSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const GET = withAuth(["USER"], async (_, user) => {
  const creatorProfile = await requireCreatorProfile(user.id);

  const comics = await prisma.comic.findMany({
    where: { creatorProfileId: creatorProfile.id },
    orderBy: { createdAt: "desc" },
    include: { posts: { select: { id: true, title: true, postNumber: true, createdAt: true } } },
  });

  return NextResponse.json({ comics: comics.map(mapComicToDTO) });
});

export const POST = withAuth(["USER"], async (req, user) => {
  const creatorProfile = await requireCreatorProfile(user.id);

  const parsed = createComicSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const comic = await prisma.comic.create({
    data: { title: parsed.data.title, slug: generateSlug(parsed.data.title), description: parsed.data.description ?? null, creatorProfileId: creatorProfile.id },
  });

  return NextResponse.json({ ok: true, comic: mapComicToDTO(comic) }, { status: 201 });
});
