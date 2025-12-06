import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { apiAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { z } from "zod";

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
  bio: z.string().max(5000).optional(),
  website: z.string().url().or(z.literal("")).optional(),
  avatarUrl: z.string().url().or(z.literal("")).optional(),
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

    const json = await req.json();
    const parsedBody = profileUpdateSchema.safeParse(json);

    if (!parsedBody.success) {
      return NextResponse.json({ error: "Invalid request body", details: parsedBody.error.format() }, { status: 400 });
    }

    const dataToSave = parsedBody.data;

    const profile = await prisma.creatorProfile.upsert({
      where: { userId },
      update: dataToSave,
      create: { ...dataToSave, userId },
    });

    return NextResponse.json(profile);
  } catch (err) {
    if (err instanceof NextResponse) return err;
    console.error("[POST /creator/profile] Server Error:", err);
    return NextResponse.json({ error: "Failed to save profile" }, { status: 500 });
  }
}
