import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";
import { requireCreatorProfile, assertOwnership, updatePostSchema } from "@/lib/creatorHelpers";

// GET single post by postId in ctx.params
export const GET = withAuth(["USER"], async (_, user, ctx) => {
  const creatorProfile = await requireCreatorProfile(user.id);
  const postId = Number(ctx.params.postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { images: true, comic: { select: { creatorProfileId: true } } },
  });

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  assertOwnership(post.comic.creatorProfileId, creatorProfile.id);

  return NextResponse.json(post);
});

// PATCH update post
export const PATCH = withAuth(["USER"], async (req, user, ctx) => {
  const creatorProfile = await requireCreatorProfile(user.id);
  const postId = Number(ctx.params.postId);

  const parsed = updatePostSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { images: true, comic: { select: { creatorProfileId: true } } },
  });

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  assertOwnership(post.comic.creatorProfileId, creatorProfile.id);

  const updated = await prisma.post.update({
    where: { id: postId },
    data: {
      title: parsed.data.title ?? post.title,
      description: parsed.data.description ?? post.description,
      images: parsed.data.appendImages?.length
        ? { create: parsed.data.appendImages.map((img, i) => ({ ...img, order: post.images.length + (i + 1) })) }
        : undefined,
    },
    include: { images: true },
  });

  return NextResponse.json(updated);
});

// DELETE post
export const DELETE = withAuth(["USER"], async (_, user, ctx) => {
  const creatorProfile = await requireCreatorProfile(user.id);
  const postId = Number(ctx.params.postId);

  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { comic: { select: { creatorProfileId: true } } },
  });

  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });
  assertOwnership(post.comic.creatorProfileId, creatorProfile.id);

  await prisma.post.delete({ where: { id: postId } });

  return NextResponse.json({ ok: true });
});
