import { prisma } from "@/config/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function requireCreatorProfile(userId: number) {
  const profile = await prisma.creatorProfile.findUnique({ where: { userId } });
  if (!profile) throw NextResponse.json({ error: "Creator profile not found" }, { status: 403 });
  return profile;
}

export function assertOwnership(resourceOwnerId: number, userOwnerId: number) {
  if (resourceOwnerId !== userOwnerId) {
    throw NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export function generateSlug(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "") + `-${Date.now()}`;
}

export async function getNextPostNumber(comicId: number) {
  const lastPost = await prisma.post.findFirst({
    where: { comicId },
    orderBy: { postNumber: "desc" },
  });
  return (lastPost?.postNumber || 0) + 1;
}

export const updatePostSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  appendImages: z
    .array(
      z.object({
        filename: z.string(),
        storagePath: z.string().nullable().optional(),
        storageProvider: z.string().nullable().optional(),
      })
    )
    .optional(),
});