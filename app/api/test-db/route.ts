import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  const comics = await prisma.comic.findMany({
    include: { posts: { include: { images: true } } },
  });
  return NextResponse.json(comics);
}
