import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";

// GET single post
export const GET = withAuth(["CREATOR"], async (req, user, ctx) => {
  const postId = Number(ctx.params.postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { images: true },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comic = await prisma.comic.findUnique({
    where: { id: post.comicId },
  });

  if (comic?.creatorProfileId !== user.creatorProfileId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json(post);
});

// PATCH update post
export const PATCH = withAuth(["CREATOR"], async (req, user, ctx) => {
  const postId = Number(ctx.params.postId);
  const { title, description, appendImages } = await req.json();

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { images: true },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comic = await prisma.comic.findUnique({
    where: { id: post.comicId },
  });

  if (comic?.creatorProfileId !== user.creatorProfileId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      title,
      description,
      images: {
        create:
          appendImages?.map((img: any, i: number) => ({
            filename: img.filename,
            storagePath: img.storagePath,
            storageProvider: img.storageProvider,
            order: post.images.length + (i + 1),
          })) ?? [],
      },
    },
    include: { images: true },
  });

  return NextResponse.json(updated);
});

// DELETE post
export const DELETE = withAuth(["CREATOR"], async (req, user, ctx) => {
  const postId = Number(ctx.params.postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
  });

  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const comic = await prisma.comic.findUnique({
    where: { id: post.comicId },
  });

  if (comic?.creatorProfileId !== user.creatorProfileId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await prisma.post.delete({ where: { id: postId } });

  return NextResponse.json({ ok: true });
});
