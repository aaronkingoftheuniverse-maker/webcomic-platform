import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";
import { requireCreatorProfile } from "@/lib/creatorHelpers";

export const GET = withAuth(["USER"], async (_, user) => {
  if (!user.hasCreatorProfile) return NextResponse.json(null, { status: 404 });
  const profile = await prisma.creatorProfile.findUnique({ where: { userId: user.id } });
  return NextResponse.json(profile);
});

export const POST = withAuth(["USER"], async (req, user) => {
  if (!user.hasCreatorProfile) return NextResponse.json({ error: "Creator profile not found" }, { status: 403 });
  const body = await req.json();
  const profile = await prisma.creatorProfile.upsert({ where: { userId: user.id }, update: body, create: { ...body, userId: user.id } });
  return NextResponse.json(profile);
});
