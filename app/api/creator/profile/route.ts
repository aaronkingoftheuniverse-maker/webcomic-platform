import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { z } from "zod";
import { saveFile } from "@/lib/fileHelpers"; // Assuming this helper exists

// This forces the route to be dynamic, preventing the response from being cached.
export const dynamic = "force-dynamic";

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
  bio: z.string().max(5000).optional().nullable(),
  website: z.string().url().or(z.literal("")).optional().nullable(),
  avatarUrl: z.string().url().or(z.literal("")).optional().nullable(),
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

    let avatarUrl: string | undefined = undefined;

    if (avatarFile) {
      try {
        // Using the same constants as the frontend for validation
        const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
        const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp"];
        avatarUrl = await saveFile(
          avatarFile,
          "avatars", // A dedicated folder for avatars
          ALLOWED_FILE_TYPES,
          MAX_FILE_SIZE_BYTES
        );
      } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    const dataToValidate: { bio?: string | null; website?: string | null; avatarUrl?: string } = { bio, website };
    if (avatarUrl) {
      dataToValidate.avatarUrl = avatarUrl;
    }

    const parsedBody = profileUpdateSchema.safeParse(dataToValidate);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsedBody.error.format() }, { status: 400 });
    }

    const profile = await prisma.creatorProfile.upsert({
      where: { userId },
      update: parsedBody.data,
      create: { ...parsedBody.data, userId },
    });

    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error("[POST /creator/profile] Server Error:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
