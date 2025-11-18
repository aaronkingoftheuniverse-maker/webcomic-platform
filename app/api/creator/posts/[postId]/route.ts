// /app/api/creator/posts/[postId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";
import { mapPostToDTO } from "@/lib/dtoMappers";
import { z } from "zod";
import type { UpdatePostRequest } from "@/types/api/posts";

function extractPostId(req: NextRequest) {
  const pathname = new URL(req.url).pathname;
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.findIndex((p) => p === "posts");
  const idSegment = parts[idx + 1];
  return Number(idSegment);
}

export const GET = withAuth(["CREATOR"], async (req: NextRequest, user) => {
  const postId = extractPostId(req);
  const post = await prisma.post.findUnique({ where: { id: postId }, include: { images: true, comic: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: user.id } });
  if (!creatorProfile || post.comic.creatorProfileId !== creatorProfile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ post: mapPostToDTO(post) });
});

const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  appendImages: z.array(z.object({
    filename: z.string(),
    storagePath: z.string().nullable().optional(),
    storageProvider: z.string().nullable().optional(),
  })).optional(),
});

export const PATCH = withAuth(["CREATOR"], async (req: NextRequest, user) => {
  const postId = extractPostId(req);
  const parsed = updatePostSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const { title, description, appendImages } = parsed.data as UpdatePostRequest;

  const post = await prisma.post.findUnique({ where: { id: postId }, include: { images: true, comic: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: user.id } });
  if (!creatorProfile || post.comic.creatorProfileId !== creatorProfile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      title: title ?? post.title,
      description: Object.prototype.hasOwnProperty.call(parsed.data, "description") ? description : post.description,
      images: {
        create: appendImages?.map((img, i) => ({
          filename: img.filename,
          storagePath: img.storagePath ?? null,
          storageProvider: img.storageProvider ?? null,
          order: post.images.length + i + 1,
        })) ?? [],
      },
    },
    include: { images: true },
  });

  return NextResponse.json({ post: mapPostToDTO(updated) });
});

export const DELETE = withAuth(["CREATOR"], async (req: NextRequest, user) => {
  const postId = extractPostId(req);
  const post = await prisma.post.findUnique({ where: { id: postId }, include: { comic: true } });
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const creatorProfile = await prisma.creatorProfile.findUnique({ where: { userId: user.id } });
  if (!creatorProfile || post.comic.creatorProfileId !== creatorProfile.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.post.delete({ where: { id: postId } });
  return NextResponse.json({ ok: true });
});
