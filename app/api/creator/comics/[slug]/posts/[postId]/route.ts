// /api/creator/comics/[slug]/posts/[postId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { requireCreatorProfile } from "@/lib/creatorHelpers";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";
import { updatePostSchema } from "@/types/api/posts";
import { handleFileUpload, deleteFile } from "@/lib/uploads";
import { getBreadcrumbsForPost } from "@/lib/data/breadcrumbs";

// This forces the route to be dynamic, preventing the response from being cached.
export const dynamic = "force-dynamic";

// GET — fetch a single post
export async function GET(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await paramsPromise;
    const { slug } = params;
    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    const creatorProfile = await requireCreatorProfile(userId);

    const postId = parseInt(params.postId, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    const post = await prisma.post.findFirst({
  where: {
    id: postId,
    // Traverse from Post -> Episode -> Comic
    episode: {
      comic: {
        slug: slug,
        creatorProfileId: creatorProfile.id,
      },
    },
  },
  include: {
    images: {
      orderBy: { order: "asc" }, // It's good practice to order images
    },
    thumbnailImage: true, // Also include the thumbnail here
  },
});

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const breadcrumbs = await getBreadcrumbsForPost(post.id, '/dashboard/creator');

    return NextResponse.json({ post, breadcrumbs });
  } catch (err) {
    return handleRouteError(err);
  }
}

// PATCH — update a post
export async function PATCH(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await paramsPromise;

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const postId = parseInt(params.postId, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // Verify ownership before proceeding
    const postToUpdate = await prisma.post.findFirst({
      where: { id: postId, episode: { comic: { creatorProfile: { userId } } } },
      include: { images: true },
    });

    if (!postToUpdate) {
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
    }

    const formData = await req.formData();
    const textData: Record<string, any> = {};
    const newImageFiles: File[] = [];
    const imagesToDelete: number[] = JSON.parse(formData.get("imagesToDelete") as string || "[]");
    const newThumbnailId: string | null = formData.get("thumbnailImageId") as string | null;

    formData.forEach((value, key) => {
      if (key.startsWith("images[")) {
        newImageFiles.push(value as File);
      } else if (key !== "imagesToDelete" && key !== "thumbnailImageId") {
        textData[key] = value;
      }
    });

    const validation = updatePostSchema.safeParse(textData);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid form data", details: validation.error.format() }, { status: 400 });
    }

    const { publishedAt, ...postUpdateData } = validation.data;

    // Use a transaction to ensure all or nothing
    await prisma.$transaction(async (tx) => {
      // 1. Delete images marked for deletion
      if (imagesToDelete.length > 0) {
        const images = await tx.image.findMany({
          where: { id: { in: imagesToDelete }, postId: postId },
        });
        for (const image of images) {
          await deleteFile(image.filename);
        }
        await tx.image.deleteMany({
          where: { id: { in: imagesToDelete }, postId: postId },
        });
      }

      // 2. Upload new images and create records
      let nextOrder = postToUpdate.images.length > 0 ? Math.max(...postToUpdate.images.map(i => i.order)) + 1 : 0;
      for (const file of newImageFiles) {
        const uploadResult = await handleFileUpload(file, `posts/${postId}`);
        if (!uploadResult.success) {
          throw new Error(uploadResult.error);
        }
        await tx.image.create({
          data: {
            filename: uploadResult.filePath,
            order: nextOrder++,
            post: { connect: { id: postId } },
          },
        });
      }

      // 3. Update the post itself with text data and new thumbnail ID
      await tx.post.update({
        where: { id: postId },
        data: {
          ...postUpdateData,
          publishedAt: typeof publishedAt === 'undefined' ? undefined : (publishedAt ? new Date(publishedAt) : null),
          thumbnailImageId: newThumbnailId === 'null' ? null : (newThumbnailId ? parseInt(newThumbnailId) : undefined),
        },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleRouteError(err);
  }
}

// DELETE — delete a post
export async function DELETE(
  req: NextRequest,
  { params: paramsPromise }: { params: Promise<{ slug: string; postId: string }> }
) {
  try {
    const session = await apiAuth([ROLES.USER]);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await paramsPromise;

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });

    const postId = parseInt(params.postId, 10);
    if (isNaN(postId)) {
      return NextResponse.json({ error: "Invalid post ID" }, { status: 400 });
    }

    // Fetch post to get image paths for deletion
    const postToDelete = await prisma.post.findFirst({
      where: { id: postId, episode: { comic: { creatorProfile: { userId } } } },
      include: { images: true },
    });

    if (!postToDelete) {
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
    }

    // Delete associated files first
    for (const image of postToDelete.images) {
      await deleteFile(image.filename);
    }

    // Then delete the post record (images will be cascaded)
    const deleted = await prisma.post.deleteMany({
      where: {
        id: postId,
        episode: {
          comic: {
            slug: params.slug,
            creatorProfile: { userId },
          },
        },
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Post not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return handleRouteError(err);
  }
}

// Shared error handler
function handleRouteError(err: any) {
  if (err instanceof CreatorProfileNotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 403 });
  }
  if (err instanceof NextResponse) return err;
  console.error("[/api/creator/comics/[slug]/posts/[postId]] error:", err);
  return NextResponse.json({ error: "Server error" }, { status: 500 });
}
