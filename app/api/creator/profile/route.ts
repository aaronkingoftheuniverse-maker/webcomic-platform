import { NextResponse } from "next/server";
import { prisma } from "@/config/prisma";
import { withAuth } from "@/lib/withAuthorization";

export const GET = withAuth(["CREATOR"], async (req, user) => {
  const profile = await prisma.creatorProfile.findUnique({
    where: { userId: user.id },
  });
  return NextResponse.json(profile);
});

export const POST = withAuth(["CREATOR"], async (req, user) => {
  const body = await req.json();
  const profile = await prisma.creatorProfile.upsert({
    where: { userId: user.id },
    update: body,
    create: { ...body, userId: user.id },
  });
  return NextResponse.json(profile);
});
