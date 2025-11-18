// /app/api/creator/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";
import { z } from "zod";
import { mapPostToDTO } from "@/lib/dtoMappers";
import type { CreatePostRequest, CreatePostResponse, FetchPostsResponse } from "@/types/api/posts";
import { extractComicId } from "@/lib/extractComicId";

/* GET - fetch posts (optionally filtered by comic via slug or id) */
export const GET = withAuth(["CREATOR"], async (req: NextRequest, user) => {
  try {
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: Number(user.id) },
    });

    if (!creatorProfile) {
      return NextResponse.json({ posts: [] }, { status: 200 });
    }

    // resolve numeric comicId (handles slugs)
    const comicId = await extractComicId(req);

    let whereClause: any = { comic: { creatorProfileId: creatorProfile.id } };

    if (comicId !== null) {
      whereClause = { comicId };
    }

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        images: true,
        comic: {
          select: { id: true, title: true, slug: true, creatorProfileId: true },
        },
      },
    });

    const dto = posts.map(mapPostToDTO);
    const response: FetchPostsResponse = { posts: dto };

    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("[posts GET] Error:", err);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
});

/* POST */
const createPostSchema = z.object({
  comicId: z.number(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  images: z
    .array(
      z.object({
        filename: z.string(),
        storagePath: z.string().nullable().optional(),
        storageProvider: z.string().nullable().optional(),
      })
    )
    .optional(),
});

export const POST = withAuth(["CREATOR"], async (req: NextRequest, user) => {
  try {
    const parsed = createPostSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const body = parsed.data as CreatePostRequest;

    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: Number(user.id) },
    });
    if (!creatorProfile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 403 }
      );
    }

    const comic = await prisma.comic.findUnique({ where: { id: body.comicId } });
    if (!comic || comic.creatorProfileId !== creatorProfile.id) {
      return NextResponse.json({ error: "You do not own this comic" }, { status: 403 });
    }

    const lastPost = await prisma.post.findFirst({
      where: { comicId: body.comicId },
      orderBy: { postNumber: "desc" },
    });

    const nextNumber = (lastPost?.postNumber || 0) + 1;

    const slugBase = body.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    const created = await prisma.post.create({
      data: {
        comicId: body.comicId,
        title: body.title,
        slug: `${slugBase}-${Date.now()}`,
        postNumber: nextNumber,
        description: body.description ?? null,
        images: {
          create:
            body.images?.map((img, i) => ({
              filename: img.filename,
              storagePath: img.storagePath ?? null,
              storageProvider: img.storageProvider ?? null,
              order: i + 1,
            })) ?? [],
        },
      },
      include: { images: true },
    });

    const dto = mapPostToDTO(created);
    const response: CreatePostResponse = { ok: true, post: dto };

    return NextResponse.json(response, { status: 201 });
  } catch (err) {
    console.error("[posts POST] Error:", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
});
