// /app/api/creator/comics/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";
import { slugify } from "@/lib/slugify";
import { z } from "zod";
import { mapComicToDTO } from "@/lib/dtoMappers";
import type { FetchComicsResponse, CreateComicRequest, CreateComicResponse } from "@/types/api/comics";

/**
 * GET /api/creator/comics
 * POST /api/creator/comics
 */

export const GET = withAuth(["CREATOR"], async (req, user) => {
  try {
    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: user.id },
    });

    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    }

    const comics = await prisma.comic.findMany({
      where: { creatorProfileId: creator.id },
      orderBy: { createdAt: "desc" },
      include: {
        // include minimal post info for listing if desired
        posts: {
          select: {
            id: true,
            title: true,
            postNumber: true,
            createdAt: true,
          },
        },
      },
    });

    const dto = comics.map(mapComicToDTO);
    const response: FetchComicsResponse = { comics: dto.map(c => ({
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      coverImage: c.coverImage,
      createdAt: c.createdAt,
    })) };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error fetching comics:", error);
    return NextResponse.json({ error: "Failed to fetch comics." }, { status: 500 });
  }
});

// POST validation schema
const createComicSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
});

export const POST = withAuth(["CREATOR"], async (req, user) => {
  try {
    const parsed = createComicSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const body = parsed.data as CreateComicRequest;

    const creator = await prisma.creatorProfile.findUnique({
      where: { userId: user.id },
    });
    if (!creator) {
      return NextResponse.json({ error: "Creator profile not found." }, { status: 404 });
    }

    const slug = slugify(body.title);

    const comic = await prisma.comic.create({
      data: {
        title: body.title,
        slug,
        description: body.description ?? null,
        creatorProfileId: creator.id,
      },
    });

    const dto = mapComicToDTO(comic);
    const response: CreateComicResponse = { ok: true, comic: dto };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Error creating comic:", error);
    return NextResponse.json({ error: "Failed to create comic." }, { status: 500 });
  }
});
