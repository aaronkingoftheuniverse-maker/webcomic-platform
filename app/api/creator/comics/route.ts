import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { z } from "zod";
import { mapComicToDTO } from "@/lib/dtoMappers";
import { requireCreatorProfile, generateSlug } from "@/lib/creatorHelpers";
import { apiAuth } from "@/lib/auth";
import { ROLES } from "@/lib/roles";
import { CreatorProfileNotFoundError } from "@/lib/errors";

const createComicSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // 🔐 Step 1 — enforce auth
    const session = await apiAuth([ROLES.USER]);

    if (!session?.user?.id) {
      // This should not happen if apiAuth is working, but it's a good safeguard
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    // 🔍 Step 2 — creator profile check
    const creatorProfile = await requireCreatorProfile(session.user.id as number);

    // 📚 Step 3 — fetch comics
    const comics = await prisma.comic.findMany({
      where: { creatorProfileId: creatorProfile.id },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { episodes: true },
        },
        episodes: {
          select: {
            _count: {
              select: { posts: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ comics: comics.map(mapComicToDTO) });
  } catch (err) {
    if (err instanceof NextResponse) {
      // If apiAuth throws a response, forward it.
      return err;
    }
    console.error("[GET /creator/comics] Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

function handleError(err: any) {
  if (err instanceof CreatorProfileNotFoundError) {
    return NextResponse.json({ comics: [] });
  }
}


export async function POST(req: NextRequest) {
  try {
    const session = await apiAuth([ROLES.USER]);

    if (!session?.user?.id) {
      // This should not happen if apiAuth is working, but it's a good safeguard
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const creatorProfile = await requireCreatorProfile(session.user.id as number);

    const body = await req.json();
    const parsed = createComicSchema.safeParse(body);

    if (!parsed.success) {
      console.warn("[POST /creator/comics] Validation error:", parsed.error);
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const comic = await prisma.comic.create({
      data: {
        title: parsed.data.title,
        slug: generateSlug(parsed.data.title),
        description: parsed.data.description ?? null,
        creatorProfileId: creatorProfile.id,
      },
    });

    return NextResponse.json(
      { ok: true, comic: mapComicToDTO(comic) },
      { status: 201 }
    );

  } catch (err) {
    if (err instanceof CreatorProfileNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof NextResponse) {
      // If apiAuth throws a response, forward it.
      return err;
    }

    console.error("[POST /creator/comics] Unhandled Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
