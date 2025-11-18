// /app/api/creator/posts/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";
import { slugify } from "@/lib/slugify"; // helper you already have

// ----------------------------------------------------
// GET /api/creator/posts → List all posts
// POST /api/creator/posts → Create new post (with images)
// ----------------------------------------------------

// ✅ GET: list all posts (already good)
export async function GET() {
  try {
    const posts = await prisma.post.findMany({
      include: {
        comic: { select: { title: true, slug: true } },
        images: { select: { filename: true, order: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error("[posts GET] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

// ✅ POST: create a new post (with optional images)
export const POST = withAuth(["CREATOR"], async (req, user) => {
  try {
    const body = await req.json();
    const { comicId, title, description, images } = body;

    if (!comicId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: comicId and title" },
        { status: 400 }
      );
    }

    // Find the creator profile for the logged-in user
    const creatorProfile = await prisma.creatorProfile.findUnique({
      where: { userId: Number(user.id) },
    });

    if (!creatorProfile) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Ensure the comic belongs to this creator
    const comic = await prisma.comic.findFirst({
      where: {
        id: Number(comicId),
        creatorProfileId: creatorProfile.id,
      },
    });

    if (!comic) {
      return NextResponse.json(
        { error: "Comic not found or not owned by this creator" },
        { status: 403 }
      );
    }

    // Get next post number for this comic
    const postCount = await prisma.post.count({ where: { comicId: comic.id } });
    const postNumber = postCount + 1;
    const slug = slugify(title);

    // Create post + optional images
    const post = await prisma.post.create({
      data: {
        title,
        description,
        slug,
        postNumber,
        comicId: comic.id,
        images: images?.length
          ? {
              create: images.map((img: any, i: number) => ({
                filename: img.filename,
                storagePath: img.storagePath ?? null,
                storageProvider: img.storageProvider ?? "local",
                order: i + 1,
              })),
            }
          : undefined,
      },
      include: { images: true },
    });

    return NextResponse.json({ success: true, post });
  } catch (err) {
    console.error("[posts POST] Error creating post:", err);
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    );
  }
});
