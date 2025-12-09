import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { z } from "zod";
import { handleFileUpload, deleteFile } from "@/lib/uploads";

export async function GET(req: NextRequest) {
  try {
    const session = await apiAuth([ROLES.USER]);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const profile = await prisma.creatorProfile.findUnique({
      where: { userId },
      include: {
        _count: {
          select: { subscribers: true },
        },
      },
    });

    if (!profile) {
      console.log(`[GET /creator/profile] Profile not found for userId: ${userId}`);
      return NextResponse.json({ error: `Creator profile not found for userId: ${userId}` }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error("[GET /creator/profile] Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const profileUpdateSchema = z.object({
  // This schema is now more robust to handle potentially undefined fields from FormData
  bio: z.union([z.string().max(5000), z.null(), z.undefined()]),
  website: z.union([z.string().url(), z.literal(""), z.null(), z.undefined()]),
  // The avatarUrl is a relative path, not a full URL, so we should not use .url() validation here.
  avatarUrl: z.union([z.string(), z.literal(""), z.null(), z.undefined()]),
});

export async function POST(req: NextRequest) {
  try {
    const session = await apiAuth([ROLES.USER]);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const userId = parseInt(session.user.id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const formData = await req.formData();
    const bio = formData.get("bio") as string | null;
    const website = formData.get("website") as string | null;
    const avatarFile = formData.get("avatar") as File | null;

    // Fetch the existing profile to see if there's an old avatar to delete
    const existingProfile = await prisma.creatorProfile.findUnique({
      where: { userId },
      select: { avatarUrl: true },
    });

    let newAvatarPath: string | undefined = undefined;

    if (avatarFile) {
      const uploadResult = await handleFileUpload(avatarFile, "avatars");
      if (uploadResult.success) {
        newAvatarPath = uploadResult.filePath;
      } else {
        return NextResponse.json({ error: uploadResult.error }, { status: 400 });
      }
    }

    const dataToValidate: { bio?: string | null; website?: string | null; avatarUrl?: string } = {
      bio,
      website,
    };
    if (newAvatarPath) {
      dataToValidate.avatarUrl = newAvatarPath;
    }

    const parsedBody = profileUpdateSchema.safeParse(dataToValidate);

    if (!parsedBody.success) {
      // If validation fails, and we uploaded a new file, we should delete it.
      if (newAvatarPath) await deleteFile(newAvatarPath);
      return NextResponse.json({ error: "Invalid request body", details: parsedBody.error.format() }, { status: 400 });
    }

    const profile = await prisma.creatorProfile.upsert({
      where: { userId },
      update: parsedBody.data,
      create: { ...parsedBody.data, userId },
    });

    // If a new avatar was successfully uploaded and saved, delete the old one.
    if (newAvatarPath && existingProfile?.avatarUrl) {
      await deleteFile(existingProfile.avatarUrl);
    }

    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error("[POST /creator/profile] Server Error:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
