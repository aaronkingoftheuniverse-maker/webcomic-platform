import { prisma } from "@/config/prisma";
import type { NextRequest } from "next/server";

type RequestWithParams = NextRequest & {
  nextUrl: URL;
  params?: { [key: string]: string | undefined };
};

/**
 * Extracts an ID or slug for a comic from either:
 * - route params: /api/creator/comics/[comicId] or /api/creator/comics/[slug]
 * - or the ?comicId= query parameter
 *
 * Returns the numeric comic ID or null.
 */
export async function extractComicId(
  req: NextRequest & { params?: { slug?: string } }
): Promise<number | null> {
  const slugOrId = req.params?.slug 
    ?? req.nextUrl.searchParams.get("comicId");

  if (!slugOrId) return null;

  // numeric ID
  if (/^\d+$/.test(slugOrId)) return Number(slugOrId);

  // slug → lookup ID
  const comic = await prisma.comic.findUnique({
    where: { slug: slugOrId },
    select: { id: true },
  });

  return comic?.id ?? null;
}

